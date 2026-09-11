import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/resend";
import { verifyAdminSession, applySecurityHeaders } from "@/lib/adminAuth";

export async function POST(request: NextRequest) {
  try {
    // 1. Authentification Zero-Trust de l'administrateur
    const isDev = process.env.NODE_ENV === "development";

    if (!isDev && !verifyAdminSession(request)) {
      return applySecurityHeaders(
        NextResponse.json(
          { success: false, error: "Non autorisé. Session administrateur requise." },
          { status: 401 }
        )
      );
    }

    const body = await request.json();
    const {
      membership_id,
      first_name,
      last_name,
      email,
      phone,
      expires_at,
    } = body;

    if (!membership_id || !email || !first_name) {
      return NextResponse.json(
        { success: false, error: "Données du membre incomplètes pour la notification." },
        { status: 400 }
      );
    }

    const expiryFormatted = expires_at
      ? new Date(expires_at).toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : "Échue";

    const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
    const proto = request.headers.get("x-forwarded-proto") || "https";
    const siteUrl = process.env.NEXT_PUBLIC_APP_URL || (host ? `${proto}://${host}` : "https://eea-platform.vercel.app");

    // 2. Préparation du sujet et du corps officiel
    const subject = `⚠️ [EEA] Renouvellement Obligatoire de votre Carte de Membre Annuelle - Matricule ${membership_id}`;

    const plainText = `AVIS OFFICIEL DE RENOUVELLEMENT DE CARTE DE MEMBRE
Étudiant Entrepreneuriat Afrique (EEA)
Secrétariat Général & Direction de l'Organisation — UCAD Dakar

Bonjour ${first_name} ${last_name},

Conformément aux statuts et au règlement intérieur de l'Étudiant Entrepreneuriat Afrique (EEA), la validité de votre carte officielle de membre arrive à échéance (ou est arrivée à son terme le ${expiryFormatted}).

IMPORTANT :
Le renouvellement annuel de votre cotisation statutaire (3 000 FCFA) est obligatoire pour :
- Maintenir la validité officielle de votre carte et de votre QR Code de certification.
- Conserver votre accès prioritaire aux programmes d'incubation, hackathons et financements de projets.
- Préserver vos droits de vote et de représentation au sein du réseau continental.

Sans renouvellement de votre cotisation, votre carte est désactivée dans le registre central officiel, son QR Code indiquera la mention « CARTE EXPIRÉE » et l'accès aux privilèges EEA sera suspendu.

MODALITÉS DE RÈGLEMENT :
- Montant annuel : 3 000 FCFA
- Numéro officiel Trésorerie EEA : +221 78 542 53 45 (Wave & Orange Money)
- Motif du transfert : Renouvellement ${membership_id}

Dès réception de votre transfert, le Secrétariat Général validera immédiatement votre renouvellement pour 1 an supplémentaire et vous transmettra votre nouvelle carte PDF certifiée avec QR Code actualisé.

Contact Trésorerie & Assistance WhatsApp : +221 78 542 53 45
Site Officiel : ${siteUrl}

Pour l'Afrique de demain,
Le Secrétariat Général EEA
Bibliothèque Centrale UCAD, Dakar, Sénégal`;

    const htmlBody = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <title>Avis de Renouvellement EEA</title>
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
      <div style="background-color: rgba(212, 175, 55, 0.1); border: 1px solid rgba(212, 175, 55, 0.4); border-radius: 10px; padding: 14px 18px; margin-bottom: 20px;">
        <p style="margin: 0; font-size: 13px; font-weight: bold; color: #F3DE8A;">
          ⚠️ AVIS OFFICIEL : ÉCHÉANCE ANNUELLE DE COTISATION
        </p>
        <p style="margin: 4px 0 0 0; font-size: 12px; color: #cbd5e1;">
          Matricule : <strong style="color: #ffffff; font-family: monospace;">${membership_id}</strong> • Date d'échéance : <strong>${expiryFormatted}</strong>
        </p>
      </div>

      <p style="font-size: 14px; line-height: 1.6; color: #e2e8f0; margin: 0 0 16px 0;">
        Bonjour <strong>${first_name} ${last_name}</strong>,
      </p>

      <p style="font-size: 13px; line-height: 1.6; color: #cbd5e1; margin: 0 0 16px 0;">
        Conformément aux statuts de l'EEA, votre adhésion et votre carte de membre doivent être renouvelées annuellement. Sans ce renouvellement, votre carte passe au statut <span style="color: #f87171; font-weight: bold;">« EXPIRÉE »</span> et l'accès à vos privilèges (incubation, concours de projets, subventions) est temporairement suspendu.
      </p>

      <div style="background-color: rgba(255, 255, 255, 0.04); border-radius: 12px; padding: 18px; border: 1px solid rgba(255,255,255,0.1); margin-bottom: 20px;">
        <h3 style="color: #D4AF37; margin: 0 0 12px 0; font-size: 14px; text-transform: uppercase;">
          Procédure de Renouvellement (3 000 FCFA) :
        </h3>
        <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #cbd5e1; line-height: 1.8;">
          <li>Transférer <strong>3 000 FCFA</strong> vers le compte officiel de la Trésorerie EEA :</li>
          <li><strong style="color: #38BDF8; font-size: 15px;">+221 78 542 53 45</strong> (Wave ou Orange Money)</li>
          <li>Indiquer en motif : <em>Renouvellement ${membership_id}</em></li>
          <li>Confirmer immédiatement par WhatsApp au <strong>+221 78 542 53 45</strong></li>
        </ul>
      </div>

      <div style="text-align: center; margin: 24px 0 12px 0;">
        <a href="https://wa.me/221785425345?text=Bonjour%20Secr%C3%A9tariat%20EEA%2C%20je%20viens%20d%27effectuer%20le%20renouvellement%20de%20ma%20carte%20membre%20(Matricule%20%3A%20${encodeURIComponent(
          membership_id
        )})%20d%27un%20montant%20de%203%20000%20FCFA." style="background: linear-gradient(135deg, #D4AF37, #F3DE8A); color: #060d1d; font-weight: bold; font-size: 13px; padding: 12px 24px; text-decoration: none; border-radius: 10px; display: inline-block;">
          Confirmer mon renouvellement sur WhatsApp (+221 78 542 53 45)
        </a>
      </div>
    </div>

    <div style="background-color: #040914; padding: 16px 24px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid rgba(255,255,255,0.05);">
      Secrétariat Général EEA • Bibliothèque Centrale UCAD, Dakar, Sénégal • contact@eea-afrique.org
    </div>
  </div>
</body>
</html>`;

    // 3. Envoi effectif de l'email via Resend
    const emailResult = await sendEmail({
      to: email,
      subject,
      html: htmlBody,
      text: plainText,
    });

    // 4. Message WhatsApp préformaté
    const whatsappMessage = `⚠️ *AVIS OFFICIEL DE RENOUVELLEMENT EEA*\n\nBonjour ${first_name} ${last_name},\n\nVotre carte de membre annuelle de l'Étudiant Entrepreneuriat Afrique (Matricule : *${membership_id}*) arrive à échéance (ou est expirée).\n\nPour conserver vos accès aux programmes d'incubation et maintenir votre carte et QR code actifs, merci de renouveler votre cotisation annuelle de *3 000 FCFA* par Wave ou Orange Money vers le numéro officiel de la trésorerie :\n👉 *+221 78 542 53 45*\n\nDès réception, le secrétariat général validera votre carte pour 1 an supplémentaire et vous enverra votre nouveau badge PDF.\n\n_Secrétariat Général EEA — UCAD Dakar_`;

    return NextResponse.json({
      success: true,
      emailSent: emailResult.success && !emailResult.simulated,
      emailSimulated: Boolean(emailResult.simulated),
      messageId: emailResult.messageId,
      message: emailResult.simulated
        ? `Notification de renouvellement préparée pour ${first_name} ${last_name} (${email}) [Mode simulation Resend].`
        : `Notification de renouvellement envoyée avec succès via Resend à ${email} !`,
      notification: {
        membership_id,
        email,
        phone,
        subject,
        plainText,
        htmlBody,
        whatsappUrl: `https://wa.me/${phone.replace(/[^0-9]/g, "") || "221785425345"}?text=${encodeURIComponent(
          whatsappMessage
        )}`,
      },
    });
  } catch (error) {
    console.error("Renewal Notification Error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur lors de la préparation de la notification." },
      { status: 500 }
    );
  }
}
