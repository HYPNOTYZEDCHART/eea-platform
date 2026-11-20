import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, type MemberStatus } from "@/lib/supabase";
import {
  getAdminSession,
  applySecurityHeaders,
  verifyAdminMutationOrigin,
} from "@/lib/adminAuth";

const ALLOWED_STATUSES = new Set<MemberStatus>([
  "pending",
  "active",
  "expired",
  "revoked",
]);

export async function POST(req: NextRequest) {
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
        {
          success: false,
          error: "Accès non autorisé. Session administrateur requise.",
        },
        { status: 401 }
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
    const membershipId =
      typeof body.membership_id === "string" ? body.membership_id.trim() : "";
    const status = typeof body.status === "string" ? body.status.trim() : "";
    const expiresAt =
      typeof body.expires_at === "string" ? body.expires_at.trim() : "";

    if (!membershipId || !/^[a-zA-Z0-9_-]{3,64}$/.test(membershipId)) {
      return applySecurityHeaders(
        NextResponse.json(
          { error: "Matricule invalide ou manquant." },
          { status: 400 }
        )
      );
    }

    if (!ALLOWED_STATUSES.has(status as MemberStatus)) {
      return applySecurityHeaders(
        NextResponse.json({ error: "Statut membre invalide." }, { status: 400 })
      );
    }

    const updatePayload: { status: MemberStatus; expires_at?: string } = {
      status: status as MemberStatus,
    };

    if (expiresAt) {
      const parsedDate = new Date(expiresAt);
      if (Number.isNaN(parsedDate.getTime())) {
        return applySecurityHeaders(
          NextResponse.json(
            { error: "Date d'expiration invalide." },
            { status: 400 }
          )
        );
      }
      updatePayload.expires_at = parsedDate.toISOString();
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from("members")
      .update(updatePayload)
      .eq("membership_id", membershipId)
      .select()
      .maybeSingle();

    if (error) {
      console.error("Erreur mise à jour Supabase:", error.message);
      return applySecurityHeaders(
        NextResponse.json(
          { error: "Erreur lors de la mise à jour du statut." },
          { status: 500 }
        )
      );
    }

    if (!data) {
      return applySecurityHeaders(
        NextResponse.json(
          { success: false, error: "Membre introuvable." },
          { status: 404 }
        )
      );
    }

    if (status === "active" && data.id) {
      const { error: payUpdateErr } = await supabaseAdmin
        .from("payments")
        .update({
          status: "successful",
          paid_at: new Date().toISOString(),
        })
        .eq("member_id", data.id)
        .eq("status", "pending");

      if (payUpdateErr) {
        console.warn(
          "Notice: Échec mise à jour statut paiement:",
          payUpdateErr.message
        );
      }
    }

    console.info(
      `[AUDIT ADMIN] ${session.email} a passé ${membershipId} au statut ${status}`
    );

    return applySecurityHeaders(NextResponse.json({ success: true, member: data }));
  } catch (err: unknown) {
    console.error("Erreur route /api/admin/members/status:", err);
    return applySecurityHeaders(
      NextResponse.json(
        { success: false, error: "Erreur serveur lors de la mise à jour." },
        { status: 500 }
      )
    );
  }
}
