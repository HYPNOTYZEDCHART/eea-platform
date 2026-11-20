import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import net from "net";
import { getSupabaseAdmin } from "@/lib/supabase";

export const ADMIN_COOKIE_NAME = "eea_admin_session";
export const ADMIN_OTP_COOKIE_NAME = "eea_admin_otp_challenge";
export const ADMIN_MAX_AGE_SECONDS = 60 * 60 * 8; // 8 heures
export const ADMIN_OTP_MAX_AGE_SECONDS = 5 * 60; // 5 minutes

interface StoredOtpChallenge {
  jti: string;
  email: string;
  codeHash: string;
  attemptsLeft: number;
  fingerprint: string;
  clientIp: string;
  consumed: boolean;
  issuedAt: number;
  expiresAt: number;
}

interface StoredAdminSession {
  jti: string;
  email: string;
  fingerprint: string;
  revoked: boolean;
  expiresAt: number;
}

const fallbackOtpStore = new Map<string, StoredOtpChallenge>();
const fallbackSessionStore = new Map<string, StoredAdminSession>();
const MAX_FALLBACK_ENTRIES = 2_000;
let warnedMissingSecurityTables = false;

declare global {
  var __eeaDevSigningSecret: string | undefined;
}

function pruneFallbackStores(): void {
  const now = Date.now();
  if (fallbackOtpStore.size > MAX_FALLBACK_ENTRIES) {
    for (const [k, v] of fallbackOtpStore.entries()) {
      if (v.expiresAt <= now || v.consumed) fallbackOtpStore.delete(k);
    }
  }
  if (fallbackSessionStore.size > MAX_FALLBACK_ENTRIES) {
    for (const [k, v] of fallbackSessionStore.entries()) {
      if (v.expiresAt <= now || v.revoked) fallbackSessionStore.delete(k);
    }
  }
}

function isMissingRelationError(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  return (
    error.code === "PGRST205" ||
    error.code === "42P01" ||
    Boolean(error.message?.includes("Could not find the table"))
  );
}

/**
 * Clé secrète cryptographique dédiée exclusivement à la signature HMAC des sessions et OTP.
 * Aucun repli vers les clés Supabase (séparation des clés) ni vers une constante codée en dur.
 */
export function getSigningSecret(): string {
  const secret = process.env.ADMIN_OTP_SECRET_KEY?.trim();

  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "[ALERTE CRITIQUE SÉCURITÉ] Variable ADMIN_OTP_SECRET_KEY manquante en production."
      );
    }
    if (!globalThis.__eeaDevSigningSecret) {
      globalThis.__eeaDevSigningSecret = crypto.randomBytes(32).toString("hex");
      console.warn(
        "[AVERTISSEMENT SÉCURITÉ DEV] ADMIN_OTP_SECRET_KEY absente. Génération d'une clé éphémère de session locale."
      );
    }
    return globalThis.__eeaDevSigningSecret;
  }

  if (secret.length < 32) {
    console.warn(
      "[AVERTISSEMENT SÉCURITÉ] ADMIN_OTP_SECRET_KEY devrait comporter au moins 32 caractères aléatoires."
    );
  }

  return secret;
}

/**
 * Récupère la liste stricte des adresses email autorisées à administrer la plateforme.
 */
export function getAuthorizedAdminEmails(): string[] {
  const rawConfiguredEmails =
    process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || "";
  return rawConfiguredEmails
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Échappe strictement tout texte avant interpolation dans un corps HTML (anti-HTML Injection).
 */
export function escapeHtml(value: unknown): string {
  const str = value === null || value === undefined ? "" : String(value);
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Résout de manière fiable l'URL publique canonique de l'application (anti-Host Header Injection).
 */
export function getAppBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) {
    try {
      const parsed = new URL(configured);
      if (parsed.protocol === "https:" || parsed.protocol === "http:") {
        return parsed.origin;
      }
    } catch {
      // ignore invalid URL
    }
  }

  const vercelProd = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercelProd) {
    return `https://${vercelProd.replace(/^https?:\/\//, "")}`;
  }

  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) {
    return `https://${vercelUrl.replace(/^https?:\/\//, "")}`;
  }

  return "https://eea-platform.vercel.app";
}

/**
 * Applique les entêtes HTTP de sécurité renforcée (anti-sniffing, anti-clickjacking, no-cache).
 */
export function applySecurityHeaders(res: NextResponse): NextResponse {
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.headers.set("Pragma", "no-cache");
  return res;
}

