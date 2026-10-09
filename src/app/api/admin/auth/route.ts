import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { sendEmail } from "@/lib/resend";
import {
  ADMIN_COOKIE_NAME,
  ADMIN_OTP_COOKIE_NAME,
  ADMIN_MAX_AGE_SECONDS,
  ADMIN_OTP_MAX_AGE_SECONDS,
  applySecurityHeaders,
  getClientIdentifier,
  getClientFingerprint,
  safeCompare,
  createOtpChallenge,
  verifyOtpChallenge,
  createSignedToken,
  verifySignedToken,
  getAuthorizedAdminEmails,
  getValidChallengePayload,
} from "@/lib/adminAuth";

// =============================================================================
// 1. DÉFENSE ANTI-BRUTE FORCE & TARPITTING
// =============================================================================
interface ActiveOTP {
  code: string;
  email: string;
  expiresAt: number;
  attemptsLeft: number;
  clientIp: string;
  clientFingerprint: string;
  lastResendAt: number;
}

let activeOTP: ActiveOTP | null = null;

interface RateLimitRecord {
  count: number;
  lockUntil: number;
  firstAttemptAt: number;
}
const rateLimitMap = new Map<string, RateLimitRecord>();

function checkRateLimit(key: string): { allowed: boolean; remainingLockMinutes?: number; delayMs: number } {
  const record = rateLimitMap.get(key);
  if (!record) return { allowed: true, delayMs: 0 };

  const now = Date.now();
  if (record.lockUntil > now) {
    const remainingLockMinutes = Math.ceil((record.lockUntil - now) / 60000);
    return { allowed: false, remainingLockMinutes, delayMs: 0 };
  }

  // Reset du verrou expiré
  if (record.lockUntil > 0 && record.lockUntil <= now) {
    rateLimitMap.delete(key);
    return { allowed: true, delayMs: 0 };
  }

  // Tarpitting : ralentissement délibéré (1,5s) pour casser les dictionnaires de mots de passe
  let delayMs = 0;
  if (record.count >= 2 && record.count < 5) {
    delayMs = 1500;
  }

  return { allowed: true, delayMs };
}

