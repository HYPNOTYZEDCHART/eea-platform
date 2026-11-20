import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getSupabaseAdmin } from "@/lib/supabase";
import { applySecurityHeaders, getClientIdentifier } from "@/lib/adminAuth";
import { consumeRateLimit } from "@/lib/rateLimit";

const ALLOWED_IMAGE_MIMES = new Map<string, string>([
  ["image/jpeg", "jpg"],
  ["image/jpg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

const PAYMENT_PROVIDER_MAP = new Map<string, string>([
  ["wave", "wave"],
  ["orange_money", "orange_money"],
  ["card", "stripe"],
  ["stripe", "stripe"],
  ["cinetpay", "cinetpay"],
  ["paydunya", "paydunya"],
  ["whatsapp", "whatsapp_manual"],
  ["whatsapp_manual", "whatsapp_manual"],
]);

const COUNTRY_ISO_MAP = new Map<string, string>([
  ["Sénégal", "SN"],
  ["Côte d'Ivoire", "CI"],
  ["Cameroun", "CM"],
  ["Bénin", "BJ"],
  ["Togo", "TG"],
  ["Mali", "ML"],
  ["Burkina Faso", "BF"],
  ["Guinée", "GN"],
  ["RD Congo", "CD"],
  ["Gabon", "GA"],
  ["Congo", "CG"],
  ["Niger", "NE"],
  ["Tchad", "TD"],
  ["Ghana", "GH"],
  ["Nigeria", "NG"],
  ["Diaspora - Europe (France, Belgique, etc.)", "EU"],
  ["Diaspora - Amériques (Canada, USA)", "AM"],
  ["Autre pays d'Afrique", "AF"],
]);

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+?[0-9\s().-]{6,24}$/;
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const ALNUM_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

function sanitizePlainText(value: unknown, maxLen: number): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/[\u0000-\u001F\u007F<>]/g, "")
    .trim()
    .slice(0, maxLen);
}

function resolveCountryCode(country: string): string {
  const mapped = COUNTRY_ISO_MAP.get(country);
  if (mapped) return mapped;
  const normalized = country
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z]/g, "")
    .slice(0, 2)
    .toUpperCase();
  return normalized.length === 2 ? normalized : "AF";
}

function generateSecureCode(length: number): string {
  const bytes = crypto.randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += ALNUM_ALPHABET[bytes[i] % ALNUM_ALPHABET.length];
  }
  return out;
}

function generateServerMembershipId(country: string): string {
  const year = new Date().getUTCFullYear();
  const code = resolveCountryCode(country);
  return `EEA-${year}-${code}-${generateSecureCode(6)}`;
}

function generateServerQrToken(): string {
  return `eea_tok_${crypto.randomBytes(18).toString("hex")}`;
}

function hasValidImageMagicBytes(buffer: Buffer, mimeType: string): boolean {
  if (mimeType === "image/jpeg" || mimeType === "image/jpg") {
    return (
      buffer.length >= 3 &&
      buffer[0] === 0xff &&
      buffer[1] === 0xd8 &&
      buffer[2] === 0xff
    );
  }
  if (mimeType === "image/png") {
    const pngSig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    return buffer.length >= 8 && buffer.subarray(0, 8).equals(pngSig);
  }
  if (mimeType === "image/webp") {
    return (
      buffer.length >= 12 &&
      buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
      buffer.subarray(8, 12).toString("ascii") === "WEBP"
    );
  }
  return false;
}