/**
 * Extrait et valide strictement l'adresse IP client (résistant aux en-têtes falsifiés / injections).
 */
export function getClientIdentifier(request: NextRequest): string {
  const candidates: string[] = [];

  const vercelIp = request.headers.get("x-vercel-forwarded-for");
  if (vercelIp) {
    candidates.push(vercelIp.split(",")[0].trim());
  }

  const cfIp = request.headers.get("cf-connecting-ip");
  if (cfIp) {
    candidates.push(cfIp.trim());
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    candidates.push(realIp.trim());
  }

  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const parts = forwarded
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
    if (parts.length > 0) {
      candidates.push(parts[parts.length - 1]);
    }
  }

  for (const candidate of candidates) {
    const normalized = candidate.replace(/^::ffff:/i, "");
    if (net.isIP(normalized) !== 0) {
      return normalized;
    }
  }

  return "0.0.0.0";
}

/**
 * Empreinte navigateur basée sur User-Agent (tolérante aux changements d'IP mobiles).
 */
export function getClientFingerprint(request: NextRequest): string {
  const userAgent = request.headers.get("user-agent") || "unknown-agent";
  return crypto.createHash("sha256").update(userAgent).digest("hex").slice(0, 16);
}

/**
 * Comparaison cryptographique en temps constant (anti-Timing Attacks).
 */
export function safeCompare(input: string, expected: string): boolean {
  const inputHash = crypto.createHash("sha256").update(input).digest();
  const expectedHash = crypto.createHash("sha256").update(expected).digest();
  return crypto.timingSafeEqual(inputHash, expectedHash);
}

/**
 * Protection CSRF stricte sur les mutations administrateur (Origin + Content-Type JSON).
 */
export function verifyAdminMutationOrigin(
  request: NextRequest,
  options: { requireJson?: boolean } = { requireJson: true }
): { ok: boolean; error?: string } {
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite === "cross-site") {
    return { ok: false, error: "Requête cross-site refusée." };
  }

  const origin = request.headers.get("origin");
  const requestHost =
    request.headers.get("x-forwarded-host")?.split(",")[0].trim() ||
    request.headers.get("host")?.trim();

  if (origin) {
    try {
      const parsedOrigin = new URL(origin);
      const allowedHosts = new Set<string>();
      if (requestHost) allowedHosts.add(requestHost.toLowerCase());

      try {
        allowedHosts.add(new URL(getAppBaseUrl()).host.toLowerCase());
      } catch {
        // ignore
      }

      if (!allowedHosts.has(parsedOrigin.host.toLowerCase())) {
        return { ok: false, error: "Origine de requête non autorisée." };
      }
    } catch {
      return { ok: false, error: "En-tête Origin invalide." };
    }
  }

  if (options.requireJson) {
    const contentType = request.headers.get("content-type") || "";
    if (!contentType.toLowerCase().includes("application/json")) {
      return {
        ok: false,
        error: "Content-Type application/json requis.",
      };
    }
  }

  return { ok: true };
}

export interface OtpChallengeTokenPayload {
  jti: string;
  email: string;
  expiresAt: number;
  fingerprint: string;
  issuedAt: number;
}

function signPayloadBase64Url(payloadStr: string): string {
  return crypto
    .createHmac("sha256", getSigningSecret())
    .update(payloadStr)
    .digest("hex");
}

function verifyTokenHmac(payloadStr: string, hmac: string): boolean {
  const expectedHmac = signPayloadBase64Url(payloadStr);
  const hmacBuffer = Buffer.from(hmac);
  const expectedBuffer = Buffer.from(expectedHmac);
  return (
    hmacBuffer.length === expectedBuffer.length &&
    crypto.timingSafeEqual(hmacBuffer, expectedBuffer)
  );
}

/**
 * Crée un challenge OTP 2FA persistant côté serveur (anti-rejeu & limite stricte de 3 essais).
 */
