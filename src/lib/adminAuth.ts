import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import net from "net";
import { getSupabaseAdmin } from "@/lib/supabase";
import { consumeRateLimit } from "@/lib/rateLimit";

export const ADMIN_COOKIE_NAME = "eea_admin_session";
export const ADMIN_OTP_COOKIE_NAME = "eea_admin_otp_challenge";
export const ADMIN_MAX_AGE_SECONDS = 60 * 60 * 8; // 8 heures
export const ADMIN_OTP_MAX_AGE_SECONDS = 5 * 60; // 5 minutes
export type OtpChallengeMode = "email_otp" | "totp";

interface StoredOtpChallenge {
  jti: string;
  email: string;
  mode: OtpChallengeMode;
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

export interface DevAdminConfig {
  email: string;
  password: string;
  totpSecret: string;
}

const fallbackOtpStore = new Map<string, StoredOtpChallenge>();
const fallbackSessionStore = new Map<string, StoredAdminSession>();
const MAX_FALLBACK_ENTRIES = 2_000;
const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
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

function isMissingRelationError(
  error: { code?: string; message?: string } | null
): boolean {
  if (!error) return false;
  return (
    error.code === "PGRST205" ||
    error.code === "42P01" ||
    Boolean(error.message?.includes("Could not find the table"))
  );
}

/**
 * Clé secrète cryptographique dédiée exclusivement à la signature HMAC des sessions et OTP.
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
 * Récupère la liste des comptes propriétaires (2FA par email Resend obligatoire).
 */
export function getOwnerAdminEmails(): string[] {
  const rawConfiguredEmails =
    process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || "";
  return Array.from(
    new Set(
      rawConfiguredEmails
        .split(",")
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean)
    )
  );
}

/**
 * Décode une clé Base32 RFC 4648 pour la vérification TOTP RFC 6238.
 */
