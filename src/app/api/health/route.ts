import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getSupabaseAdmin } from "@/lib/supabase";
import { applySecurityHeaders, getClientIdentifier } from "@/lib/adminAuth";
import { consumeRateLimit } from "@/lib/rateLimit";

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
 * Healthcheck & Keep-Alive PostgreSQL (anti-mise en pause Supabase Free Plan)
 */
export async function GET(req: NextRequest) {
  const now = Date.now();
  const forceLive = isAuthorizedCron(req);

  if (!forceLive) {
    const ip = getClientIdentifier(req);
    const rate = await consumeRateLimit("health", ip, {
      windowMs: 60 * 1000,
      maxRequests: 30,
    });
    if (!rate.allowed) {
      const res = NextResponse.json(
        { status: "rate_limited" },
        { status: 429 }
      );
      res.headers.set("Retry-After", String(rate.retryAfterSeconds));
      return applySecurityHeaders(res);
    }
  }

  if (!forceLive && lastPingHealthy && now - lastPingAt < PUBLIC_PING_COOLDOWN_MS) {
    return applySecurityHeaders(
      NextResponse.json(
        {
          status: "ok",
          database: "connected",
          cached: true,
          timestamp: new Date(lastPingAt).toISOString(),
        },
        { status: 200 }
      )
    );
  }

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { error } = await supabaseAdmin
      .from("members")
      .select("id", { count: "exact", head: true });

    if (error) {
      lastPingHealthy = false;
      console.error("[HEALTHCHECK] Erreur requête PostgreSQL Supabase:", error.message);
      return applySecurityHeaders(
        NextResponse.json(
          {
            status: "error",
            database: "unreachable",
            timestamp: new Date().toISOString(),
          },
          { status: 503 }
        )
      );
    }

    lastPingAt = Date.now();
    lastPingHealthy = true;

    return applySecurityHeaders(
      NextResponse.json(
        {
          status: "ok",
          database: "connected",
          cached: false,
          timestamp: new Date(lastPingAt).toISOString(),
        },
        { status: 200 }
      )
    );
  } catch (err: unknown) {
    lastPingHealthy = false;
    console.error("[HEALTHCHECK] Supabase indisponible:", err);
    return applySecurityHeaders(
      NextResponse.json(
        {
          status: "error",
          database: "unreachable",
          timestamp: new Date().toISOString(),
        },
        { status: 503 }
      )
    );
  }
}
