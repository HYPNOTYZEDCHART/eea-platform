import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      membership_id,
      first_name,
      last_name,
      email,
      phone,
      country,
      university,
      field_of_study,
      photo_url,
      qr_code_token,
      payment_method,
      payment_reference,
    } = body;

    // Validation des champs obligatoires
    const cleanFirstName = String(first_name || "").trim();
    const cleanLastName = String(last_name || "").trim();
    const cleanEmail = String(email || "").trim().toLowerCase();
    const cleanMembershipId = String(membership_id || "").trim();
    const cleanQrToken = String(qr_code_token || "").trim();

    if (!cleanMembershipId || !cleanFirstName || !cleanLastName || !cleanEmail || !cleanQrToken) {
      return NextResponse.json(
        { error: "Champs obligatoires manquants pour l'adhésion." },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return NextResponse.json(
        { error: "Format d'adresse email invalide." },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Traitement sécurisé de la photo côté serveur (Service Role)
    let finalPhotoUrl: string | null = null;
    if (photo_url && typeof photo_url === "string") {
      if (photo_url.startsWith("data:image/")) {
        try {
          const mimeMatch = photo_url.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,/);
          const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";
          const ext = mimeType.includes("png") ? "png" : mimeType.includes("webp") ? "webp" : "jpg";
          const base64Data = photo_url.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, "");
          const buffer = Buffer.from(base64Data, "base64");

          // Taille maximale : 5 Mo
          if (buffer.length <= 5 * 1024 * 1024) {
            const fileName = `${cleanMembershipId}-${Date.now()}.${ext}`;
            const { data: uploadData, error: uploadErr } = await supabaseAdmin.storage
              .from("member-photos")
              .upload(fileName, buffer, {
                contentType: mimeType,
                upsert: true,
              });

            if (!uploadErr && uploadData) {
              const { data: publicUrlData } = supabaseAdmin.storage
                .from("member-photos")
                .getPublicUrl(fileName);
              if (publicUrlData?.publicUrl) {
                finalPhotoUrl = publicUrlData.publicUrl;
              }
            } else if (uploadErr) {
              console.warn("Notice: Impossible d'uploader la photo dans le bucket:", uploadErr.message);
            }
          }
        } catch (photoErr) {
          console.warn("Notice: Traitement photo serveur ignoré:", photoErr);
        }
      } else if (photo_url.startsWith("http://") || photo_url.startsWith("https://")) {
        finalPhotoUrl = photo_url;
      }
    }

    // Sécurité stricte : Tout nouveau membre est obligatoirement "pending" jusqu'à validation de la trésorerie
    const safeStatus = "pending";

    const memberInsertData = {
      membership_id: cleanMembershipId,
      first_name: cleanFirstName,
      last_name: cleanLastName,
      email: cleanEmail,
      phone: String(phone || "").trim(),
      country: String(country || "").trim(),
      university: String(university || "").trim(),
      field_of_study: String(field_of_study || "").trim(),
      photo_url: finalPhotoUrl,
      qr_code_token: cleanQrToken,
      status: safeStatus,
      payment_method: payment_method ? String(payment_method).trim() : null,
      payment_reference: payment_reference ? String(payment_reference).trim() : null,
    };

    const { data: member, error: memberErr } = await supabaseAdmin
      .from("members")
      .insert(memberInsertData)
      .select()
      .single();

    if (memberErr) {
      console.error("Erreur insertion Supabase:", memberErr);
      return NextResponse.json(
        { error: memberErr.message || "Erreur lors de l'enregistrement de l'adhésion." },
        { status: 500 }
      );
    }

    // Enregistrement de la tentative de paiement dans la table payments
    if (member && member.id) {
      try {
        const allowedProviders = ["wave", "orange_money", "stripe", "cinetpay", "paydunya", "whatsapp_manual"];
        const providerName = payment_method === "whatsapp" ? "whatsapp_manual" : payment_method;
        const validProvider = allowedProviders.includes(providerName) ? providerName : "wave";

        await supabaseAdmin.from("payments").insert({
          member_id: member.id,
          amount: 3000,
          currency: "XOF",
          provider: validProvider,
          transaction_reference: payment_reference ? String(payment_reference).trim() : null,
          status: "pending",
        });
      } catch (payErr) {
        console.warn("Notice: Non-bloquant: échec insertion paiements:", payErr);
      }
    }

    return NextResponse.json({ success: true, member });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Erreur serveur lors de l'enregistrement";
    console.error("Erreur route /api/register:", err);
    return NextResponse.json(
      { error: errorMsg },
      { status: 500 }
    );
  }
}
