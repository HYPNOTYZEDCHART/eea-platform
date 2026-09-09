import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export const ADMIN_COOKIE_NAME = "eea_admin_session";
export const ADMIN_MAX_AGE_SECONDS = 60 * 60 * 8; // 8 heures

/**
 * Clé secrète cryptographique du serveur pour la signature HMAC
 */
export function getSigningSecret(): string {
  return (
    process.env.ADMIN_OTP_SECRET_KEY ||
    process.env.ADMIN_SECRET_PIN ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "eea-secret-institutional-salt-2008"
  );
}

/**
 * Applique les entêtes HTTP de sécurité renforcée (anti-sniffing, anti-clickjacking, no-cache)
 */
export function applySecurityHeaders(res: NextResponse): NextResponse {
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("X-XSS-Protection", "1; mode=block");
  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.headers.set("Pragma", "no-cache");
  return res;
}

/**
 * Extrait l'adresse IP du client de manière fiable
 */
export function getClientIdentifier(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  return "127.0.0.1";
}

/**
 * Calcule l'empreinte matérielle unique du client (IP + User-Agent)
 */
export function getClientFingerprint(request: NextRequest): string {
  const ip = getClientIdentifier(request);
  const userAgent = request.headers.get("user-agent") || "unknown-agent";
  return crypto.createHash("sha256").update(`${ip}_${userAgent}`).digest("hex").slice(0, 16);
}

/**
 * Comparaison cryptographique en temps constant pour éviter les attaques temporelles (Timing Attacks)
 */
export function safeCompare(input: string, expected: string): boolean {
  const inputHash = crypto.createHash("sha256").update(input).digest();
  const expectedHash = crypto.createHash("sha256").update(expected).digest();
  return crypto.timingSafeEqual(inputHash, expectedHash);
}

/**
 * Génère un jeton de session administrateur signé numériquement avec empreinte client
 */
export function createSignedToken(request: NextRequest): string {
  const timestamp = Date.now();
  const fingerprint = getClientFingerprint(request);
  const payload = `eea_admin_${timestamp}_${fingerprint}`;
  const hmac = crypto
    .createHmac("sha256", getSigningSecret())
    .update(payload)
    .digest("hex");
  return `${payload}.${hmac}`;
}

/**
 * Vérifie la signature et l'empreinte matérielle du jeton de session
 */
export function verifySignedToken(token: string, request?: NextRequest): boolean {
  if (!token || !token.includes(".")) return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [payload, hmac] = parts;
  if (!payload || !hmac) return false;

  const expectedHmac = crypto
    .createHmac("sha256", getSigningSecret())
    .update(payload)
    .digest("hex");

  const hmacBuffer = Buffer.from(hmac);
  const expectedBuffer = Buffer.from(expectedHmac);

  if (hmacBuffer.length !== expectedBuffer.length) return false;
  if (!crypto.timingSafeEqual(hmacBuffer, expectedBuffer)) return false;

  // Vérification de l'empreinte client (protection contre le vol de cookies)
  if (request) {
    const expectedFingerprint = getClientFingerprint(request);
    if (!payload.includes(expectedFingerprint)) {
      console.warn(`[ALERTE SÉCURITÉ] Empreinte de session non conforme (IP ou navigateur différent).`);
      return false;
    }
  }

  return true;
}

/**
 * Valide si la requête possède une session administrateur authentifiée valide
 */
export function verifyAdminSession(request: NextRequest): boolean {
  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (!token) return false;
  return verifySignedToken(token, request);
}
