import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/resend";
import { getSupabaseAdmin } from "@/lib/supabase";
import {
  getAdminSession,
  applySecurityHeaders,
  verifyAdminMutationOrigin,
  escapeHtml,
  getAppBaseUrl,
} from "@/lib/adminAuth";

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

    const session = await getAdminSession(request);
    if (!session.valid) {
      return applySecurityHeaders(
        NextResponse.json(
          { success: false, error: "Non autorisé. Session administrateur requise." },
          { status: 401 }
        )
      );
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
    const membershipId =
      typeof body.membership_id === "string" ? body.membership_id.trim() : "";

    if (!membershipId || !/^[a-zA-Z0-9_-]{3,64}$/.test(membershipId)) {
      return applySecurityHeaders(
        NextResponse.json(
          { success: false, error: "Matricule du membre manquant ou invalide." },
          { status: 400 }
        )
      );
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { data: member, error: fetchErr } = await supabaseAdmin
      .from("members")
      .select("membership_id, first_name, last_name, email, phone, expires_at")
      .eq("membership_id", membershipId)
      .maybeSingle();

    if (fetchErr) {
      console.error("Erreur lecture membre notify-renewal:", fetchErr.message);
      return applySecurityHeaders(
        NextResponse.json(
          { success: false, error: "Erreur lors de la récupération du dossier membre." },
          { status: 500 }
        )
      );
    }

    if (!member) {
      return applySecurityHeaders(
        NextResponse.json(
          { success: false, error: "Membre introuvable dans le registre officiel." },
          { status: 404 }
        )
      );
    }

    const expiryFormatted = member.expires_at
      ? new Date(member.expires_at).toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : "Échue";

    const siteUrl = getAppBaseUrl();
    const safeMembershipId = escapeHtml(member.membership_id);
    const safeFirstName = escapeHtml(member.first_name);
    const safeLastName = escapeHtml(member.last_name);
    const safeExpiry = escapeHtml(expiryFormatted);
    const safePhoneDigits = String(member.phone || "").replace(/[^0-9]/g, "");

    const subject = `⚠️ [EEA] Renouvellement Obligatoire de votre Carte de Membre Annuelle - Matricule ${member.membership_id}`;

    const plainText = `AVIS OFFICIEL DE RENOUVELLEMENT DE CARTE DE MEMBRE
Étudiant Entrepreneuriat Afrique (EEA)
Secrétariat Général & Direction de l'Organisation — UCAD Dakar

Bonjour ${member.first_name} ${member.last_name},

Conformément aux statuts et au règlement intérieur de l'Étudiant Entrepreneuriat Afrique (EEA), la validité de votre carte officielle de membre arrive à échéance (ou est arrivée à son terme le ${expiryFormatted}).

IMPORTANT :
Le règlement de votre cotisation statutaire unique (3 000 FCFA) est requis pour :
- Valider la validité officielle de votre carte et de votre QR Code de certification permanente.
- Accéder aux programmes d'incubation, hackathons et financements de projets.
- Bénéficier de votre statut de membre à vie au sein du réseau continental.

MODALITÉS DE RÈGLEMENT :
- Montant unique : 3 000 FCFA (Adhésion à vie)
- Numéro officiel Trésorerie EEA : +221 78 542 53 45 (Wave & Orange Money)
- Motif du transfert : Adhésion ${member.membership_id}

Dès réception de votre transfert, le Secrétariat Général validera immédiatement votre statut permanent et vous transmettra votre carte PDF certifiée avec QR Code officiel.

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
          Matricule : <strong style="color: #ffffff; font-family: monospace;">${safeMembershipId}</strong> • Date d'échéance : <strong>${safeExpiry}</strong>
        </p>
      </div>

      <p style="font-size: 14px; line-height: 1.6; color: #e2e8f0; margin: 0 0 16px 0;">
        Bonjour <strong>${safeFirstName} ${safeLastName}</strong>,
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
          <li>Indiquer en motif : <em>Renouvellement ${safeMembershipId}</em></li>
          <li>Confirmer immédiatement par WhatsApp au <strong>+221 78 542 53 45</strong></li>
        </ul>
      </div>

      <div style="text-align: center; margin: 24px 0 12px 0;">
        <a href="https://wa.me/221785425345?text=Bonjour%20Secr%C3%A9tariat%20EEA%2C%20je%20viens%20d%27effectuer%20le%20renouvellement%20de%20ma%20carte%20membre%20(Matricule%20%3A%20${encodeURIComponent(
          member.membership_id
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

    const emailResult = await sendEmail({
      to: member.email,
      subject,
      html: htmlBody,
      text: plainText,
    });

    if (!emailResult.success) {
      return applySecurityHeaders(
        NextResponse.json(
          {
            success: false,
            error: emailResult.error || "Échec d'envoi de la notification par email.",
          },
          { status: 502 }
        )
      );
    }

    const whatsappMessage = `⚠️ *AVIS OFFICIEL EEA — ADHÉSION PERMANENTE*\n\nBonjour ${member.first_name} ${member.last_name},\n\nVotre demande d'adhésion à l'Étudiant Entrepreneuriat Afrique (Matricule : *${member.membership_id}*) est enregistrée.\n\nPour activer votre statut de membre permanent et recevoir votre carte officielle et QR code valables à vie, merci d'effectuer votre cotisation unique de *3 000 FCFA* par Wave ou Orange Money vers le numéro officiel de la trésorerie :\n👉 *+221 78 542 53 45*\n\nDès réception, le secrétariat général validera votre carte à vie et vous enverra votre badge officiel PDF.\n\n_Secrétariat Général EEA — UCAD Dakar_`;

    console.info(
      `[AUDIT ADMIN] ${session.email} a envoyé une notification de renouvellement pour ${member.membership_id}`
    );

    return applySecurityHeaders(
      NextResponse.json({
        success: true,
        emailSent: emailResult.success && !emailResult.simulated,
        emailSimulated: Boolean(emailResult.simulated),
        messageId: emailResult.messageId,
        message: emailResult.simulated
          ? `Notification de renouvellement préparée pour ${member.first_name} ${member.last_name} (${member.email}) [Mode simulation DEV].`
          : `Notification de renouvellement envoyée avec succès via Resend à ${member.email} !`,
        notification: {
          membership_id: member.membership_id,
          email: member.email,
          phone: member.phone,
          subject,
          plainText,
          whatsappUrl: `https://wa.me/${safePhoneDigits || "221785425345"}?text=${encodeURIComponent(
            whatsappMessage
          )}`,
        },
      })
    );
  } catch (error) {
    console.error("Renewal Notification Error:", error);
    return applySecurityHeaders(
      NextResponse.json(
        {
          success: false,
          error: "Erreur serveur lors de la préparation de la notification.",
        },
        { status: 500 }
      )
    );
  }
}