export async function createOtpChallenge(
  email: string,
  otpCode: string,
  request: NextRequest
): Promise<string> {
  const jti = crypto.randomUUID();
  const issuedAt = Date.now();
  const expiresAt = issuedAt + ADMIN_OTP_MAX_AGE_SECONDS * 1000;
  const fingerprint = getClientFingerprint(request);
  const clientIp = getClientIdentifier(request);
  const cleanEmail = email.toLowerCase().trim();
  const codeHash = crypto.createHash("sha256").update(otpCode).digest("hex");

  let persisted = false;
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { error } = await supabaseAdmin.from("admin_otp_challenges").insert({
      jti,
      email: cleanEmail,
      code_hash: codeHash,
      attempts_left: 3,
      fingerprint,
      client_ip: clientIp,
      consumed: false,
      issued_at: new Date(issuedAt).toISOString(),
      expires_at: new Date(expiresAt).toISOString(),
    });

    if (!error) {
      persisted = true;
    } else if (!isMissingRelationError(error)) {
      console.error("[SÉCURITÉ] Erreur création challenge OTP:", error.message);
    } else if (!warnedMissingSecurityTables) {
      warnedMissingSecurityTables = true;
      console.warn(
        "[SÉCURITÉ] Tables admin_otp_challenges / admin_sessions absentes. Exécutez supabase/schema.sql."
      );
    }
  } catch {
    // Repli mémoire si Supabase non configuré localement
  }

  if (!persisted) {
    pruneFallbackStores();
    fallbackOtpStore.set(jti, {
      jti,
      email: cleanEmail,
      codeHash,
      attemptsLeft: 3,
      fingerprint,
      clientIp,
      consumed: false,
      issuedAt,
      expiresAt,
    });
  }

  const tokenPayload: OtpChallengeTokenPayload = {
    jti,
    email: cleanEmail,
    expiresAt,
    fingerprint,
    issuedAt,
  };

  const payloadStr = Buffer.from(JSON.stringify(tokenPayload)).toString("base64url");
  const hmac = signPayloadBase64Url(payloadStr);
  return `${payloadStr}.${hmac}`;
}

function parseVerifiedChallengeCookie(
  token: string,
  request: NextRequest
): { valid: boolean; payload?: OtpChallengeTokenPayload; error?: string } {
  if (!token || !token.includes(".")) {
    return { valid: false, error: "Jeton de challenge manquant ou corrompu." };
  }
  const parts = token.split(".");
  if (parts.length !== 2) {
    return { valid: false, error: "Format du challenge invalide." };
  }
  const [payloadStr, hmac] = parts;
  if (!payloadStr || !hmac || !verifyTokenHmac(payloadStr, hmac)) {
    return {
      valid: false,
      error: "Signature du challenge de sécurité invalide ou altérée.",
    };
  }

  let data: OtpChallengeTokenPayload;
  try {
    data = JSON.parse(Buffer.from(payloadStr, "base64url").toString("utf8"));
  } catch {
    return { valid: false, error: "Données du challenge illisibles." };
  }

  if (!data?.jti || !data?.email || !data?.expiresAt || !data?.fingerprint) {
    return { valid: false, error: "Challenge incomplet." };
  }

  if (Date.now() > data.expiresAt) {
    return { valid: false, error: "Le challenge de sécurité a expiré." };
  }

  const currentFingerprint = getClientFingerprint(request);
  if (!safeCompare(data.fingerprint, currentFingerprint)) {
    return {
      valid: false,
      error: "Divergence d'empreinte navigateur détectée. Session révoquée.",
    };
  }

  return { valid: true, payload: data };
}

/**
 * Inspecte un challenge OTP actif côté serveur (utilisé lors d'un renvoi d'OTP).
 */
export async function getValidChallengePayload(
  token: string,
  request: NextRequest
): Promise<{
  valid: boolean;
  payload?: OtpChallengeTokenPayload;
  error?: string;
}> {
  const parsed = parseVerifiedChallengeCookie(token, request);
  if (!parsed.valid || !parsed.payload) return parsed;

  const { jti } = parsed.payload;

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from("admin_otp_challenges")
      .select("jti, email, attempts_left, consumed, issued_at, expires_at")
      .eq("jti", jti)
      .maybeSingle();

    if (!error) {
      if (!data || data.consumed || data.attempts_left <= 0) {
        return { valid: false, error: "Challenge expiré ou déjà consommé." };
      }
      if (new Date(data.expires_at).getTime() <= Date.now()) {
        return { valid: false, error: "Le challenge de sécurité a expiré." };
      }
      return {
        valid: true,
        payload: {
          ...parsed.payload,
          email: data.email,
          issuedAt: new Date(data.issued_at).getTime(),
        },
      };
    }

    if (!isMissingRelationError(error)) {
      return { valid: false, error: "Erreur de vérification du challenge." };
    }
  } catch {
    // Repli mémoire
  }

  const mem = fallbackOtpStore.get(jti);
  if (!mem || mem.consumed || mem.attemptsLeft <= 0 || Date.now() > mem.expiresAt) {
    return { valid: false, error: "Challenge expiré ou déjà consommé." };
  }

  return { valid: true, payload: parsed.payload };
}

