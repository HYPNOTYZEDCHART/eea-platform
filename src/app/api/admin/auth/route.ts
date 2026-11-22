import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { sendEmail } from "@/lib/resend";
import { consumeRateLimit } from "@/lib/rateLimit";
import {
  ADMIN_COOKIE_NAME,
  ADMIN_OTP_COOKIE_NAME,
  ADMIN_MAX_AGE_SECONDS,
  ADMIN_OTP_MAX_AGE_SECONDS,
  applySecurityHeaders,
  escapeHtml,
  getClientIdentifier,
  safeCompare,
  createOtpChallenge,
  verifyOtpChallenge,
  consumeOtpChallenge,
  createSignedToken,
  getAdminSession,
  revokeAdminSession,
  getOwnerAdminEmails,
  getDevAdminConfig,
  getAuthorizedAdminEmails,
  getValidChallengePayload,
  generateCurrentTotp,
  verifyAdminMutationOrigin,
} from "@/lib/adminAuth";

// =============================================================================
// 1. DÉFENSE ANTI-BRUTE FORCE LOCALE (TARPITTING & VERROU ESCALADÉ) + DISTRIBUÉE
// =============================================================================
interface RateLimitRecord {
  count: number;
  lockUntil: number;
  firstAttemptAt: number;
}
const rateLimitMap = new Map<string, RateLimitRecord>();
const MAX_AUTH_RATE_ENTRIES = 5_000;

function pruneExpiredAuthRateLimits(now: number) {
  if (rateLimitMap.size < MAX_AUTH_RATE_ENTRIES) return;
  for (const [k, rec] of rateLimitMap.entries()) {
    if (
      (rec.lockUntil > 0 && rec.lockUntil <= now) ||
      (rec.lockUntil === 0 && now - rec.firstAttemptAt > 24 * 60 * 60 * 1000)
    ) {
      rateLimitMap.delete(k);
    }
  }
}

function checkLocalTarpit(key: string): {
  allowed: boolean;
  remainingLockMinutes?: number;
  delayMs: number;
} {
  const record = rateLimitMap.get(key);
  if (!record) return { allowed: true, delayMs: 0 };

  const now = Date.now();
  if (record.lockUntil > now) {
    const remainingLockMinutes = Math.ceil((record.lockUntil - now) / 60000);
    return { allowed: false, remainingLockMinutes, delayMs: 0 };
  }

  if (record.lockUntil > 0 && record.lockUntil <= now) {
    rateLimitMap.delete(key);
    return { allowed: true, delayMs: 0 };
  }

  let delayMs = 0;
  if (record.count >= 2 && record.count < 5) {
    delayMs = 1500;
  }

  return { allowed: true, delayMs };
}

function recordFailedAttempt(ip: string, email?: string) {
  const now = Date.now();
  pruneExpiredAuthRateLimits(now);
  const update = (key: string) => {
    const rec = rateLimitMap.get(key) || {
      count: 0,
      lockUntil: 0,
      firstAttemptAt: now,
    };
    rec.count += 1;

    if (rec.count >= 12) {
      rec.lockUntil = now + 24 * 60 * 60 * 1000;
      console.warn(`[DEFENSE CRITIQUE] Bannissement 24h sur ${key} (12 échecs).`);
    } else if (rec.count >= 8) {
      rec.lockUntil = now + 60 * 60 * 1000;
      console.warn(`[DEFENSE NIVEAU 2] Blocage 60 min sur ${key} (8 échecs).`);
    } else if (rec.count >= 5) {
      rec.lockUntil = now + 15 * 60 * 1000;
      console.warn(`[DEFENSE NIVEAU 1] Verrouillage 15 min sur ${key} (5 échecs).`);
    }

    rateLimitMap.set(key, rec);
  };

  update(ip);
  if (email) {
    update(`email_${email.toLowerCase().trim()}`);
  }
}

