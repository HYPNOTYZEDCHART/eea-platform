import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { verifyAdminSession, applySecurityHeaders } from "@/lib/adminAuth";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

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
    const searchParams = req.nextUrl.searchParams;
    const rawPage = Number.parseInt(searchParams.get("page") || "1", 10);
    const rawLimit = Number.parseInt(searchParams.get("limit") || String(DEFAULT_LIMIT), 10);

    const page = Number.isFinite(rawPage) && rawPage >= 1 ? rawPage : 1;
    const limit =
      Number.isFinite(rawLimit) && rawLimit >= 1
        ? Math.min(rawLimit, MAX_LIMIT)
        : DEFAULT_LIMIT;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const supabaseAdmin = getSupabaseAdmin();
    const { data, error, count } = await supabaseAdmin
      .from("members")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      console.error("Erreur récupération membres Supabase:", error);
      return applySecurityHeaders(
        NextResponse.json({ success: false, error: error.message }, { status: 500 })
      );
    }

    const total = count ?? (data?.length || 0);
    const totalPages = Math.max(1, Math.ceil(total / limit));

    return applySecurityHeaders(
      NextResponse.json({
        success: true,
        members: data || [],
        data: data || [],
        count: data?.length || 0,
        meta: {
          total,
          page,
          limit,
          totalPages,
        },
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

    const cleanId = membership_id.trim();
    if (!/^[a-zA-Z0-9_-]{3,64}$/.test(cleanId)) {
      return applySecurityHeaders(
        NextResponse.json(
          { success: false, error: "Format de matricule invalide." },
          { status: 400 }
        )
      );
    }

    try {
      const supabaseAdmin = getSupabaseAdmin();
      const { data: deleted, error } = await supabaseAdmin
        .from("members")
        .delete()
        .eq("membership_id", cleanId)
        .select("id")
        .maybeSingle();

      if (error) {
        console.error("Erreur suppression membre Supabase:", error);
        return applySecurityHeaders(
          NextResponse.json({ success: false, error: error.message }, { status: 500 })
        );
      }

      if (!deleted) {
        return applySecurityHeaders(
          NextResponse.json({ success: false, error: "Membre introuvable." }, { status: 404 })
        );
      }

      return applySecurityHeaders(
        NextResponse.json({
          success: true,
          message: `Membre ${cleanId} supprimé définitivement du registre officiel.`,
        })
      );
    } catch (dbErr: unknown) {
      const dbMsg = dbErr instanceof Error ? dbErr.message : "Erreur base de données";
      console.error("Erreur serveur Supabase DELETE:", dbMsg);
      return applySecurityHeaders(
        NextResponse.json({
          success: false,
          error: dbMsg,
        }, { status: 500 })
      );
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Erreur serveur";
    return applySecurityHeaders(
      NextResponse.json({ success: false, error: errorMsg }, { status: 500 })
    );
  }
}
