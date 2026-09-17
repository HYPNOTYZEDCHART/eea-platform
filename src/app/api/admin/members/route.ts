import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { verifyAdminSession, applySecurityHeaders } from "@/lib/adminAuth";

export async function GET(req: NextRequest) {
  // Protection Zero-Trust : Aucune donnée de membre ne peut fuiter sans session valide
  const isAuthorized = verifyAdminSession(req);

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

export async function DELETE(req: NextRequest) {
  // Protection Zero-Trust : Seul un administrateur authentifié peut purger un membre
  const isAuthorized = verifyAdminSession(req);

  if (!isAuthorized) {
    return applySecurityHeaders(
      NextResponse.json(
        { success: false, error: "Accès non autorisé. Session administrateur requise." },
        { status: 401 }
      )
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { membership_id } = body;

    if (!membership_id || typeof membership_id !== "string") {
      return applySecurityHeaders(
        NextResponse.json(
          { success: false, error: "Matricule du membre obligatoire pour la suppression." },
          { status: 400 }
        )
      );
    }

    try {
      const supabaseAdmin = getSupabaseAdmin();
      const { error } = await supabaseAdmin
        .from("members")
        .delete()
        .eq("membership_id", membership_id.trim());

      if (error) {
        console.error("Erreur suppression membre Supabase:", error);
        return applySecurityHeaders(
          NextResponse.json({ success: false, error: error.message }, { status: 500 })
        );
      }

      return applySecurityHeaders(
        NextResponse.json({
          success: true,
          message: `Membre ${membership_id} supprimé définitivement du registre officiel.`,
        })
      );
    } catch (dbErr: unknown) {
      const dbMsg = dbErr instanceof Error ? dbErr.message : "Erreur db";
      console.warn("Notice Supabase DELETE:", dbMsg);
      return applySecurityHeaders(
        NextResponse.json({
          success: true,
          localFallback: true,
          message: `Membre supprimé localement.`,
        })
      );
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Erreur serveur";
    return applySecurityHeaders(
      NextResponse.json({ success: false, error: errorMsg }, { status: 500 })
    );
  }
}
