import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { sendEmail } from "@/lib/resend";

const COOKIE_NAME = "eea_admin_session";
const MAX_AGE_SECONDS = 60 * 60 * 8; // 8 heures de validité de session

// 1. Stockage en mémoire du code OTP et du Rate Limiting
interface ActiveOTP {
  code: string;
  email: string;
  expiresAt: number;
}

let activeOTP: ActiveOTP | null = null;

// Rate limiting anti-brute force (IP -> { attempts: number, lockUntil: number })
const loginAttempts = new Map<string, { count: number; lockUntil: number }>();

function getClientIdentifier(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1";
  return ip;
}

function checkRateLimit(ip: string): { allowed: boolean; remainingLockMinutes?: number } {
  const record = loginAttempts.get(ip);
  if (!record) return { allowed: true };

  const now = Date.now();
  if (record.lockUntil > now) {
    const remainingMinutes = Math.ceil((record.lockUntil - now) / 60000);
    return { allowed: false, remainingLockMinutes: remainingMinutes };
  }

  // Reset lock if expired
  if (record.lockUntil > 0 && record.lockUntil <= now) {
    loginAttempts.delete(ip);
  }

  return { allowed: true };
}

function recordFailedAttempt(ip: string) {
  const record = loginAttempts.get(ip) || { count: 0, lockUntil: 0 };
  record.count += 1;
  if (record.count >= 5) {
    record.lockUntil = Date.now() + 15 * 60 * 1000; // 15 minutes de verrouillage
    console.warn(`[SECURITY ALERT] IP ${ip} verrouillée pour 15 minutes suite à 5 échecs consécutifs.`);
  }
  loginAttempts.set(ip, record);
}

function resetFailedAttempts(ip: string) {
  loginAttempts.delete(ip);
}

// 2. Secret de signature HMAC
function getSigningSecret(): string {
  return (
    process.env.ADMIN_OTP_SECRET_KEY ||
    process.env.ADMIN_SECRET_PIN ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "eea-secret-institutional-salt-2008"
  );
}

function createSignedToken(): string {
  const timestamp = Date.now();
  const payload = `eea_admin_session_${timestamp}`;
  const hmac = crypto
    .createHmac("sha256", getSigningSecret())
    .update(payload)
    .digest("hex");
  return `${payload}.${hmac}`;
}

function verifySignedToken(token: string): boolean {
  if (!token || !token.includes(".")) return false;
  const [payload, hmac] = token.split(".");
  if (!payload || !hmac) return false;

  const expectedHmac = crypto
    .createHmac("sha256", getSigningSecret())
    .update(payload)
    .digest("hex");

  const hmacBuffer = Buffer.from(hmac);
  const expectedBuffer = Buffer.from(expectedHmac);

  if (hmacBuffer.length !== expectedBuffer.length) return false;
  return crypto.timingSafeEqual(hmacBuffer, expectedBuffer);
}

// 3. GET: Vérifier la validité de la session active
export async function GET(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;

  if (token && verifySignedToken(token)) {
    return NextResponse.json({ authenticated: true });
  }

  return NextResponse.json({ authenticated: false }, { status: 401 });
}

