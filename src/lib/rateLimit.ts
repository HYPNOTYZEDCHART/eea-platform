import { getSupabaseAdmin } from "@/lib/supabase";

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

interface BucketEntry {
  timestamps: number[];
  expiresAt: number;
}

const buckets = new Map<string, BucketEntry>();
const MAX_BUCKETS = 5_000;
let warnedMissingRateLimitTable = false;

function pruneExpired(now: number): void {
  if (buckets.size < MAX_BUCKETS) return;
  for (const [key, entry] of buckets.entries()) {
    if (entry.expiresAt <= now) {
      buckets.delete(key);
    }
  }
}

function consumeMemoryRateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  pruneExpired(now);

  const cutoff = now - config.windowMs;
  const existing = buckets.get(key);
  const recent = existing ? existing.timestamps.filter((ts) => ts > cutoff) : [];

  if (recent.length >= config.maxRequests) {
    const oldestInWindow = recent[0];
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((oldestInWindow + config.windowMs - now) / 1000)
    );
    buckets.set(key, { timestamps: recent, expiresAt: now + config.windowMs });
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds,
    };
  }

  recent.push(now);
  buckets.set(key, { timestamps: recent, expiresAt: now + config.windowMs });

  return {
    allowed: true,
    remaining: Math.max(0, config.maxRequests - recent.length),
    retryAfterSeconds: 0,
  };
}

/**
 * Limiteur de requêtes distribué (Supabase PostgreSQL atomique via RPC,
 * repli direct sur la table rate_limits si RPC absente du cache PostgREST,
 * puis repli mémoire locale en dernier recours).
 */
export async function consumeRateLimit(
  namespace: string,
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const key = `${namespace}:${identifier}`;

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin.rpc("consume_rate_limit_db", {
      p_key: key,
      p_window_ms: config.windowMs,
      p_max_requests: config.maxRequests,
    });

    if (!error && Array.isArray(data) && data.length > 0) {
      const row = data[0] as {
        allowed: boolean;
        remaining: number;
        retry_after_seconds: number;
      };
      return {
        allowed: Boolean(row.allowed),
        remaining: Number(row.remaining ?? 0),
        retryAfterSeconds: Number(row.retry_after_seconds ?? 0),
      };
    }

    // Repli direct sur la table rate_limits si la RPC n'est pas encore dans le cache PostgREST
    const now = Date.now();
    const { data: existingRow, error: tableErr } = await supabaseAdmin
      .from("rate_limits")
      .select("count, window_start")
      .eq("bucket_key", key)
      .maybeSingle();

    if (!tableErr) {
      const windowStartMs = existingRow?.window_start
        ? new Date(existingRow.window_start).getTime()
        : 0;
      const inCurrentWindow =
        Boolean(existingRow) && windowStartMs + config.windowMs > now;
      const nextCount = inCurrentWindow ? (existingRow?.count || 0) + 1 : 1;
      const effectiveWindowStart = inCurrentWindow
        ? existingRow!.window_start
        : new Date(now).toISOString();

      await supabaseAdmin.from("rate_limits").upsert(
        {
          bucket_key: key,
          count: nextCount,
          window_start: effectiveWindowStart,
        },
        { onConflict: "bucket_key" }
      );

      if (nextCount > config.maxRequests) {
        const retryAfterSeconds = Math.max(
          1,
          Math.ceil(
            (new Date(effectiveWindowStart).getTime() + config.windowMs - now) /
              1000
          )
        );
        return {
          allowed: false,
          remaining: 0,
          retryAfterSeconds,
        };
      }

      return {
        allowed: true,
        remaining: Math.max(0, config.maxRequests - nextCount),
        retryAfterSeconds: 0,
      };
    }

    if (error && !warnedMissingRateLimitTable) {
      warnedMissingRateLimitTable = true;
      console.warn(
        "[SÉCURITÉ] RPC/table rate_limits indisponible (repli mémoire actif). Exécutez supabase/schema.sql:",
        error.message
      );
    }
  } catch {
    // Repli en mémoire locale si la configuration Supabase est absente
  }

  return consumeMemoryRateLimit(key, config);
}
