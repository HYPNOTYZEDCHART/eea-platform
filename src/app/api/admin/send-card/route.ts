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

    // Chargement autoritaire depuis Supabase (empêche toute usurpation ou relais d'email arbitraire)
    const supabaseAdmin = getSupabaseAdmin();
    const { data: member, error: fetchErr } = await supabaseAdmin
      .from("members")
      .select(
        "membership_id, first_name, last_name, email, university, field_of_study, qr_code_token"
      )
      .eq("membership_id", membershipId)
      .maybeSingle();

    if (fetchErr) {
      console.error("Erreur lecture membre send-card:", fetchErr.message);
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

    const baseUrl = getAppBaseUrl();
    const verifyUrl = `${baseUrl}/verify/${encodeURIComponent(member.qr_code_token)}`;

    const safeMembershipId = escapeHtml(member.membership_id);
    const safeFirstName = escapeHtml(member.first_name);
    const safeLastName = escapeHtml(member.last_name);
    const safeUniversity = escapeHtml(member.university);
    const safeField = escapeHtml(member.field_of_study);
    const safeVerifyUrl = escapeHtml(verifyUrl);

    const subject = `🎓 [EEA] Votre Carte Officielle de Membre Certifiée — Matricule ${member.membership_id}`;

    const plainText = `ÉTUDIANT ENTREPRENEURIAT AFRIQUE (EEA)
Secrétariat Général & Direction de l'Organisation — UCAD Dakar

FÉLICITATIONS ! VOTRE ADHÉSION EST OFFICIELLEMENT VALIDÉE.

Bonjour ${member.first_name} ${member.last_name},

Le Secrétariat Général de l'EEA a le plaisir de vous confirmer la validation définitive de votre adhésion au réseau continental des étudiants entrepreneurs d'Afrique.

VOS IDENTIFIANTS OFFICIELS :
- Matricule Unique : ${member.membership_id}
- Établissement : ${member.university}
- Filière : ${member.field_of_study}
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
          Matricule Officiel : <strong style="color: #ffffff; font-family: monospace;">${safeMembershipId}</strong> • Statut : <strong style="color: #34d399;">Actif</strong>
        </p>
      </div>

      <p style="font-size: 14px; line-height: 1.6; color: #e2e8f0; margin: 0 0 16px 0;">
        Bonjour <strong>${safeFirstName} ${safeLastName}</strong>,
      </p>

      <p style="font-size: 13px; line-height: 1.6; color: #cbd5e1; margin: 0 0 16px 0;">
        Le Secrétariat Général vous souhaite la bienvenue au sein de l&apos;Étudiant Entrepreneuriat Afrique (EEA). Votre cotisation d&apos;adhésion a bien été validée et enregistrée dans le registre central officiel.
      </p>

      <div style="background-color: rgba(255, 255, 255, 0.04); border-radius: 12px; padding: 18px; border: 1px solid rgba(255,255,255,0.1); margin-bottom: 20px;">
        <h3 style="color: #D4AF37; margin: 0 0 12px 0; font-size: 13px; text-transform: uppercase;">
          Récapitulatif de votre Certification :
        </h3>
        <p style="margin: 6px 0; font-size: 13px; color: #cbd5e1;"><strong>Université :</strong> ${safeUniversity}</p>
        <p style="margin: 6px 0; font-size: 13px; color: #cbd5e1;"><strong>Filière :</strong> ${safeField}</p>
        <p style="margin: 6px 0; font-size: 13px; color: #cbd5e1;"><strong>Validité :</strong> Permanente (À vie — Aucun renouvellement requis)</p>
      </div>

      <div style="text-align: center; margin: 24px 0 12px 0;">
        <a href="${safeVerifyUrl}" style="background: linear-gradient(135deg, #D4AF37, #F3DE8A); color: #060d1d; font-weight: bold; font-size: 13px; padding: 12px 24px; text-decoration: none; border-radius: 10px; display: inline-block;">
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
            error: emailResult.error || "Échec d'envoi de l'email via Resend.",
          },
          { status: 502 }
        )
      );
    }

    console.info(
      `[AUDIT ADMIN] ${session.email} a envoyé la carte par email pour ${member.membership_id}`
    );

    return applySecurityHeaders(
      NextResponse.json({
        success: true,
        emailSent: emailResult.success && !emailResult.simulated,
        emailSimulated: Boolean(emailResult.simulated),
        messageId: emailResult.messageId,
        message: emailResult.simulated
          ? `Email préparé pour ${member.first_name} ${member.last_name} (${member.email}) [Mode simulation DEV].`
          : `Carte de membre transmise avec succès par email via Resend à ${member.email} !`,
      })
    );
  } catch (error) {
    console.error("Send Card Error:", error);
    return applySecurityHeaders(
      NextResponse.json(
        {
          success: false,
          error: "Erreur serveur lors de la transmission de la carte.",
        },
        { status: 500 }
      )
    );
  }
}