export async function POST(req: NextRequest) {
  const ip = getClientIdentifier(req);
  const rate = await consumeRateLimit("register", ip, {
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

  const contentType = req.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return applySecurityHeaders(
      NextResponse.json(
        { error: "Content-Type application/json requis." },
        { status: 415 }
      )
    );
  }

  try {
    const rawBody: unknown = await req.json().catch(() => null);
    if (!rawBody || typeof rawBody !== "object" || Array.isArray(rawBody)) {
      return applySecurityHeaders(
        NextResponse.json(
          { error: "Corps de requête JSON invalide." },
          { status: 400 }
        )
      );
    }

    const body = rawBody as Record<string, unknown>;
    const cleanFirstName = sanitizePlainText(body.first_name, 100);
    const cleanLastName = sanitizePlainText(body.last_name, 100);
    const cleanEmail = sanitizePlainText(body.email, 254).toLowerCase();
    const cleanPhone = sanitizePlainText(body.phone, 24);
    const cleanCountry = sanitizePlainText(body.country, 80);
    const cleanUniversity = sanitizePlainText(body.university, 180);
    const cleanFieldOfStudy = sanitizePlainText(body.field_of_study, 180);
    const rawPaymentMethod = sanitizePlainText(body.payment_method, 32).toLowerCase();
    const cleanPaymentRef = sanitizePlainText(body.payment_reference, 120);

    if (
      !cleanFirstName ||
      !cleanLastName ||
      !cleanEmail ||
      !cleanPhone ||
      !cleanCountry ||
      !cleanUniversity ||
      !cleanFieldOfStudy
    ) {
      return applySecurityHeaders(
        NextResponse.json(
          { error: "Champs obligatoires manquants pour l'adhésion." },
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

    if (!PHONE_PATTERN.test(cleanPhone)) {
      return applySecurityHeaders(
        NextResponse.json(
          { error: "Format de numéro de téléphone invalide." },
          { status: 400 }
        )
      );
    }

    const validProvider = PAYMENT_PROVIDER_MAP.get(rawPaymentMethod) || "wave";
    const supabaseAdmin = getSupabaseAdmin();

    // Empêcher la réutilisation d'une même référence de paiement
    if (cleanPaymentRef) {
      const { data: existingRef } = await supabaseAdmin
        .from("payments")
        .select("id")
        .eq("transaction_reference", cleanPaymentRef)
        .limit(1)
        .maybeSingle();

      if (existingRef) {
        return applySecurityHeaders(
          NextResponse.json(
            {
              error:
                "Cette référence de paiement est déjà associée à une autre demande d'adhésion.",
            },
            { status: 409 }
          )
        );
      }
    }

    // Traitement sécurisé de la photo côté serveur (strictement base64 + vérification magic bytes)
    let finalPhotoUrl: string | null = null;
    let uploadedPhotoPath: string | null = null;

    if (typeof body.photo_url === "string" && body.photo_url.trim()) {
      const rawPhoto = body.photo_url.trim();
      const mimeMatch = rawPhoto.match(
        /^data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=]+)$/
      );
      if (!mimeMatch) {
        return applySecurityHeaders(
          NextResponse.json(
            { error: "Format de photo invalide. Veuillez capturer ou importer une image valide." },
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

      if (!hasValidImageMagicBytes(buffer, mimeType)) {
        return applySecurityHeaders(
          NextResponse.json(
            {
              error:
                "Le contenu binaire de la photo ne correspond pas à un fichier image valide.",
            },
            { status: 400 }
          )
        );
      }

      const fileName = `photos/${crypto.randomUUID()}.${ext}`;
      const { data: uploadData, error: uploadErr } = await supabaseAdmin.storage
        .from("member-photos")
        .upload(fileName, buffer, {
          contentType: mimeType,
          upsert: false,
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
        console.warn(
          "Notice: Impossible d'uploader la photo dans le bucket:",
          uploadErr.message
        );
      }
    }

    // Identifiants cryptographiques générés exclusivement côté serveur
    const serverMembershipId = generateServerMembershipId(cleanCountry);
    const serverQrToken = generateServerQrToken();

    const memberInsertData = {
      membership_id: serverMembershipId,
      first_name: cleanFirstName,
      last_name: cleanLastName,
      email: cleanEmail,
      phone: cleanPhone,
      country: cleanCountry,
      university: cleanUniversity,
      field_of_study: cleanFieldOfStudy,
      photo_url: finalPhotoUrl,
      qr_code_token: serverQrToken,
      status: "pending" as const,
      payment_method: validProvider,
      payment_reference: cleanPaymentRef || null,
    };

    const { data: member, error: memberErr } = await supabaseAdmin
      .from("members")
      .insert(memberInsertData)
      .select()
      .single();

    if (memberErr || !member) {
      if (uploadedPhotoPath) {
        await supabaseAdmin.storage
          .from("member-photos")
          .remove([uploadedPhotoPath])
          .catch(() => {});
      }
      console.error("Erreur insertion Supabase:", memberErr?.message);
      return applySecurityHeaders(
        NextResponse.json(
          { error: "Erreur lors de l'enregistrement de l'adhésion." },
          { status: 500 }
        )
      );
    }

    const { error: paymentErr } = await supabaseAdmin.from("payments").insert({
      member_id: member.id,
      amount: 3000,
      currency: "XOF",
      provider: validProvider,
      transaction_reference: cleanPaymentRef || null,
      status: "pending",
    });

    if (paymentErr) {
      console.error(
        "Erreur insertion paiement (rollback membre déclenché):",
        paymentErr.message
      );
      await supabaseAdmin.from("members").delete().eq("id", member.id);
      if (uploadedPhotoPath) {
        await supabaseAdmin.storage
          .from("member-photos")
          .remove([uploadedPhotoPath])
          .catch(() => {});
      }
      return applySecurityHeaders(
        NextResponse.json(
          {
            error:
              "Erreur lors de l'initialisation du paiement. Veuillez réessayer.",
          },
          { status: 500 }
        )
      );
    }

    return applySecurityHeaders(NextResponse.json({ success: true, member }));
  } catch (err: unknown) {
    console.error("Erreur route /api/register:", err);
    return applySecurityHeaders(
      NextResponse.json(
        { error: "Erreur serveur lors de l'enregistrement." },
        { status: 500 }
      )
    );
  }
}
