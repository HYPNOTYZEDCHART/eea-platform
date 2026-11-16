import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { applySecurityHeaders, getClientIdentifier } from "@/lib/adminAuth";
import { consumeRateLimit } from "@/lib/rateLimit";

const ALLOWED_IMAGE_MIMES = new Map<string, string>([
  ["image/jpeg", "jpg"],
  ["image/jpg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

const ALLOWED_PAYMENT_PROVIDERS = new Set([
  "wave",
  "orange_money",
  "stripe",
  "cinetpay",
  "paydunya",
  "whatsapp_manual",
]);

const ID_PATTERN = /^[a-zA-Z0-9_-]{3,64}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

function sanitizeText(value: unknown, maxLen: number): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLen);
}

function isTrustedSupabasePhotoUrl(rawUrl: string): boolean {
  const configuredUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!configuredUrl) return false;
  try {
    const parsed = new URL(rawUrl);
    const supabaseOrigin = new URL(configuredUrl);
    return parsed.protocol === "https:" && parsed.hostname === supabaseOrigin.hostname;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const ip = getClientIdentifier(req);
  const rate = consumeRateLimit("register", ip, {
    windowMs: 15 * 60 * 1000,
    maxRequests: 5,
  });

  if (!rate.allowed) {
    const res = NextResponse.json(
      {
        error: `Trop de tentatives d'inscription. Réessayez dans ${rate.retryAfterSeconds} seconde(s).`,
      },
      { status: 429 }
    );
    res.headers.set("Retry-After", String(rate.retryAfterSeconds));
    return applySecurityHeaders(res);
  }

  try {
    const rawBody: unknown = await req.json().catch(() => null);
    if (!rawBody || typeof rawBody !== "object" || Array.isArray(rawBody)) {
      return applySecurityHeaders(
        NextResponse.json({ error: "Corps de requête JSON invalide." }, { status: 400 })
      );
    }

    const body = rawBody as Record<string, unknown>;
    const cleanMembershipId = sanitizeText(body.membership_id, 64);
    const cleanFirstName = sanitizeText(body.first_name, 100);
    const cleanLastName = sanitizeText(body.last_name, 100);
    const cleanEmail = sanitizeText(body.email, 254).toLowerCase();
    const cleanPhone = sanitizeText(body.phone, 32);
    const cleanCountry = sanitizeText(body.country, 80);
    const cleanUniversity = sanitizeText(body.university, 180);
    const cleanFieldOfStudy = sanitizeText(body.field_of_study, 180);
    const cleanQrToken = sanitizeText(body.qr_code_token, 64);
    const cleanPaymentMethod = sanitizeText(body.payment_method, 32);
    const cleanPaymentRef = sanitizeText(body.payment_reference, 120);

    if (
      !cleanMembershipId ||
      !cleanFirstName ||
      !cleanLastName ||
      !cleanEmail ||
      !cleanPhone ||
      !cleanCountry ||
      !cleanUniversity ||
      !cleanFieldOfStudy ||
      !cleanQrToken
    ) {
      return applySecurityHeaders(
        NextResponse.json(
          { error: "Champs obligatoires manquants pour l'adhésion." },
          { status: 400 }
        )
      );
    }

    if (!ID_PATTERN.test(cleanMembershipId) || !ID_PATTERN.test(cleanQrToken)) {
      return applySecurityHeaders(
        NextResponse.json(
          { error: "Format de matricule ou de jeton QR invalide." },
          { status: 400 }
        )
      );
    }

    if (!EMAIL_PATTERN.test(cleanEmail)) {
      return applySecurityHeaders(
        NextResponse.json(
          { error: "Format d'adresse email invalide." },
          { status: 400 }
        )
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Traitement sécurisé de la photo côté serveur (Service Role, uniquement JPEG/PNG/WEBP)
    let finalPhotoUrl: string | null = null;
    let uploadedPhotoPath: string | null = null;

    if (typeof body.photo_url === "string" && body.photo_url.trim()) {
      const rawPhoto = body.photo_url.trim();
      if (rawPhoto.startsWith("data:")) {
        const mimeMatch = rawPhoto.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=]+)$/);
        if (!mimeMatch) {
          return applySecurityHeaders(
            NextResponse.json(
              { error: "Format d'image encodée invalide." },
              { status: 400 }
            )
          );
        }

        const mimeType = mimeMatch[1].toLowerCase();
        const ext = ALLOWED_IMAGE_MIMES.get(mimeType);
        if (!ext) {
          return applySecurityHeaders(
            NextResponse.json(
              { error: "Type d'image non autorisé. Utilisez JPEG, PNG ou WEBP." },
              { status: 400 }
            )
          );
        }

        const buffer = Buffer.from(mimeMatch[2], "base64");
        if (buffer.length === 0 || buffer.length > MAX_PHOTO_BYTES) {
          return applySecurityHeaders(
            NextResponse.json(
              { error: "La photo doit faire au maximum 5 Mo." },
              { status: 400 }
            )
          );
        }

        const fileName = `${cleanMembershipId}-${Date.now()}.${ext}`;
        const { data: uploadData, error: uploadErr } = await supabaseAdmin.storage
          .from("member-photos")
          .upload(fileName, buffer, {
            contentType: mimeType,
            upsert: true,
          });

        if (!uploadErr && uploadData) {
          uploadedPhotoPath = fileName;
          const { data: publicUrlData } = supabaseAdmin.storage
            .from("member-photos")
            .getPublicUrl(fileName);
          if (publicUrlData?.publicUrl) {
            finalPhotoUrl = publicUrlData.publicUrl;
          }
        } else if (uploadErr) {
          console.warn("Notice: Impossible d'uploader la photo dans le bucket:", uploadErr.message);
        }
      } else if (isTrustedSupabasePhotoUrl(rawPhoto)) {
        finalPhotoUrl = rawPhoto;
      }
    }

    // Sécurité stricte : Tout nouveau membre est obligatoirement "pending" jusqu'à validation
    const memberInsertData = {
      membership_id: cleanMembershipId,
      first_name: cleanFirstName,
      last_name: cleanLastName,
      email: cleanEmail,
      phone: cleanPhone,
      country: cleanCountry,
      university: cleanUniversity,
      field_of_study: cleanFieldOfStudy,
      photo_url: finalPhotoUrl,
      qr_code_token: cleanQrToken,
      status: "pending" as const,
      payment_method: cleanPaymentMethod || null,
      payment_reference: cleanPaymentRef || null,
    };

    const { data: member, error: memberErr } = await supabaseAdmin
      .from("members")
      .insert(memberInsertData)
      .select()
      .single();

    if (memberErr || !member) {
      if (uploadedPhotoPath) {
        await supabaseAdmin.storage.from("member-photos").remove([uploadedPhotoPath]).catch(() => {});
      }
      console.error("Erreur insertion Supabase:", memberErr);
      return applySecurityHeaders(
        NextResponse.json(
          { error: memberErr?.message || "Erreur lors de l'enregistrement de l'adhésion." },
          { status: 500 }
        )
      );
    }

    // Enregistrement lié dans payments avec rollback compensatoire en cas d'échec
    const normalizedProvider =
      cleanPaymentMethod === "whatsapp" ? "whatsapp_manual" : cleanPaymentMethod;
    const validProvider = ALLOWED_PAYMENT_PROVIDERS.has(normalizedProvider)
      ? normalizedProvider
      : "wave";

    const { error: paymentErr } = await supabaseAdmin.from("payments").insert({
      member_id: member.id,
      amount: 3000,
      currency: "XOF",
      provider: validProvider,
      transaction_reference: cleanPaymentRef || null,
      status: "pending",
    });

    if (paymentErr) {
      console.error("Erreur insertion paiement (rollback membre déclenché):", paymentErr.message);
      await supabaseAdmin.from("members").delete().eq("id", member.id);
      if (uploadedPhotoPath) {
        await supabaseAdmin.storage.from("member-photos").remove([uploadedPhotoPath]).catch(() => {});
      }
      return applySecurityHeaders(
        NextResponse.json(
          { error: "Erreur lors de l'initialisation du paiement. Veuillez réessayer." },
          { status: 500 }
        )
      );
    }

    return applySecurityHeaders(NextResponse.json({ success: true, member }));
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Erreur serveur lors de l'enregistrement";
    console.error("Erreur route /api/register:", err);
    return applySecurityHeaders(NextResponse.json({ error: errorMsg }, { status: 500 }));
  }
}
