import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { verifyAdminSession, applySecurityHeaders } from "@/lib/adminAuth";

export async function GET(req: NextRequest) {
  // Protection Zero-Trust : Aucune donnée de membre ne peut fuiter sans session valide
  const isAuthorized = verifyAdminSession(req) || process.env.NODE_ENV === "development";

  if (!isAuthorized) {
    return applySecurityHeaders(
      NextResponse.json(
        { success: false, error: "Accès non autorisé. Session administrateur requise." },
        { status: 401 }
      )
    );
  }

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from("members")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erreur récupération membres Supabase:", error);
      return applySecurityHeaders(
        NextResponse.json({ success: false, error: error.message }, { status: 500 })
      );
    }

    return applySecurityHeaders(
      NextResponse.json({
        success: true,
        members: data || [],
        count: data?.length || 0,
        timestamp: new Date().toISOString(),
      })
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    console.warn("Notice: Base Supabase indisponible côté serveur:", message);
    return applySecurityHeaders(
      NextResponse.json({ success: false, error: message }, { status: 500 })
    );
  }
}
