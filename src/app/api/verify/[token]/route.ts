import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { applySecurityHeaders, getClientIdentifier } from "@/lib/adminAuth";
import { consumeRateLimit } from "@/lib/rateLimit";

const PUBLIC_VERIFY_COLUMNS =
  "membership_id, first_name, last_name, country, university, field_of_study, photo_url, status, created_at, expires_at";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const ip = getClientIdentifier(req);
  const rate = await consumeRateLimit("verify", ip, {
    windowMs: 60 * 1000,
    maxRequests: 15,
  });

  if (!rate.allowed) {
    const res = NextResponse.json(
      {
        success: false,
        error: "Trop de requêtes de vérification. Veuillez patienter.",
      },
      { status: 429 }
    );
    res.headers.set("Retry-After", String(rate.retryAfterSeconds));
    return applySecurityHeaders(res);
  }

  const { token } = await params;
  const cleanToken = typeof token === "string" ? token.trim() : "";

  if (!cleanToken || !/^[a-zA-Z0-9_-]{3,64}$/.test(cleanToken)) {
    return applySecurityHeaders(
      NextResponse.json(
        { success: false, error: "Jeton de vérification invalide." },
        { status: 400 }
      )
    );
  }

  try {
    const supabaseAdmin = getSupabaseAdmin();

    // Recherche paramétrée par qr_code_token en priorité, puis par membership_id (sans interpolation .or)
    let { data, error } = await supabaseAdmin
      .from("members")
      .select(PUBLIC_VERIFY_COLUMNS)
      .eq("qr_code_token", cleanToken)
      .maybeSingle();

    if (!error && !data) {
      const byMembershipId = await supabaseAdmin
        .from("members")
        .select(PUBLIC_VERIFY_COLUMNS)
        .eq("membership_id", cleanToken)
        .maybeSingle();
      data = byMembershipId.data;
      error = byMembershipId.error;
    }

    if (error) {
      console.error("Erreur recherche vérification token:", error.message);
      return applySecurityHeaders(
        NextResponse.json(
          { success: false, error: "Erreur lors de la vérification." },
          { status: 500 }
        )
      );
    }

    if (!data) {
      return applySecurityHeaders(
        NextResponse.json(
          {
            success: false,
            error: "Membre introuvable dans le registre officiel.",
          },
          { status: 404 }
        )
      );
    }

    return applySecurityHeaders(
      NextResponse.json({
        success: true,
        member: data,
      })
    );
  } catch (err: unknown) {
    console.error("Exception route /api/verify/[token]:", err);
    return applySecurityHeaders(
      NextResponse.json(
        { success: false, error: "Erreur serveur lors de la vérification." },
        { status: 500 }
      )
    );
  }
}
