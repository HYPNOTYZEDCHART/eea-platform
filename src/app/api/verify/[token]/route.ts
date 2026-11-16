import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { applySecurityHeaders, getClientIdentifier } from "@/lib/adminAuth";
import { consumeRateLimit } from "@/lib/rateLimit";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const ip = getClientIdentifier(req);
  const rate = consumeRateLimit("verify", ip, {
    windowMs: 60 * 1000,
    maxRequests: 60,
  });

  if (!rate.allowed) {
    const res = NextResponse.json(
      { success: false, error: "Trop de requêtes de vérification. Veuillez patienter." },
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
    const { data, error } = await supabaseAdmin
      .from("members")
      .select(
        "membership_id, first_name, last_name, country, university, field_of_study, photo_url, qr_code_token, status, created_at, expires_at"
      )
      .or(`qr_code_token.eq.${cleanToken},membership_id.eq.${cleanToken}`)
      .maybeSingle();

    if (error) {
      console.error("Erreur recherche vérification token:", error);
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
          { success: false, error: "Membre introuvable dans le registre officiel." },
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
    const message = err instanceof Error ? err.message : "Erreur serveur";
    console.error("Exception route /api/verify/[token]:", message);
    return applySecurityHeaders(
      NextResponse.json({ success: false, error: message }, { status: 500 })
    );
  }
}
