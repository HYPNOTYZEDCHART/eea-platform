import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const PUBLIC_PING_COOLDOWN_MS = 60_000;
let lastPingAt = 0;
let lastPingHealthy = false;

function isAuthorizedCron(req: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET?.trim();
  if (!cronSecret) return false;
  const authHeader = req.headers.get("authorization") || "";
  const expected = `Bearer ${cronSecret}`;
  const a = Buffer.from(authHeader);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/**
 * Healthcheck & Keep-Alive PostgreSQL (anti-mise en pause Supabase Free Plan après 7 jours d'inactivité)
 */
export async function GET(req: NextRequest) {
  const now = Date.now();
  const forceLive = isAuthorizedCron(req);

  if (!forceLive && lastPingHealthy && now - lastPingAt < PUBLIC_PING_COOLDOWN_MS) {
    return NextResponse.json(
      {
        status: "ok",
        database: "connected",
        cached: true,
        timestamp: new Date(lastPingAt).toISOString(),
      },
      {
        status: 200,
        headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
      }
    );
  }

  try {
    const supabaseAdmin = getSupabaseAdmin();
    // Requête PostgreSQL réelle ultra-légère (sans lecture de lignes ni fuite de données)
    const { error } = await supabaseAdmin
      .from("members")
      .select("id", { count: "exact", head: true });

    if (error) {
      lastPingHealthy = false;
      console.error("[HEALTHCHECK] Erreur requête PostgreSQL Supabase:", error.message);
      return NextResponse.json(
        {
          status: "error",
          database: "unreachable",
          timestamp: new Date().toISOString(),
        },
        {
          status: 503,
          headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
        }
      );
    }

    lastPingAt = Date.now();
    lastPingHealthy = true;

    return NextResponse.json(
      {
        status: "ok",
        database: "connected",
        cached: false,
        timestamp: new Date(lastPingAt).toISOString(),
      },
      {
        status: 200,
        headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
      }
    );
  } catch (err: unknown) {
    lastPingHealthy = false;
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    console.error("[HEALTHCHECK] Supabase indisponible:", message);
    return NextResponse.json(
      {
        status: "error",
        database: "unreachable",
        timestamp: new Date().toISOString(),
      },
      {
        status: 503,
        headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
      }
    );
  }
}