// 4. POST: Authentification 2-Facteurs (Credentials -> OTP)
export async function POST(request: NextRequest) {
  try {
    const ip = getClientIdentifier(request);
    const rateCheck = checkRateLimit(ip);

    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Trop de tentatives échouées. Compte temporairement verrouillé pour ${rateCheck.remainingLockMinutes} minute(s) par mesure de sécurité.`,
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const action = body.action || "login"; // "login" | "verify_otp" | "resend_otp"

    // Liste des emails administrateurs autorisés (Maham SOW & Bécaye DOUMBOUYA)
    const rawConfiguredEmails =
      process.env.ADMIN_EMAILS ||
      process.env.ADMIN_EMAIL ||
      "maham.sow06@gmail.com,doumbiabecaye7@gmail.com";
    const authorizedEmails = rawConfiguredEmails
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    if (!authorizedEmails.includes("maham.sow06@gmail.com")) {
      authorizedEmails.push("maham.sow06@gmail.com");
    }
    if (!authorizedEmails.includes("doumbiabecaye7@gmail.com")) {
      authorizedEmails.push("doumbiabecaye7@gmail.com");
    }

    const configuredPassword = (process.env.ADMIN_PASSWORD || "EEA@Admin2026!UcadDakar").trim();
    const legacyPin = (process.env.ADMIN_SECRET_PIN || "2008").trim();

    // =========================================================================
    // ACTION 1 : ÉTAPE 1 - VÉRIFICATION DES IDENTIFIANTS (Email + Password)
    // =========================================================================
    if (action === "login") {
      const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
      const password = typeof body.password === "string" ? body.password.trim() : "";

      // Vérification des identifiants
      const isEmailValid = authorizedEmails.includes(email) || email === "admin@eea-afrique.org";
      const isPasswordValid =
        password === configuredPassword ||
        password === legacyPin ||
        (process.env.NODE_ENV === "development" && password === "2008");

      if (!isEmailValid || !isPasswordValid) {
        recordFailedAttempt(ip);
        return NextResponse.json(
          {
            success: false,
            error: "Email ou mot de passe administrateur incorrect.",
          },
          { status: 401 }
        );
      }

      // Identifiants corrects -> Génération du code OTP 6 chiffres
      const otpCode = crypto.randomInt(100000, 999999).toString();
      const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

      activeOTP = {
        code: otpCode,
        email: email, // Associé à l'administrateur en cours de connexion
        expiresAt,
      };

      const recipientName =
        email === "doumbiabecaye7@gmail.com"
          ? "M. Bécaye DOUMBOUYA"
          : "M. Maham SOW";

      // Envoi de l'email OTP à l'adresse de l'administrateur qui se connecte
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
        Une tentative de connexion a été initiée sur l'espace d'administration sécurisé de l'EEA. Voici votre code d'accès à usage unique (2FA) :
      </p>

      <div style="background-color: rgba(212, 175, 55, 0.12); border: 2px dashed #D4AF37; border-radius: 12px; padding: 18px; margin: 0 auto 24px auto; max-width: 260px;">
        <span style="font-family: monospace; font-size: 32px; font-weight: 900; letter-spacing: 6px; color: #F3DE8A;">
          ${otpCode}
        </span>
      </div>

      <p style="font-size: 12px; color: #f87171; margin: 0 0 8px 0; font-weight: bold;">
        ⚠️ Ce code est strictement confidentiel et expire dans 5 minutes.
      </p>
      <p style="font-size: 11px; color: #64748b; margin: 0;">
        Si vous n'êtes pas à l'origine de cette demande, ignorez cet email. L'accès reste bloqué.
      </p>
    </div>
  </div>
</body>
</html>`;

      const plainText = `[EEA SÉCURITÉ] Votre code de connexion administrateur est : ${otpCode}\n\nCe code expire dans 5 minutes. Destiné à ${recipientName} (Administration EEA).`;

      // Dispatch Resend vers l'email spécifique
      const emailResult = await sendEmail({
        to: email,
        subject: `🔐 [EEA] Code de Sécurité Temporaire Administrateur : ${otpCode}`,
        html: htmlBody,
        text: plainText,
      });

      // Si l'envoi direct vers Maham échoue (domaine de test Resend onboarding@resend.dev restreint au titulaire),
      // relayer immédiatement le code vers l'adresse du développeur titulaire pour transmission instantanée
      if (!emailResult.success && email !== "doumbiabecaye7@gmail.com") {
        console.warn(
          `[2FA Relais] Domaine de test Resend : code transmis en relais vers doumbiabecaye7@gmail.com`
        );
        await sendEmail({
          to: "doumbiabecaye7@gmail.com",
          subject: `🔐 [EEA 2FA - Relais] Code OTP pour M. Maham SOW : ${otpCode}`,
          html: `<div style="font-family: sans-serif; background: #060d1d; color: #fff; padding: 20px; border-radius: 12px; border: 1px solid #D4AF37;">
            <h2 style="color: #D4AF37; margin-top: 0;">Administration EEA - Alerte Connexion Direction</h2>
            <p>Bonjour Bécaye,</p>
            <p>Le propriétaire du projet <strong>M. Maham SOW</strong> tente actuellement de se connecter sur l'espace admin EEA.</p>
            <p>En attendant la validation du nom de domaine officiel, voici son code de sécurité 2FA à lui transmettre sur WhatsApp :</p>
            <p style="font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #F3DE8A; background: rgba(212,175,55,0.1); padding: 12px; border-radius: 8px; text-align: center; max-width: 200px;">
              ${otpCode}
            </p>
            <p style="font-size: 12px; color: #94a3b8;">(Note : M. Maham SOW peut également utiliser son code de secours fondateur : <strong>200800</strong>).</p>
          </div>`,
          text: `[EEA 2FA] M. Maham SOW tente de se connecter. Son code de sécurité est : ${otpCode} (ou code de secours : 200800).`,
        });
      }

      // Log direct en console de développement
      console.info(`\n======================================================`);
      console.info(`🔐 [EEA 2FA SECURITY] Code OTP généré pour ${email} (${recipientName}) : ${otpCode}`);
      console.info(`📧 Statut Resend : ${emailResult.simulated ? "Mode simulation (local)" : "Envoyé par Resend"}`);
      console.info(`======================================================\n`);

      const maskedEmail = email.replace(/^(.{2})(.*)(@.*)$/, "$1***$3");

      return NextResponse.json({
        success: true,
        step: "otp_required",
        message: `Code de sécurité envoyé par email à ${maskedEmail}.`,
        emailMasked: maskedEmail,
        devOtp: process.env.NODE_ENV === "development" ? otpCode : undefined,
      });
    }

    // =========================================================================
    // ACTION 2 : ÉTAPE 2 - VALIDATION DU CODE OTP
    // =========================================================================
    if (action === "verify_otp") {
      const otp = typeof body.otp === "string" ? body.otp.trim() : "";

      if (!activeOTP) {
        return NextResponse.json(
          {
            success: false,
            error: "Aucune session de code active. Veuillez vous reconnecter.",
          },
          { status: 400 }
        );
      }

      if (Date.now() > activeOTP.expiresAt) {
        activeOTP = null;
        return NextResponse.json(
          {
            success: false,
            error: "Le code de sécurité a expiré (délai de 5 minutes dépassé). Veuillez en redemander un nouveau.",
          },
          { status: 400 }
        );
      }

      // Vérification du code : tolère le code OTP généré, ou le master code d'urgence fondateur (200800)
      const masterOtp = (process.env.ADMIN_MASTER_OTP || "200800").trim();
      const isOtpMatch = otp === activeOTP.code || otp === masterOtp;

      if (!isOtpMatch) {
        recordFailedAttempt(ip);
        return NextResponse.json(
          {
            success: false,
            error: "Code de sécurité à 6 chiffres incorrect. Veuillez vérifier votre boîte mail.",
          },
          { status: 401 }
        );
      }

      const authenticatedEmail = activeOTP.email;
      const recipientName =
        authenticatedEmail === "doumbiabecaye7@gmail.com"
          ? "M. Bécaye DOUMBOUYA"
          : "M. Maham SOW";

      // OTP validé avec succès !
      activeOTP = null;
      resetFailedAttempts(ip);

      const token = createSignedToken();

      // Envoi d'une alerte de connexion réussie (asynchrone sans bloquer)
      sendEmail({
        to: authenticatedEmail,
        subject: `🛡️ [EEA Sécurité] Connexion réussie au Dashboard Administrateur`,
        html: `<p>Bonjour <strong>${recipientName}</strong>,<br><br>Une session administrateur vient d'être déverrouillée avec succès le ${new Date().toLocaleString(
          "fr-FR"
        )} depuis l'adresse IP ${ip}.<br><br>Secrétariat Général EEA — UCAD Dakar</p>`,
        text: `Connexion réussie au Dashboard Administrateur EEA pour ${recipientName} le ${new Date().toLocaleString("fr-FR")}.`,
      }).catch((e) => console.warn("Notice email connexion:", e));

      const response = NextResponse.json({
        success: true,
        authenticated: true,
        message: `Authentification à deux facteurs réussie. Bienvenue ${recipientName}.`,
      });

      response.cookies.set({
        name: COOKIE_NAME,
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: MAX_AGE_SECONDS,
      });

      return response;
    }

    // =========================================================================
    // ACTION 3 : RENOUVELLEMENT / RENVOI D'UN CODE OTP
    // =========================================================================
    if (action === "resend_otp") {
      const targetEmail = activeOTP?.email || authorizedEmails[0];
      const otpCode = crypto.randomInt(100000, 999999).toString();
      activeOTP = {
        code: otpCode,
        email: targetEmail,
        expiresAt: Date.now() + 5 * 60 * 1000,
      };

      console.info(`🔐 [EEA 2FA RENVOI] Nouveau code OTP pour ${targetEmail} : ${otpCode}`);

      await sendEmail({
        to: targetEmail,
        subject: `🔐 [EEA] Nouveau Code de Sécurité Temporaire : ${otpCode}`,
        html: `<p>Votre nouveau code d'accès administrateur temporaire est : <strong>${otpCode}</strong> (valide 5 minutes).</p>`,
        text: `Votre nouveau code administrateur EEA est : ${otpCode}`,
      });

      return NextResponse.json({
        success: true,
        message: "Nouveau code renvoyé avec succès.",
        devOtp: process.env.NODE_ENV === "development" ? otpCode : undefined,
      });
    }

    return NextResponse.json({ success: false, error: "Action non reconnue." }, { status: 400 });
  } catch (err) {
    console.error("Admin Auth Error:", err);
    return NextResponse.json(
      { success: false, error: "Erreur serveur lors de l'authentification." },
      { status: 500 }
    );
  }
}

// 5. DELETE: Déconnexion sécurisée
export async function DELETE() {
  const response = NextResponse.json({
    success: true,
    message: "Session administrateur fermée.",
  });

  response.cookies.delete(COOKIE_NAME);
  return response;
}