function resetFailedAttempts(ip: string, email?: string) {
  rateLimitMap.delete(ip);
  if (email) {
    rateLimitMap.delete(`email_${email.toLowerCase().trim()}`);
  }
}

function maskEmail(email: string): string {
  const parts = email.split("@");
  const maskedName = parts[0].slice(0, 2) + "•••••";
  const domainParts = (parts[1] || "").split(".");
  const maskedDomain =
    (domainParts[0]?.slice(0, 1) || "") +
    "••••." +
    (domainParts[1] || "com");
  return `${maskedName}@${maskedDomain}`;
}

function isDevSilentResend(): boolean {
  return (
    process.env.NODE_ENV === "development" &&
    process.env.RESEND_DEV_SILENT === "true"
  );
}

// =============================================================================
// 2. GET : VÉRIFICATION SILENCIEUSE DU JETON DE SESSION SERVEUR
// =============================================================================
export async function GET(request: NextRequest) {
  const session = await getAdminSession(request);

  if (session.valid) {
    return applySecurityHeaders(NextResponse.json({ authenticated: true }));
  }

  return applySecurityHeaders(
    NextResponse.json({ authenticated: false }, { status: 401 })
  );
}

// =============================================================================
// 3. POST : AUTHENTIFICATION 2FA (OWNER EMAIL OTP + DEV TOTP ISOLÉ)
// =============================================================================
export async function POST(request: NextRequest) {
  try {
    const csrf = verifyAdminMutationOrigin(request, { requireJson: true });
    if (!csrf.ok) {
      return applySecurityHeaders(
        NextResponse.json(
          { success: false, error: csrf.error || "Requête refusée." },
          { status: 403 }
        )
      );
    }

    const ip = getClientIdentifier(request);

    const ipLocal = checkLocalTarpit(ip);
    if (!ipLocal.allowed) {
      return applySecurityHeaders(
        NextResponse.json(
          {
            success: false,
            error: `Accès temporairement suspendu par mesure de sécurité anti-intrusion. Veuillez patienter ${ipLocal.remainingLockMinutes} minute(s).`,
          },
          { status: 429 }
        )
      );
    }

    const ipDistRate = await consumeRateLimit("admin_auth_ip", ip, {
      windowMs: 15 * 60 * 1000,
      maxRequests: 15,
    });
    if (!ipDistRate.allowed) {
      const res = NextResponse.json(
        {
          success: false,
          error: `Trop de tentatives depuis cette adresse. Réessayez dans ${ipDistRate.retryAfterSeconds} seconde(s).`,
        },
        { status: 429 }
      );
      res.headers.set("Retry-After", String(ipDistRate.retryAfterSeconds));
      return applySecurityHeaders(res);
    }

    if (ipLocal.delayMs > 0) {
      await new Promise((r) => setTimeout(r, ipLocal.delayMs));
    }

    const rawBody: unknown = await request.json().catch(() => null);
    if (!rawBody || typeof rawBody !== "object" || Array.isArray(rawBody)) {
      return applySecurityHeaders(
        NextResponse.json(
          { success: false, error: "Corps de requête JSON invalide." },
          { status: 400 }
        )
      );
    }
    const body = rawBody as Record<string, unknown>;

    if (body.website_url || body.admin_role_token || body.hp_secret) {
      rateLimitMap.set(ip, {
        count: 99,
        lockUntil: Date.now() + 2 * 60 * 60 * 1000,
        firstAttemptAt: Date.now(),
      });
      console.warn(`[HONEYPOT BOT ACTIVÉ] Robot banni 2 heures depuis l'IP ${ip}.`);
      return applySecurityHeaders(
        NextResponse.json(
          { success: false, error: "Requête non autorisée." },
          { status: 403 }
        )
      );
    }

    const action = typeof body.action === "string" ? body.action : "login";

    const ownerEmails = getOwnerAdminEmails();
    const devConfig = getDevAdminConfig();
    const authorizedEmails = getAuthorizedAdminEmails();

    if (authorizedEmails.length === 0) {
      console.error(
        "[ALERTE SÉCURITÉ] Aucun compte administrateur configuré."
      );
      return applySecurityHeaders(
        NextResponse.json(
          {
            success: false,
            error: "Accès administration non configuré sur ce serveur.",
          },
          { status: 503 }
        )
      );
    }

    const configuredPassword = (process.env.ADMIN_PASSWORD || "").trim();
    if (ownerEmails.length > 0 && !configuredPassword && !devConfig) {
      console.error("[ALERTE SÉCURITÉ] Variable ADMIN_PASSWORD vide.");
      return applySecurityHeaders(
        NextResponse.json(
          {
            success: false,
            error: "Configuration administrateur incomplète sur ce serveur.",
          },
          { status: 503 }
        )
      );
    }

    // =========================================================================
    // ACTION 1 : ÉTAPE 1 - IDENTIFIANTS (Owner vs Développeur TOTP)
    // =========================================================================
    if (action === "login") {
      const email =
        typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
      const password =
        typeof body.password === "string" ? body.password.trim() : "";

      if (!email || !password) {
        return applySecurityHeaders(
          NextResponse.json(
            { success: false, error: "Email et mot de passe requis." },
            { status: 400 }
          )
        );
      }

      const emailLocal = checkLocalTarpit(`email_${email}`);
      if (!emailLocal.allowed) {
        return applySecurityHeaders(
          NextResponse.json(
            {
              success: false,
              error: `Accès temporairement suspendu par mesure de sécurité. Réessayez dans ${emailLocal.remainingLockMinutes} minute(s).`,
            },
            { status: 429 }
          )
        );
      }

      const emailDistRate = await consumeRateLimit("admin_login_email", email, {
        windowMs: 15 * 60 * 1000,
        maxRequests: 8,
      });
      if (!emailDistRate.allowed) {
        return applySecurityHeaders(
          NextResponse.json(
            {
              success: false,
              error: `Trop de tentatives sur ce compte. Réessayez dans ${emailDistRate.retryAfterSeconds} seconde(s).`,
            },
            { status: 429 }
          )
        );
      }

      const isOwner = ownerEmails.some((allowed) => safeCompare(email, allowed));
      const isDev = Boolean(devConfig && safeCompare(email, devConfig.email));

      let isPasswordValid = false;
      if (isOwner && configuredPassword) {
        isPasswordValid = safeCompare(password, configuredPassword);
      } else if (isDev && devConfig) {
        isPasswordValid = safeCompare(password, devConfig.password);
      } else {
        // Comparaison fictive en temps constant
        safeCompare(password, configuredPassword || devConfig?.password || "dummy");
      }

      if ((!isOwner && !isDev) || !isPasswordValid) {
        recordFailedAttempt(ip, email);
        return applySecurityHeaders(
          NextResponse.json(
            {
              success: false,
              error:
                "Identifiants administrateur non reconnus. Tentative enregistrée.",
            },
            { status: 401 }
          )
        );
      }

      // Flux Développeur : 2FA TOTP autonome (aucun OTP envoyé par email à Maham)
      if (isDev && devConfig) {
        const challengeToken = await createOtpChallenge(
          email,
          null,
          request,
          "totp"
        );
        const devTotpPreview =
          process.env.NODE_ENV === "development"
            ? generateCurrentTotp(devConfig.totpSecret)
            : undefined;

        console.info(`🔐 [EEA DÉVELOPPEUR 2FA TOTP] Challenge TOTP ouvert pour ${email}`);

        const response = NextResponse.json({
          success: true,
          step: "otp_required",
          authMethod: "totp",
          message:
            "Saisissez le code à 6 chiffres de votre application Authenticator.",
          emailMasked: maskEmail(email),
          devOtp: devTotpPreview,
        });

        response.cookies.set({
          name: ADMIN_OTP_COOKIE_NAME,
          value: challengeToken,
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          path: "/",
          maxAge: ADMIN_OTP_MAX_AGE_SECONDS,
        });

        return applySecurityHeaders(response);
      }

      // Flux Propriétaire (Maham) : OTP généré et transmis par email Resend
      const otpCode = crypto.randomInt(100000, 1000000).toString();
      const safeIp = escapeHtml(ip);
      const safeEmail = escapeHtml(email);

      let delivered = false;
      if (isDevSilentResend()) {
        delivered = true;
        console.info(`[DEV SILENT] Email OTP simulé pour ${email}`);
      } else {
        const htmlBody = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #060d1d; color: #ffffff; padding: 24px 12px; margin: 0;">
  <div style="max-width: 540px; margin: 0 auto; background-color: #091733; border: 1px solid #D4AF37; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
    <div style="background: linear-gradient(135deg, #0B3C8A, #060d1d); padding: 24px; text-align: center; border-bottom: 2px solid #D4AF37;">
      <h1 style="color: #D4AF37; margin: 0; font-size: 18px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 900;">
        Étudiant Entrepreneuriat Afrique (EEA)
      </h1>
      <p style="color: #94a3b8; font-size: 11px; margin: 4px 0 0 0; text-transform: uppercase;">
        Secrétariat Général • UCAD Dakar
      </p>
    </div>

    <div style="padding: 28px 24px; text-align: center;">
      <p style="font-size: 14px; color: #cbd5e1; margin: 0 0 12px 0;">
        Bonjour <strong>Administrateur Direction EEA</strong>,
      </p>
      <p style="font-size: 13px; color: #94a3b8; margin: 0 0 24px 0;">
        Une tentative d'accès a été enregistrée pour la Direction de l'EEA (${safeEmail}). Voici votre code d'accès à usage unique (2FA) :
      </p>

      <div style="background-color: rgba(212, 175, 55, 0.12); border: 2px dashed #D4AF37; border-radius: 12px; padding: 18px; margin: 0 auto 24px auto; max-width: 260px;">
        <span style="font-family: monospace; font-size: 32px; font-weight: 900; letter-spacing: 6px; color: #F3DE8A;">
          ${otpCode}
        </span>
      </div>

      <p style="font-size: 12px; color: #f87171; margin: 0 0 8px 0; font-weight: bold;">
        ⚠️ Ce code expire dans 5 minutes (3 essais maximum avant révocation).
      </p>
      <p style="font-size: 11px; color: #64748b; margin: 0;">
        Connexion depuis l'adresse IP : ${safeIp}. Si vous n'êtes pas à l'origine de cette demande, ne divulguez jamais ce code.
      </p>
    </div>
  </div>
</body>
</html>`;

        const plainText = `[EEA SÉCURITÉ 2FA] Votre code administrateur est : ${otpCode}\n\nExpire dans 5 minutes. IP : ${ip}`;

        const emailResult = await sendEmail({
          to: email,
          subject: `🔐 [EEA] Code 2FA Direction : ${otpCode}`,
          html: htmlBody,
          text: plainText,
        });
        delivered = emailResult.success;

        const secondaryOwner = ownerEmails.find((e) => e !== email);
        if (!delivered && secondaryOwner) {
          const relayResult = await sendEmail({
            to: secondaryOwner,
            subject: `🔐 [EEA 2FA Relais Direction] Code d'accès administrateur`,
            html: `<div style="font-family: sans-serif; background: #060d1d; color: #fff; padding: 20px; border-radius: 12px; border: 1px solid #D4AF37;">
              <h2 style="color: #D4AF37; margin-top: 0;">Administration EEA - Alerte Connexion Direction</h2>
              <p>Une tentative de connexion a été initiée pour le compte : <strong>${safeEmail}</strong> (IP : ${safeIp}).</p>
              <p>Voici le code d'accès 2FA :</p>
              <p style="font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #F3DE8A; background: rgba(212,175,55,0.1); padding: 12px; border-radius: 8px; text-align: center; max-width: 200px;">
                ${otpCode}
              </p>
            </div>`,
            text: `[EEA 2FA] Code pour ${email} : ${otpCode}`,
          });
          delivered = relayResult.success;
        }
      }

      if (!delivered) {
        return applySecurityHeaders(
          NextResponse.json(
            {
              success: false,
              error:
                "Impossible d'expédier le code 2FA par email. Vérifiez la configuration du service Resend.",
            },
            { status: 502 }
          )
        );
      }

      console.info(`🔐 [EEA SÉCURITÉ 2FA] Challenge email émis pour ${email}`);

      const challengeToken = await createOtpChallenge(
        email,
        otpCode,
        request,
        "email_otp"
      );

      const response = NextResponse.json({
        success: true,
        step: "otp_required",
        authMethod: "email_otp",
        message: "Code d'accès envoyé avec succès par voie sécurisée.",
        emailMasked: maskEmail(email),
        devOtp: process.env.NODE_ENV === "development" ? otpCode : undefined,
      });

      response.cookies.set({
        name: ADMIN_OTP_COOKIE_NAME,
        value: challengeToken,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: ADMIN_OTP_MAX_AGE_SECONDS,
      });

      return applySecurityHeaders(response);
    }

    // =========================================================================
    // ACTION 2 : ÉTAPE 2 - VALIDATION OTP / TOTP & ALERTE SYNCHRONE VERS MAHAM
    // =========================================================================
    if (action === "verify_otp") {
      const otp = typeof body.otp === "string" ? body.otp.trim() : "";
      const challengeCookie = request.cookies.get(ADMIN_OTP_COOKIE_NAME)?.value;

      if (!challengeCookie) {
        return applySecurityHeaders(
          NextResponse.json(
            {
              success: false,
              error:
                "Session de challenge 2FA absente ou expirée. Veuillez vous reconnecter.",
            },
            { status: 400 }
          )
        );
      }

      if (!/^\d{6}$/.test(otp)) {
        return applySecurityHeaders(
          NextResponse.json(
            {
              success: false,
              error: "Le code 2FA doit contenir exactement 6 chiffres.",
            },
            { status: 400 }
          )
        );
      }

      const check = await verifyOtpChallenge(challengeCookie, otp, request);
      if (
        !check.valid ||
        !check.email ||
        !authorizedEmails.includes(check.email.toLowerCase().trim())
      ) {
        recordFailedAttempt(ip, check.email);
        const errResponse = NextResponse.json(
          {
            success: false,
            error:
              check.error || "Code de sécurité invalide ou challenge expiré.",
          },
          { status: 401 }
        );

        if (check.attemptsLeft === 0 || !check.attemptsLeft) {
          errResponse.cookies.delete(ADMIN_OTP_COOKIE_NAME);
        }

        return applySecurityHeaders(errResponse);
      }

      const authenticatedEmail = check.email.toLowerCase().trim();
      const isDevAccount = Boolean(
        devConfig && safeCompare(authenticatedEmail, devConfig.email)
      );

      resetFailedAttempts(ip, authenticatedEmail);
      const token = await createSignedToken(authenticatedEmail, request);

      // Notification obligatoire vers les propriétaires (Maham) — await pour garantie Serverless Vercel
      const notifyRecipients = ownerEmails;
      if (notifyRecipients.length > 0 && !isDevSilentResend()) {
        const loginTimestamp = new Date().toLocaleString("fr-FR", {
          timeZone: "Africa/Dakar",
          dateStyle: "full",
          timeStyle: "medium",
        });

        const safeAuthEmail = escapeHtml(authenticatedEmail);
        const safeTimestamp = escapeHtml(loginTimestamp);
        const safeIp = escapeHtml(ip);
        const roleLabel = isDevAccount
          ? "Compte Développeur (2FA TOTP)"
          : "Direction Administrateur (2FA Email)";
        const emailSubject = isDevAccount
          ? `🛠️ [EEA Sécurité] Connexion Développeur sur /admin`
          : `🛡️ [EEA Sécurité] Connexion Direction Administrateur`;

        await Promise.allSettled(
          notifyRecipients.map((recipient) =>
            sendEmail({
              to: recipient,
              subject: emailSubject,
              html: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #060d1d; color: #fff; padding: 24px; border-radius: 12px; border: 1px solid #D4AF37; max-width: 520px; margin: 0 auto;">
                <div style="text-align: center; border-bottom: 1px solid rgba(212,175,55,0.3); padding-bottom: 16px; margin-bottom: 20px;">
                  <h2 style="color: #D4AF37; margin: 0; font-size: 18px; text-transform: uppercase; letter-spacing: 1px;">Administration EEA</h2>
                  <p style="color: #94a3b8; font-size: 11px; margin: 4px 0 0 0;">Secrétariat Général • UCAD Dakar</p>
                </div>
                <p style="font-size: 14px; color: #cbd5e1; margin-bottom: 16px;">Bonjour,</p>
                <p style="font-size: 13px; color: #e2e8f0; line-height: 1.6;">
                  Une session d'administration vient d'être ouverte sur la plateforme :
                </p>
                <div style="background: #091733; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 14px 18px; margin: 16px 0; font-size: 13px;">
                  <p style="margin: 4px 0; color: #cbd5e1;"><strong>Profil :</strong> <span style="color: #38BDF8;">${escapeHtml(roleLabel)}</span></p>
                  <p style="margin: 4px 0; color: #cbd5e1;"><strong>Email de session :</strong> <span style="color: #F3DE8A;">${safeAuthEmail}</span></p>
                  <p style="margin: 4px 0; color: #cbd5e1;"><strong>Date & Heure (Dakar) :</strong> ${safeTimestamp}</p>
                  <p style="margin: 4px 0; color: #cbd5e1;"><strong>Adresse IP :</strong> <span style="font-family: monospace; color: #94a3b8;">${safeIp}</span></p>
                </div>
                <p style="font-size: 11px; color: #94a3b8; margin-top: 20px; line-height: 1.5;">
                  Ce message automatique est transmis au propriétaire pour la traçabilité et l'audit des accès.
                </p>
              </div>`,
              text: `[EEA Sécurité] ${roleLabel} : connexion de ${authenticatedEmail} le ${loginTimestamp} depuis l'IP ${ip}.`,
            })
          )
        );
      }

      const response = NextResponse.json({
        success: true,
        authenticated: true,
        message: "Authentification 2FA réussie. Bienvenue dans l'espace sécurisé.",
      });

      response.cookies.delete(ADMIN_OTP_COOKIE_NAME);
      response.cookies.set({
        name: ADMIN_COOKIE_NAME,
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: ADMIN_MAX_AGE_SECONDS,
      });

      return applySecurityHeaders(response);
    }

    // =========================================================================
    // ACTION 3 : RENVOI DU CODE OTP (UNIQUEMENT POUR EMAIL OTP)
    // =========================================================================
    if (action === "resend_otp") {
      const challengeCookie = request.cookies.get(ADMIN_OTP_COOKIE_NAME)?.value;

      if (!challengeCookie) {
        return applySecurityHeaders(
          NextResponse.json(
            {
              success: false,
              error:
                "Aucun challenge de sécurité actif. Veuillez vous réidentifier.",
            },
            { status: 400 }
          )
        );
      }

      const verifiedChallenge = await getValidChallengePayload(
        challengeCookie,
        request
      );
      if (!verifiedChallenge.valid || !verifiedChallenge.payload?.email) {
        return applySecurityHeaders(
          NextResponse.json(
            {
              success: false,
              error:
                verifiedChallenge.error ||
                "Session de vérification invalide ou expirée. Veuillez vous réidentifier.",
            },
            { status: 401 }
          )
        );
      }

      if (verifiedChallenge.payload.mode === "totp") {
        return applySecurityHeaders(
          NextResponse.json(
            {
              success: false,
              error:
                "Ce compte utilise votre application Authenticator (code renouvelé automatiquement toutes les 30 secondes).",
            },
            { status: 400 }
          )
        );
      }

      const targetEmail = verifiedChallenge.payload.email.toLowerCase().trim();
      if (!ownerEmails.includes(targetEmail)) {
        recordFailedAttempt(ip, targetEmail);
        return applySecurityHeaders(
          NextResponse.json(
            {
              success: false,
              error:
                "Ce compte n'est pas autorisé à recevoir des codes par email.",
            },
            { status: 403 }
          )
        );
      }

      const issuedAt = verifiedChallenge.payload.issuedAt;
      if (issuedAt && Date.now() - issuedAt < 25 * 1000) {
        const waitSec = Math.ceil((25 * 1000 - (Date.now() - issuedAt)) / 1000);
        return applySecurityHeaders(
          NextResponse.json(
            {
              success: false,
              error: `Veuillez patienter encore ${waitSec} seconde(s) avant de demander un nouveau code.`,
            },
            { status: 429 }
          )
        );
      }

      const otpCode = crypto.randomInt(100000, 1000000).toString();
      if (!isDevSilentResend()) {
        const emailSendResult = await sendEmail({
          to: targetEmail,
          subject: `🔐 [EEA] Nouveau Code 2FA : ${otpCode}`,
          html: `<p>Votre nouveau code d'accès administrateur est : <strong>${otpCode}</strong> (valable 5 minutes).</p>`,
          text: `Votre nouveau code administrateur EEA est : ${otpCode}`,
        });

        if (!emailSendResult.success) {
          return applySecurityHeaders(
            NextResponse.json(
              {
                success: false,
                error: "Échec d'envoi du nouveau code OTP par email.",
              },
              { status: 502 }
            )
          );
        }
      }

      await consumeOtpChallenge(verifiedChallenge.payload.jti);
      const newChallenge = await createOtpChallenge(
        targetEmail,
        otpCode,
        request,
        "email_otp"
      );

      console.info(`🔐 [EEA 2FA RENVOI SÉCURISÉ] Nouveau code émis pour ${targetEmail}`);

      const response = NextResponse.json({
        success: true,
        message: "Nouveau code transmis avec succès par email.",
        devOtp: process.env.NODE_ENV === "development" ? otpCode : undefined,
      });

      response.cookies.set({
        name: ADMIN_OTP_COOKIE_NAME,
        value: newChallenge,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: ADMIN_OTP_MAX_AGE_SECONDS,
      });

      return applySecurityHeaders(response);
    }

    return applySecurityHeaders(
      NextResponse.json(
        { success: false, error: "Action non reconnue." },
        { status: 400 }
      )
    );
  } catch (err) {
    console.error("Admin Auth Error:", err);
    return applySecurityHeaders(
      NextResponse.json(
        {
          success: false,
          error: "Erreur de traitement lors de l'authentification.",
        },
        { status: 500 }
      )
    );
  }
}

// =============================================================================
// 4. DELETE : DÉCONNEXION SÉCURISÉE AVEC RÉVOCATION SERVEUR IMMÉDIATE
// =============================================================================
export async function DELETE(request: NextRequest) {
  const csrf = verifyAdminMutationOrigin(request, { requireJson: false });
  if (!csrf.ok) {
    return applySecurityHeaders(
      NextResponse.json(
        { success: false, error: csrf.error || "Requête refusée." },
        { status: 403 }
      )
    );
  }

  await revokeAdminSession(request);

  const response = NextResponse.json({
    success: true,
    message: "Session administrateur révoquée.",
  });

  response.cookies.delete(ADMIN_COOKIE_NAME);
  response.cookies.delete(ADMIN_OTP_COOKIE_NAME);
  return applySecurityHeaders(response);
}
