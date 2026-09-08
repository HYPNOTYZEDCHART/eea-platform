import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { sendEmail } from "@/lib/resend";

const COOKIE_NAME = "eea_admin_session";

function getSigningSecret(): string {
  return (
    process.env.ADMIN_SECRET_PIN ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "eea-secret-institutional-salt-2008"
  );
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

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get(COOKIE_NAME)?.value;
    const isDev = process.env.NODE_ENV === "development";

    if (!isDev && (!token || !verifySignedToken(token))) {
      return NextResponse.json(
        { success: false, error: "Non autorisé. Session administrateur requise." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      membership_id,
      first_name,
      last_name,
      email,
      university,
      field_of_study,
      qr_code_token,
    } = body;

    if (!membership_id || !email || !first_name) {
      return NextResponse.json(
        { success: false, error: "Informations incomplètes pour la transmission de la carte." },
        { status: 400 }
      );
    }

    const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
    const proto = request.headers.get("x-forwarded-proto") || "https";
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (host ? `${proto}://${host}` : "https://eea-platform.vercel.app");
    const verifyUrl = `${baseUrl}/verify/${qr_code_token || "eea_token_demo_0842"}`;

    const subject = `🎓 [EEA] Votre Carte Officielle de Membre Certifiée — Matricule ${membership_id}`;

    const plainText = `ÉTUDIANT ENTREPRENEURIAT AFRIQUE (EEA)
Secrétariat Général & Direction de l'Organisation — UCAD Dakar

FÉLICITATIONS ! VOTRE ADHÉSION EST OFFICIELLEMENT VALIDÉE.

Bonjour ${first_name} ${last_name},

Le Secrétariat Général de l'EEA a le plaisir de vous confirmer la validation définitive de votre adhésion au réseau continental des étudiants entrepreneurs d'Afrique.

VOS IDENTIFIANTS OFFICIELS :
- Matricule Unique : ${membership_id}
- Établissement : ${university}
- Filière : ${field_of_study}
- Statut : MEMBRE ACTIF CERTIFIÉ
- Vérification instantanée par QR Code : ${verifyUrl}

Votre carte officielle de membre au format international ISO/IEC 7810 CR80 est active. Elle vous donne accès prioritaire aux programmes d'incubation, hackathons technologiques, bourses de projets agricoles et forums économiques continentaux.

Pour toute question ou pour télécharger votre carte en PDF haute définition, contactez le secrétariat sur WhatsApp au +221 78 542 53 45.

Pour une Afrique souveraine et créatrice de richesses,
Le Secrétariat Général EEA
Bibliothèque Centrale UCAD, Dakar, Sénégal`;

    const htmlBody = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <title>Votre Carte de Membre EEA</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #060d1d; color: #f1f5f9; padding: 24px 12px; margin: 0;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #091733; border: 1px solid #D4AF37; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
    <div style="background: linear-gradient(135deg, #0B3C8A, #060d1d); padding: 28px 24px; text-align: center; border-bottom: 2px solid #D4AF37;">
      <h1 style="color: #D4AF37; margin: 0; font-size: 20px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 900;">
        Étudiant Entrepreneuriat Afrique
      </h1>
      <p style="color: #94a3b8; font-size: 11px; margin: 6px 0 0 0; text-transform: uppercase; letter-spacing: 1px;">
        Initié en 2008 à l'UCAD Dakar • Démarrage Opérationnel 2026
      </p>
    </div>

    <div style="padding: 28px 24px;">
      <div style="background-color: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.4); border-radius: 10px; padding: 14px 18px; margin-bottom: 20px;">
        <p style="margin: 0; font-size: 13px; font-weight: bold; color: #34d399;">
          ✅ FÉLICITATIONS : CARTE DE MEMBRE OFFICIELLEMENT VALIDÉE
        </p>
        <p style="margin: 4px 0 0 0; font-size: 12px; color: #cbd5e1;">
          Matricule Officiel : <strong style="color: #ffffff; font-family: monospace;">${membership_id}</strong> • Statut : <strong style="color: #34d399;">Actif</strong>
        </p>
      </div>

      <p style="font-size: 14px; line-height: 1.6; color: #e2e8f0; margin: 0 0 16px 0;">
        Bonjour <strong>${first_name} ${last_name}</strong>,
      </p>

      <p style="font-size: 13px; line-height: 1.6; color: #cbd5e1; margin: 0 0 16px 0;">
        Le Secrétariat Général vous souhaite la bienvenue au sein de l&apos;Étudiant Entrepreneuriat Afrique (EEA). Votre cotisation d&apos;adhésion a bien été validée et enregistrée dans le registre central officiel.
      </p>

      <div style="background-color: rgba(255, 255, 255, 0.04); border-radius: 12px; padding: 18px; border: 1px solid rgba(255,255,255,0.1); margin-bottom: 20px;">
        <h3 style="color: #D4AF37; margin: 0 0 12px 0; font-size: 13px; text-transform: uppercase;">
          Récapitulatif de votre Certification :
        </h3>
        <p style="margin: 6px 0; font-size: 13px; color: #cbd5e1;"><strong>Université :</strong> ${university}</p>
        <p style="margin: 6px 0; font-size: 13px; color: #cbd5e1;"><strong>Filière :</strong> ${field_of_study}</p>
        <p style="margin: 6px 0; font-size: 13px; color: #cbd5e1;"><strong>Validité :</strong> 1 an renouvelable</p>
      </div>

      <div style="text-align: center; margin: 24px 0 12px 0;">
        <a href="${verifyUrl}" style="background: linear-gradient(135deg, #D4AF37, #F3DE8A); color: #060d1d; font-weight: bold; font-size: 13px; padding: 12px 24px; text-decoration: none; border-radius: 10px; display: inline-block;">
          Vérifier mon Badge & QR Code en Ligne
        </a>
      </div>
    </div>

    <div style="background-color: #040914; padding: 16px 24px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid rgba(255,255,255,0.05);">
      Secrétariat Général EEA • Bibliothèque Centrale UCAD, Dakar, Sénégal • WhatsApp : +221 78 542 53 45
    </div>
  </div>
</body>
</html>`;

    const emailResult = await sendEmail({
      to: email,
      subject,
      html: htmlBody,
      text: plainText,
    });

    return NextResponse.json({
      success: true,
      emailSent: emailResult.success && !emailResult.simulated,
      emailSimulated: Boolean(emailResult.simulated),
      messageId: emailResult.messageId,
      message: emailResult.simulated
        ? `Email préparé pour ${first_name} ${last_name} (${email}) [Mode simulation Resend].`
        : `Carte de membre transmise avec succès par email via Resend à ${email} !`,
    });
  } catch (error) {
    console.error("Send Card Error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur lors de la transmission de la carte." },
      { status: 500 }
    );
  }
}
