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

function pruneExpired(now: number): void {
  if (buckets.size < MAX_BUCKETS) return;
  for (const [key, entry] of buckets.entries()) {
    if (entry.expiresAt <= now) {
      buckets.delete(key);
    }
  }
}

/**
 * Limiteur de requêtes par fenêtre glissante avec purge automatique des entrées expirées.
 */
export function consumeRateLimit(
  namespace: string,
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  pruneExpired(now);

  const key = `${namespace}:${identifier}`;
  const cutoff = now - config.windowMs;
  const existing = buckets.get(key);
  const recent = existing ? existing.timestamps.filter((ts) => ts > cutoff) : [];

  if (recent.length >= config.maxRequests) {
    const oldestInWindow = recent[0];
    const retryAfterSeconds = Math.max(1, Math.ceil((oldestInWindow + config.windowMs - now) / 1000));
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
