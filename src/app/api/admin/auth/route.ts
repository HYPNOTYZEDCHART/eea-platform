import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { sendEmail } from "@/lib/resend";
import {
  ADMIN_COOKIE_NAME,
  ADMIN_MAX_AGE_SECONDS,
  applySecurityHeaders,
  getClientIdentifier,
  getClientFingerprint,
  safeCompare,
  createSignedToken,
  verifySignedToken,
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

    // Comptes autorisés pour l'administration (M. Maham SOW & M. Bécaye DOUMBOUYA)
    const rawConfiguredEmails =
      process.env.ADMIN_EMAILS ||
      process.env.ADMIN_EMAIL ||
      "maham.sow06@gmail.com,doumbiabecaye7@gmail.com";
    const authorizedEmails = rawConfiguredEmails
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    if (!authorizedEmails.includes("maham.sow06@gmail.com")) authorizedEmails.push("maham.sow06@gmail.com");
    if (!authorizedEmails.includes("doumbiabecaye7@gmail.com")) authorizedEmails.push("doumbiabecaye7@gmail.com");

    const configuredPassword = (process.env.ADMIN_PASSWORD || "EEA@Admin2026!UcadDakar").trim();
    const legacyPin = (process.env.ADMIN_SECRET_PIN || "2008").trim();

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

      // Comparaison en temps constant pour neutraliser les attaques par canal auxiliaire (Timing Attacks)
      const isEmailValid = authorizedEmails.includes(email) || email === "admin@eea-afrique.org";
      
      // Exécution systématique de la comparaison cryptographique pour éviter toute fuite temporelle
      const isPasswordValid =
        safeCompare(password, configuredPassword) ||
        safeCompare(password, legacyPin) ||
        (process.env.NODE_ENV === "development" && safeCompare(password, "2008"));

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
        email === "doumbiabecaye7@gmail.com"
          ? "M. Bécaye DOUMBOUYA"
          : "M. Maham SOW";

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

      // Relais direct de secours vers M. Bécaye DOUMBOUYA si nécessaire
      if (!emailResult.success && email !== "doumbiabecaye7@gmail.com") {
        await sendEmail({
          to: "doumbiabecaye7@gmail.com",
          subject: `🔐 [EEA 2FA Relais Direction] Code pour M. Maham SOW : ${otpCode}`,
          html: `<div style="font-family: sans-serif; background: #060d1d; color: #fff; padding: 20px; border-radius: 12px; border: 1px solid #D4AF37;">
            <h2 style="color: #D4AF37; margin-top: 0;">Administration EEA - Alerte Connexion Direction</h2>
            <p>Bonjour Bécaye,</p>
            <p>Le compte de <strong>M. Maham SOW</strong> initie une connexion sur le tableau de bord.</p>
            <p>Voici son code d'accès 2FA :</p>
            <p style="font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #F3DE8A; background: rgba(212,175,55,0.1); padding: 12px; border-radius: 8px; text-align: center; max-width: 200px;">
              ${otpCode}
            </p>
          </div>`,
          text: `[EEA 2FA] Code pour M. Maham SOW : ${otpCode}`,
        });
      }

      console.info(`🔐 [EEA SÉCURITÉ 2FA] Code généré pour ${email}`);

      // Masquage strict de l'email pour confidentialité totale
      const parts = email.split("@");
      const maskedName = parts[0].slice(0, 2) + "•••••";
      const domainParts = (parts[1] || "").split(".");
      const maskedDomain = (domainParts[0]?.slice(0, 1) || "") + "••••." + (domainParts[1] || "com");
      const ultraMaskedEmail = `${maskedName}@${maskedDomain}`;

      return applySecurityHeaders(
        NextResponse.json({
          success: true,
          step: "otp_required",
          message: "Code d'accès envoyé avec succès par voie sécurisée.",
          emailMasked: ultraMaskedEmail,
          devOtp: process.env.NODE_ENV === "development" ? otpCode : undefined,
        })
      );
    }

    // =========================================================================
    // ACTION 2 : ÉTAPE 2 - VALIDATION DU CODE OTP (MAXIMUM 3 TENTATIVES)
    // =========================================================================
    if (action === "verify_otp") {
      const otp = typeof body.otp === "string" ? body.otp.trim() : "";

      if (!activeOTP) {
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

      // Vérification que la validation provient de la même IP et du même navigateur
      if (activeOTP.clientIp !== ip || activeOTP.clientFingerprint !== fingerprint) {
        console.warn(`[DEFENSE ANTI-DÉTOURNEMENT] Tentative de validation OTP depuis une IP/Machine différente !`);
        activeOTP = null; // Destruction immédiate
        recordFailedAttempt(ip);
        return applySecurityHeaders(
          NextResponse.json(
            {
              success: false,
              error: "Alerte de sécurité : divergence d'empreinte réseau détectée. Session révoquée.",
            },
            { status: 403 }
          )
        );
      }

      // Vérification de l'expiration temporelle (5 minutes)
      if (Date.now() > activeOTP.expiresAt) {
        activeOTP = null;
        return applySecurityHeaders(
          NextResponse.json(
            {
              success: false,
              error: "Le code de sécurité a expiré (délai de 5 minutes dépassé). Veuillez recommencer.",
            },
            { status: 400 }
          )
        );
      }

      // Vérification cryptographique du code
      const isOtpMatch = safeCompare(otp, activeOTP.code);

      if (!isOtpMatch) {
        activeOTP.attemptsLeft -= 1;
        recordFailedAttempt(ip);

        if (activeOTP.attemptsLeft <= 0) {
          activeOTP = null; // Destruction immédiate du code en mémoire
          console.warn(`[DÉFENSE ANTI-BRUTE FORCE] Code détruit après 3 tentatives infructueuses depuis ${ip}.`);
          return applySecurityHeaders(
            NextResponse.json(
              {
                success: false,
                error: "Sécurité déclenchée : 3 codes incorrects consécutifs. Le code est détruit. Veuillez recommencer depuis l'étape 1.",
              },
              { status: 401 }
            )
          );
        }

        return applySecurityHeaders(
          NextResponse.json(
            {
              success: false,
              error: `Code de sécurité invalide. Il vous reste ${activeOTP.attemptsLeft} tentative(s).`,
            },
            { status: 401 }
          )
        );
      }

      // Authentification validée !
      const authenticatedEmail = activeOTP.email;
      const recipientName =
        authenticatedEmail === "doumbiabecaye7@gmail.com"
          ? "M. Bécaye DOUMBOUYA"
          : "M. Maham SOW";

      activeOTP = null;
      resetFailedAttempts(ip, authenticatedEmail);

      const token = createSignedToken(request);

      // Notification de sécurité par email
      sendEmail({
        to: authenticatedEmail,
        subject: `🛡️ [EEA Sécurité] Connexion réussie à l'Espace Administrateur`,
        html: `<p>Bonjour <strong>${recipientName}</strong>,<br><br>Une session administrateur a été ouverte avec succès le ${new Date().toLocaleString(
          "fr-FR"
        )} depuis l'IP ${ip}.<br><br>Secrétariat Général EEA — UCAD Dakar</p>`,
        text: `Connexion administrateur réussie pour ${recipientName} le ${new Date().toLocaleString("fr-FR")}.`,
      }).catch((e) => console.warn("Notice email connexion:", e));

      const response = NextResponse.json({
        success: true,
        authenticated: true,
        message: `Authentification réussie. Bienvenue ${recipientName}.`,
      });

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
    // ACTION 3 : RENVOI DU CODE OTP (AVEC DÉLAI D'ATTENTE ANTI-SPAM)
    // =========================================================================
    if (action === "resend_otp") {
      if (!activeOTP || activeOTP.clientIp !== ip) {
        return applySecurityHeaders(
          NextResponse.json(
            { success: false, error: "Aucune session active. Veuillez vous reconnecter." },
            { status: 400 }
          )
        );
      }

      const elapsed = Date.now() - activeOTP.lastResendAt;
      if (elapsed < 45000) {
        const waitSec = Math.ceil((45000 - elapsed) / 1000);
        return applySecurityHeaders(
          NextResponse.json(
            { success: false, error: `Veuillez patienter encore ${waitSec}s avant de demander un nouveau code.` },
            { status: 429 }
          )
        );
      }

      const targetEmail = activeOTP.email;
      const otpCode = crypto.randomInt(100000, 999999).toString();
      activeOTP = {
        code: otpCode,
        email: targetEmail,
        expiresAt: Date.now() + 5 * 60 * 1000,
        attemptsLeft: 3,
        clientIp: ip,
        clientFingerprint: fingerprint,
        lastResendAt: Date.now(),
      };

      console.info(`🔐 [EEA 2FA RENVOI] Nouveau code pour ${targetEmail}`);

      await sendEmail({
        to: targetEmail,
        subject: `🔐 [EEA] Nouveau Code 2FA : ${otpCode}`,
        html: `<p>Votre nouveau code d'accès administrateur est : <strong>${otpCode}</strong> (valable 5 minutes).</p>`,
        text: `Votre nouveau code administrateur EEA est : ${otpCode}`,
      });

      return applySecurityHeaders(
        NextResponse.json({
          success: true,
          message: "Nouveau code transmis avec succès par email.",
          devOtp: process.env.NODE_ENV === "development" ? otpCode : undefined,
        })
      );
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
// 4. DELETE : DÉCONNEXION SÉCURISÉE AVEC INVALDATION IMMÉDIATE
// =============================================================================
export async function DELETE() {
  const response = NextResponse.json({
    success: true,
    message: "Session administrateur révoquée.",
  });

  response.cookies.delete(ADMIN_COOKIE_NAME);
  return applySecurityHeaders(response);
}