function recordFailedAttempt(ip: string, email?: string) {
  const now = Date.now();
  const update = (key: string) => {
    const rec = rateLimitMap.get(key) || { count: 0, lockUntil: 0, firstAttemptAt: now };
    rec.count += 1;

    if (rec.count >= 12) {
      // Bannissement 24h pour attaque acharnée
      rec.lockUntil = now + 24 * 60 * 60 * 1000;
      console.warn(`[DEFENSE CRITIQUE] Bannissement 24h sur ${key} (12 échecs).`);
    } else if (rec.count >= 8) {
      // 60 minutes de verrouillage
      rec.lockUntil = now + 60 * 60 * 1000;
      console.warn(`[DEFENSE NIVEAU 2] Blocage 60 min sur ${key} (8 échecs).`);
    } else if (rec.count >= 5) {
      // 15 minutes de verrouillage
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

// =============================================================================
// 2. GET : VÉRIFICATION SILENCIEUSE DU JETON DE SESSION
// =============================================================================
export async function GET(request: NextRequest) {
  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;

  if (token && verifySignedToken(token, request)) {
    return applySecurityHeaders(NextResponse.json({ authenticated: true }));
  }

  return applySecurityHeaders(NextResponse.json({ authenticated: false }, { status: 401 }));
}

// =============================================================================
// 3. POST : LOGIQUE AUTHENTIFIÉE ULTRA-SÉCURISÉE
// =============================================================================
export async function POST(request: NextRequest) {
  try {
    const ip = getClientIdentifier(request);
    const fingerprint = getClientFingerprint(request);

    // 1. Vérification du verrou d'adresse IP
    const ipRate = checkRateLimit(ip);
    if (!ipRate.allowed) {
      return applySecurityHeaders(
        NextResponse.json(
          {
            success: false,
            error: `Accès temporairement suspendu par mesure de sécurité anti-intrusion. Veuillez patienter ${ipRate.remainingLockMinutes} minute(s).`,
          },
          { status: 429 }
        )
      );
    }

    // Tarpitting forcé si suspicion d'attaque
    if (ipRate.delayMs > 0) {
      await new Promise((r) => setTimeout(r, ipRate.delayMs));
    }

    const body = await request.json().catch(() => ({}));

    // 2. PIÈGE HONEYPOT ANTI-ROBOTS (Champs cachés aux humains mais ciblés par les bots)
    if (body.website_url || body.admin_role_token || body.hp_secret) {
      rateLimitMap.set(ip, { count: 99, lockUntil: Date.now() + 2 * 60 * 60 * 1000, firstAttemptAt: Date.now() });
      console.warn(`[HONEYPOT BOT ACTIVÉ] Robot banni 2 heures depuis l'IP ${ip}.`);
      return applySecurityHeaders(
        NextResponse.json({ success: false, error: "Requête non autorisée." }, { status: 403 })
      );
    }

    const action = body.action || "login";

    // Comptes autorisés pour l'administration (stricts, aucun fallback laxiste)
    const authorizedEmails = getAuthorizedAdminEmails();
    if (authorizedEmails.length === 0) {
      console.error(
        "[ALERTE SÉCURITÉ] Aucun compte administrateur n'est configuré (variables ADMIN_EMAILS ou ADMIN_EMAIL vides)."
      );
      return applySecurityHeaders(
        NextResponse.json(
          { success: false, error: "Accès administration non configuré sur ce serveur." },
          { status: 503 }
        )
      );
    }

    const configuredPassword = (process.env.ADMIN_PASSWORD || "").trim();
    if (!configuredPassword) {
      console.error(
        "[ALERTE SÉCURITÉ] Aucun mot de passe administrateur n'est configuré (variable ADMIN_PASSWORD vide)."
      );
      return applySecurityHeaders(
        NextResponse.json(
          { success: false, error: "Configuration administrateur incomplète sur ce serveur." },
          { status: 503 }
        )
      );
    }

    // =========================================================================
    // ACTION 1 : ÉTAPE 1 - IDENTIFIANTS (Email + Mot de Passe)
    // =========================================================================
    if (action === "login") {
      const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
      const password = typeof body.password === "string" ? body.password.trim() : "";

      // Vérification du rate limit sur l'identifiant
      const emailRate = checkRateLimit(`email_${email}`);
      if (!emailRate.allowed) {
        return applySecurityHeaders(
          NextResponse.json(
            {
              success: false,
              error: `Accès temporairement suspendu par mesure de sécurité. Réessayez dans ${emailRate.remainingLockMinutes} minute(s).`,
            },
            { status: 429 }
          )
        );
      }

      // Vérification stricte sans repli de domaine laxiste
      const isEmailValid = authorizedEmails.includes(email);
      
      // Exécution systématique de la comparaison cryptographique en temps constant
      // Accepte UNIQUEMENT ADMIN_PASSWORD configuré (aucun bypass PIN ou master)
      const isPasswordValid = safeCompare(password, configuredPassword);

      if (!isEmailValid || !isPasswordValid) {
        recordFailedAttempt(ip, email);
        return applySecurityHeaders(
          NextResponse.json(
            {
              success: false,
              error: "Identifiants administrateur non reconnus. Tentative enregistrée.",
            },
            { status: 401 }
          )
        );
      }

      // Identifiants corrects : Génération du code OTP 2FA à 6 chiffres
      const otpCode = crypto.randomInt(100000, 999999).toString();
      const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes strictes

      activeOTP = {
        code: otpCode,
        email,
        expiresAt,
        attemptsLeft: 3, // Strictement 3 essais autorisés par code
        clientIp: ip,
        clientFingerprint: fingerprint,
        lastResendAt: Date.now(),
      };

      const recipientName =
        email.toLowerCase().includes("becaye")
          ? "M. Bécaye DOUMBOUYA"
          : email.toLowerCase().includes("maham")
          ? "M. Maham SOW"
          : "Membre de la Direction";

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
        Bonjour <strong>${recipientName}</strong>,
      </p>
      <p style="font-size: 13px; color: #94a3b8; margin: 0 0 24px 0;">
        Une tentative d'accès a été enregistrée pour la Direction de l'EEA. Voici votre code d'accès à usage unique (2FA) :
      </p>

      <div style="background-color: rgba(212, 175, 55, 0.12); border: 2px dashed #D4AF37; border-radius: 12px; padding: 18px; margin: 0 auto 24px auto; max-width: 260px;">
        <span style="font-family: monospace; font-size: 32px; font-weight: 900; letter-spacing: 6px; color: #F3DE8A;">
          ${otpCode}
        </span>
      </div>

      <p style="font-size: 12px; color: #f87171; margin: 0 0 8px 0; font-weight: bold;">
        ⚠️ Ce code expire dans 5 minutes (3 essais maximum avant autodestruction).
      </p>
      <p style="font-size: 11px; color: #64748b; margin: 0;">
        Connexion depuis l'adresse IP : ${ip}. Si vous n'êtes pas à l'origine de cette demande, ne divulguez jamais ce code.
      </p>
    </div>
  </div>
</body>
</html>`;

      const plainText = `[EEA SÉCURITÉ 2FA] Votre code administrateur est : ${otpCode}\n\nExpire dans 5 minutes. Destiné à ${recipientName}.`;

      // Envoi de l'email
      const emailResult = await sendEmail({
        to: email,
        subject: `🔐 [EEA] Code 2FA Direction : ${otpCode}`,
        html: htmlBody,
        text: plainText,
      });

      // Relais direct de secours vers un administrateur secondaire si l'envoi principal échoue
      const secondaryAdmin = authorizedEmails.find((e) => e !== email);
      if (!emailResult.success && secondaryAdmin) {
        await sendEmail({
          to: secondaryAdmin,
          subject: `🔐 [EEA 2FA Relais Direction] Code d'accès administrateur : ${otpCode}`,
          html: `<div style="font-family: sans-serif; background: #060d1d; color: #fff; padding: 20px; border-radius: 12px; border: 1px solid #D4AF37;">
            <h2 style="color: #D4AF37; margin-top: 0;">Administration EEA - Alerte Connexion Direction</h2>
            <p>Une tentative de connexion a été initiée pour le compte : <strong>${email}</strong>.</p>
            <p>Voici le code d'accès 2FA :</p>
            <p style="font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #F3DE8A; background: rgba(212,175,55,0.1); padding: 12px; border-radius: 8px; text-align: center; max-width: 200px;">
              ${otpCode}
            </p>
          </div>`,
          text: `[EEA 2FA] Code pour ${email} : ${otpCode}`,
        });
      }

      console.info(`🔐 [EEA SÉCURITÉ 2FA] Code généré pour ${email}`);

      // Masquage strict de l'email pour confidentialité totale
      const parts = email.split("@");
      const maskedName = parts[0].slice(0, 2) + "•••••";
      const domainParts = (parts[1] || "").split(".");
      const maskedDomain = (domainParts[0]?.slice(0, 1) || "") + "••••." + (domainParts[1] || "com");
      const ultraMaskedEmail = `${maskedName}@${maskedDomain}`;

      // Création du challenge OTP signé pour cookie HttpOnly (stateless, résilient serverless & multi-admins)
      const challengeToken = createOtpChallenge(email, otpCode, request);

      const response = NextResponse.json({
        success: true,
        step: "otp_required",
        message: "Code d'accès envoyé avec succès par voie sécurisée.",
        emailMasked: ultraMaskedEmail,
        devOtp: process.env.NODE_ENV === "development" ? otpCode : undefined,
      });

      response.cookies.set({
        name: ADMIN_OTP_COOKIE_NAME,
        value: challengeToken,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: ADMIN_OTP_MAX_AGE_SECONDS,
      });

      return applySecurityHeaders(response);
    }

    // =========================================================================
    // ACTION 2 : ÉTAPE 2 - VALIDATION DU CODE OTP (MAXIMUM 3 TENTATIVES)
    // =========================================================================
    if (action === "verify_otp") {
      const otp = typeof body.otp === "string" ? body.otp.trim() : "";
      const challengeCookie = request.cookies.get(ADMIN_OTP_COOKIE_NAME)?.value;

      // 1. Validation primaire via challenge cookie signé (stateless)
      let authEmail: string | null = null;
      let challengeError: string | null = null;
      let updatedChallenge: string | undefined = undefined;

      if (challengeCookie) {
        const check = verifyOtpChallenge(challengeCookie, otp, request);
        if (check.valid && check.email) {
          authEmail = check.email;
        } else {
          challengeError = check.error || "Code de sécurité invalide.";
          updatedChallenge = check.updatedToken;
        }
      } else if (activeOTP) {
        // Repli mémoire de secours (si cookie non encore propagé)
        if (activeOTP.clientFingerprint !== fingerprint) {
          activeOTP = null;
          recordFailedAttempt(ip);
          return applySecurityHeaders(
            NextResponse.json(
              { success: false, error: "Alerte de sécurité : divergence d'empreinte navigateur détectée." },
              { status: 403 }
            )
          );
        }

        if (Date.now() > activeOTP.expiresAt) {
          activeOTP = null;
          return applySecurityHeaders(
            NextResponse.json(
              { success: false, error: "Le code de sécurité a expiré. Veuillez recommencer." },
              { status: 400 }
            )
          );
        }

        if (safeCompare(otp, activeOTP.code)) {
          authEmail = activeOTP.email;
          activeOTP = null;
        } else {
          activeOTP.attemptsLeft -= 1;
          recordFailedAttempt(ip);
          if (activeOTP.attemptsLeft <= 0) {
            activeOTP = null;
            return applySecurityHeaders(
              NextResponse.json(
                { success: false, error: "Sécurité déclenchée : 3 codes incorrects consécutifs. Veuillez recommencer." },
                { status: 401 }
              )
            );
          }
          challengeError = `Code de sécurité invalide. Il vous reste ${activeOTP.attemptsLeft} tentative(s).`;
        }
      } else {
        return applySecurityHeaders(
          NextResponse.json(
            {
              success: false,
              error: "Aucune session de code active ou code expiré. Veuillez vous reconnecter.",
            },
            { status: 400 }
          )
        );
      }

      if (!authEmail || !authorizedEmails.includes(authEmail.toLowerCase().trim())) {
        recordFailedAttempt(ip);
        const errResponse = NextResponse.json(
          { success: false, error: challengeError || "Code de sécurité invalide ou compte non autorisé." },
          { status: 401 }
        );

        if (updatedChallenge) {
          errResponse.cookies.set({
            name: ADMIN_OTP_COOKIE_NAME,
            value: updatedChallenge,
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: ADMIN_OTP_MAX_AGE_SECONDS,
          });
        } else {
          errResponse.cookies.delete(ADMIN_OTP_COOKIE_NAME);
        }

        return applySecurityHeaders(errResponse);
      }

      // Authentification validée !
      const authenticatedEmail = authEmail;
      const recipientName =
        authenticatedEmail.toLowerCase().includes("becaye")
          ? "M. Bécaye DOUMBOUYA"
          : authenticatedEmail.toLowerCase().includes("maham")
          ? "M. Maham SOW"
          : "Membre de la Direction";

      activeOTP = null;
      resetFailedAttempts(ip, authenticatedEmail);

      const token = createSignedToken(request);

      // Notification de sécurité par email à la Direction
      const notifyRecipients = Array.from(
        new Set([authenticatedEmail, ...authorizedEmails])
      );

      const loginTimestamp = new Date().toLocaleString("fr-FR", {
        timeZone: "Africa/Dakar",
        dateStyle: "full",
        timeStyle: "medium",
      });

      for (const recipient of notifyRecipients) {
        sendEmail({
          to: recipient,
          subject: `🛡️ [EEA Sécurité] Connexion Direction Administrateur : ${recipientName}`,
          html: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #060d1d; color: #fff; padding: 24px; border-radius: 12px; border: 1px solid #D4AF37; max-width: 520px; margin: 0 auto;">
            <div style="text-align: center; border-bottom: 1px solid rgba(212,175,55,0.3); padding-bottom: 16px; margin-bottom: 20px;">
              <h2 style="color: #D4AF37; margin: 0; font-size: 18px; text-transform: uppercase; letter-spacing: 1px;">Administration EEA</h2>
              <p style="color: #94a3b8; font-size: 11px; margin: 4px 0 0 0;">Secrétariat Général • UCAD Dakar</p>
            </div>
            <p style="font-size: 14px; color: #cbd5e1; margin-bottom: 16px;">Bonjour,</p>
            <p style="font-size: 13px; color: #e2e8f0; line-height: 1.6;">
              Une session administrateur sécurisée vient d'être ouverte avec succès sur la plateforme :
            </p>
            <div style="background: #091733; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 14px 18px; margin: 16px 0; font-size: 13px;">
              <p style="margin: 4px 0; color: #cbd5e1;"><strong>Administrateur :</strong> <span style="color: #F3DE8A;">${recipientName}</span></p>
              <p style="margin: 4px 0; color: #cbd5e1;"><strong>Email de session :</strong> ${authenticatedEmail}</p>
              <p style="margin: 4px 0; color: #cbd5e1;"><strong>Date & Heure (Dakar) :</strong> ${loginTimestamp}</p>
              <p style="margin: 4px 0; color: #cbd5e1;"><strong>Adresse IP :</strong> <span style="font-family: monospace; color: #94a3b8;">${ip}</span></p>
            </div>
            <p style="font-size: 11px; color: #94a3b8; margin-top: 20px; line-height: 1.5;">
              Ce message automatique est transmis aux membres de la Direction pour assurer la traçabilité et l'audit de sécurité des accès.
            </p>
            <p style="font-size: 11px; color: #64748b; margin-top: 16px; border-top: 1px solid rgba(255,255,255,0.05); pt: 10px;">
              Étudiant Entrepreneuriat Afrique (EEA) • Pavillon E ENSEPT, UCAD Dakar
            </p>
          </div>`,
          text: `[EEA Sécurité] Connexion administrateur réussie par ${recipientName} (${authenticatedEmail}) le ${loginTimestamp} depuis l'IP ${ip}.`,
        }).catch((e) => console.warn("Notice email connexion:", e));
      }

      const response = NextResponse.json({
        success: true,
        authenticated: true,
        message: `Authentification réussie. Bienvenue ${recipientName}.`,
      });

      // Suppression du cookie OTP challenge désormais consommé
      response.cookies.delete(ADMIN_OTP_COOKIE_NAME);

      // Attribution du cookie de session officiel
      response.cookies.set({
        name: ADMIN_COOKIE_NAME,
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: ADMIN_MAX_AGE_SECONDS,
      });

      return applySecurityHeaders(response);
    }

    // =========================================================================
    // ACTION 3 : RENVOI DU CODE OTP (AVEC CONTRÔLE HMAC & DÉLAI ANTI-SPAM)
    // =========================================================================
    if (action === "resend_otp") {
      const challengeCookie = request.cookies.get(ADMIN_OTP_COOKIE_NAME)?.value;

      if (!challengeCookie) {
        return applySecurityHeaders(
          NextResponse.json(
            { success: false, error: "Aucun challenge de sécurité actif. Veuillez vous réidentifier." },
            { status: 400 }
          )
        );
      }

      // Validation cryptographique complète : signature HMAC, empreinte et expiration
      const verifiedChallenge = getValidChallengePayload(challengeCookie, request);
      if (!verifiedChallenge.valid || !verifiedChallenge.payload?.email) {
        return applySecurityHeaders(
          NextResponse.json(
            {
              success: false,
              error: verifiedChallenge.error || "Session de vérification invalide ou expirée. Veuillez vous réidentifier.",
            },
            { status: 401 }
          )
        );
      }

      const targetEmail = verifiedChallenge.payload.email.toLowerCase().trim();

      // Vérification stricte que l'email appartient aux administrateurs autorisés
      if (!authorizedEmails.includes(targetEmail)) {
        recordFailedAttempt(ip, targetEmail);
        return applySecurityHeaders(
          NextResponse.json(
            { success: false, error: "Ce compte n'est pas autorisé à recevoir des codes administrateur." },
            { status: 403 }
          )
        );
      }

      // Protection anti-spam : au moins 25 secondes d'attente entre deux renvois
      if (verifiedChallenge.payload.issuedAt && Date.now() - verifiedChallenge.payload.issuedAt < 25 * 1000) {
        const waitSec = Math.ceil((25 * 1000 - (Date.now() - verifiedChallenge.payload.issuedAt)) / 1000);
        return applySecurityHeaders(
          NextResponse.json(
            { success: false, error: `Veuillez patienter encore ${waitSec} seconde(s) avant de demander un nouveau code.` },
            { status: 429 }
          )
        );
      }

      const otpCode = crypto.randomInt(100000, 999999).toString();
      activeOTP = {
        code: otpCode,
        email: targetEmail,
        expiresAt: Date.now() + ADMIN_OTP_MAX_AGE_SECONDS * 1000,
        attemptsLeft: 3,
        clientIp: ip,
        clientFingerprint: fingerprint,
        lastResendAt: Date.now(),
      };

      console.info(`🔐 [EEA 2FA RENVOI SÉCURISÉ] Nouveau code émis pour ${targetEmail}`);

      await sendEmail({
        to: targetEmail,
        subject: `🔐 [EEA] Nouveau Code 2FA : ${otpCode}`,
        html: `<p>Votre nouveau code d'accès administrateur est : <strong>${otpCode}</strong> (valable 5 minutes).</p>`,
        text: `Votre nouveau code administrateur EEA est : ${otpCode}`,
      });

      const newChallenge = createOtpChallenge(targetEmail, otpCode, request);

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
        sameSite: "lax",
        path: "/",
        maxAge: ADMIN_OTP_MAX_AGE_SECONDS,
      });

      return applySecurityHeaders(response);
    }

    return applySecurityHeaders(NextResponse.json({ success: false, error: "Action non reconnue." }, { status: 400 }));
  } catch (err) {
    console.error("Admin Auth Error:", err);
    return applySecurityHeaders(
      NextResponse.json(
        { success: false, error: "Erreur de traitement lors de l'authentification." },
        { status: 500 }
      )
    );
  }
}

// =============================================================================
// 4. DELETE : DÉCONNEXION SÉCURISÉE AVEC INVALIDATION IMMÉDIATE
// =============================================================================
export async function DELETE() {
  const response = NextResponse.json({
    success: true,
    message: "Session administrateur révoquée.",
  });

  response.cookies.delete(ADMIN_COOKIE_NAME);
  response.cookies.delete(ADMIN_OTP_COOKIE_NAME);
  return applySecurityHeaders(response);
}
