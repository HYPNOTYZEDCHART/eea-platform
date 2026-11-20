import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, getEffectiveMemberStatus, type MemberStatus } from "@/lib/supabase";
import {
  getAdminSession,
  applySecurityHeaders,
  verifyAdminMutationOrigin,
} from "@/lib/adminAuth";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const VALID_STATUS_FILTERS = new Set(["all", "active", "pending", "expired", "revoked"]);

function sanitizeSearchTerm(raw: string | null): string {
  if (!raw) return "";
  return raw
    .replace(/[\u0000-\u001F\u007F,().*%\\]/g, " ")
    .trim()
    .slice(0, 80);
}

function extractStoragePhotoPath(photoUrl: string | null | undefined): string | null {
  if (!photoUrl) return null;
  try {
    const parsed = new URL(photoUrl);
    const marker = "/storage/v1/object/public/member-photos/";
    const idx = parsed.pathname.indexOf(marker);
    if (idx === -1) return null;
    const objectPath = decodeURIComponent(parsed.pathname.slice(idx + marker.length));
    return objectPath && !objectPath.includes("..") ? objectPath : null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const session = await getAdminSession(req);
  if (!session.valid) {
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
    const rawStatus = (searchParams.get("status") || "all").trim().toLowerCase();
    const statusFilter = VALID_STATUS_FILTERS.has(rawStatus) ? rawStatus : "all";
    const search = sanitizeSearchTerm(searchParams.get("search"));

    const page = Number.isFinite(rawPage) && rawPage >= 1 ? rawPage : 1;
    const limit =
      Number.isFinite(rawLimit) && rawLimit >= 1
        ? Math.min(rawLimit, MAX_LIMIT)
        : DEFAULT_LIMIT;
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    const nowIso = new Date().toISOString();

    const supabaseAdmin = getSupabaseAdmin();

    // 1. Requête paginée et filtrée côté serveur
    let query = supabaseAdmin
      .from("members")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    if (statusFilter === "pending" || statusFilter === "revoked") {
      query = query.eq("status", statusFilter);
    } else if (statusFilter === "active") {
      query = query.eq("status", "active").gte("expires_at", nowIso);
    } else if (statusFilter === "expired") {
      query = query.or(`status.eq.expired,and(status.eq.active,expires_at.lt.${nowIso})`);
    }

    if (search) {
      const pattern = `%${search}%`;
      query = query.or(
        `first_name.ilike.${pattern},last_name.ilike.${pattern},membership_id.ilike.${pattern},email.ilike.${pattern},university.ilike.${pattern},country.ilike.${pattern}`
      );
    }

    const { data, error, count } = await query.range(from, to);

    if (error) {
      console.error("Erreur récupération membres Supabase:", error.message);
      return applySecurityHeaders(
        NextResponse.json(
          { success: false, error: "Erreur lors de la récupération du registre." },
          { status: 500 }
        )
      );
    }

    // 2. Agrégats légers sans PII pour les compteurs KPI globaux
    const { data: statusRows } = await supabaseAdmin
      .from("members")
      .select("status, expires_at");

    const counts = { total: 0, active: 0, pending: 0, expired: 0, revoked: 0 };
    if (Array.isArray(statusRows)) {
      counts.total = statusRows.length;
      for (const row of statusRows) {
        const eff = getEffectiveMemberStatus({
          status: row.status as MemberStatus,
          expires_at: row.expires_at as string | null,
        });
        counts[eff] += 1;
      }
    }

    const total = count ?? (data?.length || 0);
    const totalPages = Math.max(1, Math.ceil(total / limit));

    return applySecurityHeaders(
      NextResponse.json({
        success: true,
        members: data || [],
        data: data || [],
        count: data?.length || 0,
        counts,
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
    console.warn("Notice: Base Supabase indisponible côté serveur:", err);
    return applySecurityHeaders(
      NextResponse.json(
        { success: false, error: "Erreur serveur lors du chargement des membres." },
        { status: 500 }
      )
    );
  }
}

export async function DELETE(req: NextRequest) {
  const csrf = verifyAdminMutationOrigin(req, { requireJson: true });
  if (!csrf.ok) {
    return applySecurityHeaders(
      NextResponse.json(
        { success: false, error: csrf.error || "Requête refusée." },
        { status: 403 }
      )
    );
  }

  const session = await getAdminSession(req);
  if (!session.valid) {
    return applySecurityHeaders(
      NextResponse.json(
        { success: false, error: "Accès non autorisé. Session administrateur requise." },
        { status: 401 }
      )
    );
  }

  try {
    const rawBody: unknown = await req.json().catch(() => null);
    if (!rawBody || typeof rawBody !== "object" || Array.isArray(rawBody)) {
      return applySecurityHeaders(
        NextResponse.json(
          { success: false, error: "Corps de requête JSON invalide." },
          { status: 400 }
        )
      );
    }

    const body = rawBody as Record<string, unknown>;
    const membershipId = typeof body.membership_id === "string" ? body.membership_id.trim() : "";

    if (!membershipId || !/^[a-zA-Z0-9_-]{3,64}$/.test(membershipId)) {
      return applySecurityHeaders(
        NextResponse.json(
          { success: false, error: "Format de matricule invalide ou manquant." },
          { status: 400 }
        )
      );
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { data: deleted, error } = await supabaseAdmin
      .from("members")
      .delete()
      .eq("membership_id", membershipId)
      .select("id, photo_url")
      .maybeSingle();

    if (error) {
      console.error("Erreur suppression membre Supabase:", error.message);
      return applySecurityHeaders(
        NextResponse.json(
          { success: false, error: "Erreur lors de la suppression du membre." },
          { status: 500 }
        )
      );
    }

    if (!deleted) {
      return applySecurityHeaders(
        NextResponse.json({ success: false, error: "Membre introuvable." }, { status: 404 })
      );
    }

    const storagePath = extractStoragePhotoPath(deleted.photo_url as string | null);
    if (storagePath) {
      await supabaseAdmin.storage
        .from("member-photos")
        .remove([storagePath])
        .catch(() => {});
    }

    console.info(`[AUDIT ADMIN] ${session.email} a supprimé le membre ${membershipId}`);

    return applySecurityHeaders(
      NextResponse.json({
        success: true,
        message: `Membre ${membershipId} supprimé définitivement du registre officiel.`,
      })
    );
  } catch (err: unknown) {
    console.error("Erreur serveur Supabase DELETE:", err);
    return applySecurityHeaders(
      NextResponse.json(
        { success: false, error: "Erreur serveur lors de la suppression." },
        { status: 500 }
      )
    );
  }
}