export function decodeBase32(secret: string): Buffer {
  const clean = secret.toUpperCase().replace(/[\s=-]/g, "");
  if (!clean) return Buffer.alloc(0);

  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (const ch of clean) {
    const idx = BASE32_ALPHABET.indexOf(ch);
    if (idx === -1) return Buffer.alloc(0);
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

/**
 * Calcule un code TOTP à 6 chiffres (RFC 6238, HMAC-SHA1, pas 30s) pour un compteur donné.
 */
export function generateTotpAtStep(secretBase32: string, step: number): string {
  const key = decodeBase32(secretBase32);
  if (key.length === 0) {
    throw new Error("Clé TOTP Base32 invalide.");
  }

  const counter = Buffer.alloc(8);
  const high = Math.floor(step / 0x100000000);
  const low = step >>> 0;
  counter.writeUInt32BE(high, 0);
  counter.writeUInt32BE(low, 4);

  const hmac = crypto.createHmac("sha1", key).update(counter).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code =
    (((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff)) %
    1_000_000;

  return String(code).padStart(6, "0");
}

/**
 * Génère le code TOTP courant à 6 chiffres.
 */
export function generateCurrentTotp(secretBase32: string): string {
  return generateTotpAtStep(secretBase32, Math.floor(Date.now() / 30_000));
}

/**
 * Vérifie un code TOTP à 6 chiffres avec tolérance de dérive d'horloge de ±30s.
 */
export function verifyTotpCode(
  secretBase32: string,
  inputOtp: string
): { valid: boolean; matchedStep?: number } {
  if (!/^\d{6}$/.test(inputOtp)) return { valid: false };
  const currentStep = Math.floor(Date.now() / 30_000);

  let matchedStep: number | undefined;
  for (const offset of [-1, 0, 1]) {
    const step = currentStep + offset;
    const expected = generateTotpAtStep(secretBase32, step);
    if (safeCompare(inputOtp, expected)) {
      matchedStep = step;
    }
  }

  return matchedStep !== undefined
    ? { valid: true, matchedStep }
    : { valid: false };
}

/**
 * Configuration isolée du compte développeur (mot de passe propre >= 20 chars + 2FA TOTP).
 */
export function getDevAdminConfig(): DevAdminConfig | null {
  const email = (process.env.ADMIN_DEV_EMAIL || "").trim().toLowerCase();
  const password = (process.env.ADMIN_DEV_PASSWORD || "").trim();
  const totpSecret = (process.env.ADMIN_DEV_TOTP_SECRET || "").trim();

  if (!email || !password || !totpSecret) return null;
  if (password.length < 20) {
    console.error(
      "[ALERTE SÉCURITÉ] ADMIN_DEV_PASSWORD ignoré car inférieur à 20 caractères."
    );
    return null;
  }
  if (decodeBase32(totpSecret).length < 10) {
    console.error(
      "[ALERTE SÉCURITÉ] ADMIN_DEV_TOTP_SECRET Base32 invalide ou trop court."
    );
    return null;
  }
  if (getOwnerAdminEmails().includes(email)) {
    console.error(
      "[ALERTE SÉCURITÉ] ADMIN_DEV_EMAIL ne doit pas être listé dans ADMIN_EMAILS."
    );
    return null;
  }

  return { email, password, totpSecret };
}

/**
 * Liste complète des adresses autorisées à maintenir une session admin valide.
 */
export function getAuthorizedAdminEmails(): string[] {
  const owners = getOwnerAdminEmails();
  const dev = getDevAdminConfig();
  return dev ? Array.from(new Set([...owners, dev.email])) : owners;
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
  mode: OtpChallengeMode;
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
 * Crée un challenge 2FA persistant côté serveur (email OTP ou TOTP Authenticator).
 */
export async function createOtpChallenge(
  email: string,
  otpCode: string | null,
  request: NextRequest,
  mode: OtpChallengeMode = "email_otp"
): Promise<string> {
  const jti = crypto.randomUUID();
  const issuedAt = Date.now();
  const expiresAt = issuedAt + ADMIN_OTP_MAX_AGE_SECONDS * 1000;
  const fingerprint = getClientFingerprint(request);
  const clientIp = getClientIdentifier(request);
  const cleanEmail = email.toLowerCase().trim();
  const codeHash =
    mode === "totp"
      ? "TOTP_MODE"
      : crypto
          .createHash("sha256")
          .update(otpCode || "")
          .digest("hex");

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
      mode,
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
    mode,
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
      .select("jti, email, code_hash, attempts_left, consumed, issued_at, expires_at")
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
          mode: data.code_hash === "TOTP_MODE" ? "totp" : "email_otp",
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

async function validateChallengeSecret(
  email: string,
  codeHash: string,
  mode: OtpChallengeMode,
  inputOtp: string
): Promise<{ matched: boolean; error?: string }> {
  if (mode === "totp" || codeHash === "TOTP_MODE") {
    const devConfig = getDevAdminConfig();
    if (!devConfig || !safeCompare(email.toLowerCase().trim(), devConfig.email)) {
      return { matched: false, error: "Compte TOTP non configuré ou révoqué." };
    }

    const totpCheck = verifyTotpCode(devConfig.totpSecret, inputOtp);
    if (!totpCheck.valid || totpCheck.matchedStep === undefined) {
      return { matched: false };
    }

    // Protection RFC 6238 contre le rejeu d'un même code TOTP dans sa fenêtre de 30s
    const stepGuard = await consumeRateLimit(
      "totp_step",
      `${devConfig.email}:${totpCheck.matchedStep}`,
      { windowMs: 120_000, maxRequests: 1 }
    );

    if (!stepGuard.allowed) {
      return {
        matched: false,
        error: "Ce code Authenticator a déjà été utilisé. Attendez le prochain code (30s).",
      };
    }

    return { matched: true };
  }

  const inputHash = crypto.createHash("sha256").update(inputOtp).digest("hex");
  return { matched: safeCompare(inputHash, codeHash) };
}

/**
 * Valide le code 2FA côté serveur de manière atomique (Email OTP ou TOTP, zéro rejeu stateless).
 */
export async function verifyOtpChallenge(
  token: string,
  inputOtp: string,
  request: NextRequest
): Promise<{
  valid: boolean;
  email?: string;
  mode?: OtpChallengeMode;
  attemptsLeft?: number;
  error?: string;
}> {
  const parsed = parseVerifiedChallengeCookie(token, request);
  if (!parsed.valid || !parsed.payload) {
    return { valid: false, error: parsed.error || "Challenge invalide." };
  }

  const { jti, mode } = parsed.payload;

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
          error: "Session 2FA expirée ou révoquée. Veuillez recommencer.",
        };
      }

      if (new Date(row.expires_at).getTime() <= Date.now()) {
        await supabaseAdmin
          .from("admin_otp_challenges")
          .update({ consumed: true })
          .eq("jti", jti);
        return { valid: false, error: "Le challenge de sécurité a expiré." };
      }

      const effectiveMode: OtpChallengeMode =
        row.code_hash === "TOTP_MODE" ? "totp" : "email_otp";
      const validation = await validateChallengeSecret(
        row.email,
        row.code_hash,
        effectiveMode,
        inputOtp
      );

      if (validation.matched) {
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
            error: "Ce code 2FA a déjà été utilisé ou révoqué.",
          };
        }

        return { valid: true, email: consumedRow.email, mode: effectiveMode };
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
          error:
            "Sécurité déclenchée : 3 codes incorrects consécutifs. Veuillez recommencer.",
        };
      }

      return {
        valid: false,
        attemptsLeft: nextAttempts,
        error:
          validation.error ||
          `Code de sécurité invalide. Il vous reste ${nextAttempts} tentative(s).`,
      };
    }

    if (!isMissingRelationError(error)) {
      return { valid: false, error: "Erreur serveur lors de la vérification 2FA." };
    }
  } catch {
    // Repli mémoire si Supabase indisponible
  }

  const mem = fallbackOtpStore.get(jti);
  if (!mem || mem.consumed || mem.attemptsLeft <= 0 || Date.now() > mem.expiresAt) {
    return {
      valid: false,
      attemptsLeft: 0,
      error: "Session 2FA expirée ou révoquée. Veuillez recommencer.",
    };
  }

  const memValidation = await validateChallengeSecret(
    mem.email,
    mem.codeHash,
    mode,
    inputOtp
  );
  if (memValidation.matched) {
    mem.consumed = true;
    return { valid: true, email: mem.email, mode: mem.mode };
  }

  mem.attemptsLeft -= 1;
  if (mem.attemptsLeft <= 0) {
    mem.consumed = true;
    return {
      valid: false,
      attemptsLeft: 0,
      error:
        "Sécurité déclenchée : 3 codes incorrects consécutifs. Veuillez recommencer.",
    };
  }

  return {
    valid: false,
    attemptsLeft: mem.attemptsLeft,
    error:
      memValidation.error ||
      `Code de sécurité invalide. Il vous reste ${mem.attemptsLeft} tentative(s).`,
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