/**
 * Invalide un challenge OTP (par exemple lors d'un renvoi de code).
 */
export async function consumeOtpChallenge(jti: string): Promise<void> {
  const mem = fallbackOtpStore.get(jti);
  if (mem) mem.consumed = true;

  try {
    const supabaseAdmin = getSupabaseAdmin();
    await supabaseAdmin
      .from("admin_otp_challenges")
      .update({ consumed: true })
      .eq("jti", jti);
  } catch {
    // ignore
  }
}

/**
 * Valide le code OTP côté serveur de manière atomique (zéro Master OTP, zéro rejeu stateless).
 */
export async function verifyOtpChallenge(
  token: string,
  inputOtp: string,
  request: NextRequest
): Promise<{
  valid: boolean;
  email?: string;
  attemptsLeft?: number;
  error?: string;
}> {
  const parsed = parseVerifiedChallengeCookie(token, request);
  if (!parsed.valid || !parsed.payload) {
    return { valid: false, error: parsed.error || "Challenge invalide." };
  }

  const { jti } = parsed.payload;
  const inputHash = crypto.createHash("sha256").update(inputOtp).digest("hex");

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { data: row, error } = await supabaseAdmin
      .from("admin_otp_challenges")
      .select("jti, email, code_hash, attempts_left, consumed, expires_at")
      .eq("jti", jti)
      .maybeSingle();

    if (!error) {
      if (!row || row.consumed || row.attempts_left <= 0) {
        return {
          valid: false,
          attemptsLeft: 0,
          error: "Session OTP expirée ou révoquée. Veuillez recommencer.",
        };
      }

      if (new Date(row.expires_at).getTime() <= Date.now()) {
        await supabaseAdmin
          .from("admin_otp_challenges")
          .update({ consumed: true })
          .eq("jti", jti);
        return { valid: false, error: "Le challenge de sécurité a expiré." };
      }

      if (safeCompare(inputHash, row.code_hash)) {
        const { data: consumedRow, error: consumeErr } = await supabaseAdmin
          .from("admin_otp_challenges")
          .update({ consumed: true })
          .eq("jti", jti)
          .eq("consumed", false)
          .gt("attempts_left", 0)
          .select("email")
          .maybeSingle();

        if (consumeErr || !consumedRow) {
          return {
            valid: false,
            error: "Ce code OTP a déjà été utilisé ou révoqué.",
          };
        }

        return { valid: true, email: consumedRow.email };
      }

      const nextAttempts = Math.max(0, row.attempts_left - 1);
      await supabaseAdmin
        .from("admin_otp_challenges")
        .update({
          attempts_left: nextAttempts,
          consumed: nextAttempts <= 0,
        })
        .eq("jti", jti);

      if (nextAttempts <= 0) {
        return {
          valid: false,
          attemptsLeft: 0,
          error: "Sécurité déclenchée : 3 codes incorrects consécutifs. Veuillez recommencer.",
        };
      }

      return {
        valid: false,
        attemptsLeft: nextAttempts,
        error: `Code de sécurité invalide. Il vous reste ${nextAttempts} tentative(s).`,
      };
    }

    if (!isMissingRelationError(error)) {
      return { valid: false, error: "Erreur serveur lors de la vérification OTP." };
    }
  } catch {
    // Repli mémoire si Supabase indisponible
  }

  const mem = fallbackOtpStore.get(jti);
  if (!mem || mem.consumed || mem.attemptsLeft <= 0 || Date.now() > mem.expiresAt) {
    return {
      valid: false,
      attemptsLeft: 0,
      error: "Session OTP expirée ou révoquée. Veuillez recommencer.",
    };
  }

  if (safeCompare(inputHash, mem.codeHash)) {
    mem.consumed = true;
    return { valid: true, email: mem.email };
  }

  mem.attemptsLeft -= 1;
  if (mem.attemptsLeft <= 0) {
    mem.consumed = true;
    return {
      valid: false,
      attemptsLeft: 0,
      error: "Sécurité déclenchée : 3 codes incorrects consécutifs. Veuillez recommencer.",
    };
  }

  return {
    valid: false,
    attemptsLeft: mem.attemptsLeft,
    error: `Code de sécurité invalide. Il vous reste ${mem.attemptsLeft} tentative(s).`,
  };
}

/**
 * Génère un jeton de session administrateur signé avec identité, JTI révocable et empreinte.
 */
