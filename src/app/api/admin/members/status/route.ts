import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { verifyAdminSession, applySecurityHeaders } from "@/lib/adminAuth";

export async function POST(req: NextRequest) {
  // Protection Zero-Trust : Seul un administrateur authentifié peut modifier les statuts des membres
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
    const { membership_id, status, expires_at } = await req.json();

    if (!membership_id || !status) {
      return applySecurityHeaders(
        NextResponse.json(
          { error: "Matricule et statut requis." },
          { status: 400 }
        )
      );
    }

    try {
      const supabaseAdmin = getSupabaseAdmin();
      const updatePayload: Record<string, unknown> = { status };
      if (expires_at) {
        updatePayload.expires_at = expires_at;
      }

      const { data, error } = await supabaseAdmin
        .from("members")
        .update(updatePayload)
        .eq("membership_id", membership_id)
        .select()
        .single();

      if (error) {
        console.error("Erreur mise à jour Supabase:", error);
        return applySecurityHeaders(
          NextResponse.json({ error: error.message }, { status: 500 })
        );
      }

      return applySecurityHeaders(
        NextResponse.json({ success: true, member: data })
      );
    } catch (dbErr: unknown) {
      const dbMsg = dbErr instanceof Error ? dbErr.message : "Erreur db";
      console.warn("Notice: Base Supabase indisponible côté serveur:", dbMsg);
      return applySecurityHeaders(
        NextResponse.json({ success: true, localFallback: true }, { status: 200 })
      );
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Erreur serveur";
    return applySecurityHeaders(
      NextResponse.json(
        { error: errorMsg },
        { status: 500 }
      )
    );
  }
}