export async function createSignedToken(
  email: string,
  request: NextRequest
): Promise<string> {
  const jti = crypto.randomUUID();
  const timestamp = Date.now();
  const expiresAt = timestamp + ADMIN_MAX_AGE_SECONDS * 1000;
  const fingerprint = getClientFingerprint(request);
  const cleanEmail = email.toLowerCase().trim();
  const emailB64 = Buffer.from(cleanEmail, "utf8").toString("base64url");

  let persisted = false;
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { error } = await supabaseAdmin.from("admin_sessions").insert({
      jti,
      email: cleanEmail,
      fingerprint,
      revoked: false,
      expires_at: new Date(expiresAt).toISOString(),
    });
    if (!error) {
      persisted = true;
    } else if (!isMissingRelationError(error)) {
      console.error("[SÉCURITÉ] Erreur création session admin:", error.message);
    }
  } catch {
    // fallback
  }

  if (!persisted) {
    pruneFallbackStores();
    fallbackSessionStore.set(jti, {
      jti,
      email: cleanEmail,
      fingerprint,
      revoked: false,
      expiresAt,
    });
  }

  const payload = `v2.${jti}.${emailB64}.${timestamp}.${fingerprint}`;
  const hmac = signPayloadBase64Url(payload);
  return `${payload}.${hmac}`;
}

/**
 * Valide un jeton de session administrateur (signature, expiration, empreinte et révocation serveur).
 */
export async function verifySignedToken(
  token: string,
  request?: NextRequest
): Promise<{ valid: boolean; email?: string; jti?: string }> {
  if (!token || !token.includes(".")) return { valid: false };
  const lastDot = token.lastIndexOf(".");
  if (lastDot <= 0) return { valid: false };

  const payload = token.slice(0, lastDot);
  const hmac = token.slice(lastDot + 1);
  if (!payload || !hmac || !verifyTokenHmac(payload, hmac)) {
    return { valid: false };
  }

  const segments = payload.split(".");
  if (segments.length !== 5 || segments[0] !== "v2") {
    return { valid: false };
  }

  const [, jti, emailB64, timestampStr, tokenFingerprint] = segments;
  const timestamp = Number.parseInt(timestampStr, 10);
  if (
    !jti ||
    !emailB64 ||
    Number.isNaN(timestamp) ||
    Date.now() - timestamp > ADMIN_MAX_AGE_SECONDS * 1000
  ) {
    return { valid: false };
  }

  let email = "";
  try {
    email = Buffer.from(emailB64, "base64url").toString("utf8").toLowerCase().trim();
  } catch {
    return { valid: false };
  }

  if (!email || !getAuthorizedAdminEmails().includes(email)) {
    return { valid: false };
  }

  if (request) {
    const expectedFingerprint = getClientFingerprint(request);
    if (!safeCompare(tokenFingerprint, expectedFingerprint)) {
      return { valid: false };
    }
  }

  // Vérification de révocation serveur
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from("admin_sessions")
      .select("jti, revoked, expires_at")
      .eq("jti", jti)
      .maybeSingle();

    if (!error) {
      if (!data || data.revoked || new Date(data.expires_at).getTime() <= Date.now()) {
        return { valid: false };
      }
      return { valid: true, email, jti };
    }

    if (!isMissingRelationError(error)) {
      return { valid: false };
    }
  } catch {
    // Repli mémoire
  }

  const mem = fallbackSessionStore.get(jti);
  if (mem && (mem.revoked || Date.now() > mem.expiresAt)) {
    return { valid: false };
  }

  return { valid: true, email, jti };
}

/**
 * Retourne l'état et l'identité de la session administrateur authentifiée.
 */
export async function getAdminSession(
  request: NextRequest
): Promise<{ valid: boolean; email?: string; jti?: string }> {
  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (!token) return { valid: false };
  return verifySignedToken(token, request);
}

/**
 * Valide si la requête possède une session administrateur authentifiée valide.
 */
export async function verifyAdminSession(request: NextRequest): Promise<boolean> {
  const session = await getAdminSession(request);
  return session.valid;
}

/**
 * Révoque immédiatement la session administrateur côté serveur lors de la déconnexion.
 */
export async function revokeAdminSession(request: NextRequest): Promise<void> {
  const session = await getAdminSession(request);
  if (!session.valid || !session.jti) return;

  const mem = fallbackSessionStore.get(session.jti);
  if (mem) mem.revoked = true;

  try {
    const supabaseAdmin = getSupabaseAdmin();
    await supabaseAdmin
      .from("admin_sessions")
      .update({ revoked: true })
      .eq("jti", session.jti);
  } catch {
    // ignore
  }
}
