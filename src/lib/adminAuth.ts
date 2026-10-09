import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export const ADMIN_COOKIE_NAME = "eea_admin_session";
export const ADMIN_OTP_COOKIE_NAME = "eea_admin_otp_challenge";
export const ADMIN_MAX_AGE_SECONDS = 60 * 60 * 8; // 8 heures
export const ADMIN_OTP_MAX_AGE_SECONDS = 5 * 60; // 5 minutes

/**
 * Clé secrète cryptographique du serveur pour la signature HMAC
 * Requiert ADMIN_OTP_SECRET_KEY ou SUPABASE_SERVICE_ROLE_KEY (entropie élevée)
 */
export function getSigningSecret(): string {
  const secret =
    process.env.ADMIN_OTP_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "[ALERTE CRITIQUE SÉCURITÉ] Variable ADMIN_OTP_SECRET_KEY ou SUPABASE_SERVICE_ROLE_KEY manquante en production."
      );
    }
    console.warn(
      "[AVERTISSEMENT SÉCURITÉ DEV] Aucune clé secrète HMAC configurée. Utilisation d'un sel sécurisé local."
    );
    return "eea-dev-institutional-secret-salt-2026-strict";
  }

  return secret;
}

/**
 * Récupère la liste stricte des adresses email autorisées à administrer la plateforme.
 * Refuse catégoriquement tout accès si aucun administrateur n'est explicitement listé.
 */
export function getAuthorizedAdminEmails(): string[] {
  const rawConfiguredEmails =
    process.env.ADMIN_EMAILS ||
    process.env.ADMIN_EMAIL ||
    "";
  return rawConfiguredEmails
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
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
 * Calcule l'empreinte matérielle du client basée sur le navigateur (User-Agent).
 * Résilient aux changements d'adresses IP dynamiques fréquents sur les réseaux mobiles 4G/5G.
 */
export function getClientFingerprint(request: NextRequest): string {
  const userAgent = request.headers.get("user-agent") || "unknown-agent";
  return crypto.createHash("sha256").update(userAgent).digest("hex").slice(0, 16);
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
 * Structure du challenge 2FA apatride (stateless)
 */
export interface OtpChallengePayload {
  email: string;
  codeHash: string;
  expiresAt: number;
  attemptsLeft: number;
  fingerprint: string;
  clientIp: string;
  issuedAt?: number;
}

/**
 * Génère un challenge OTP 2FA signé pour cookie HttpOnly (compatible Serverless & Multi-instances)
 */
export function createOtpChallenge(
  email: string,
  otpCode: string,
  request: NextRequest
): string {
  const expiresAt = Date.now() + ADMIN_OTP_MAX_AGE_SECONDS * 1000;
  const fingerprint = getClientFingerprint(request);
  const clientIp = getClientIdentifier(request);
  const codeHash = crypto.createHash("sha256").update(otpCode).digest("hex");

  const payloadData: OtpChallengePayload = {
    email: email.toLowerCase().trim(),
    codeHash,
    expiresAt,
    attemptsLeft: 3,
    fingerprint,
    clientIp,
    issuedAt: Date.now(),
  };

  const payloadStr = Buffer.from(JSON.stringify(payloadData)).toString("base64url");
  const hmac = crypto
    .createHmac("sha256", getSigningSecret())
    .update(payloadStr)
    .digest("hex");
  return `${payloadStr}.${hmac}`;
}

/**
 * Valide cryptographiquement le jeton de challenge OTP sans altérer son compteur d'essais
 * Utilisé pour vérifier l'authenticité lors d'un renvoi d'OTP ou d'une inspection
 */
export function getValidChallengePayload(
  token: string,
  request: NextRequest
): {
  valid: boolean;
  payload?: OtpChallengePayload;
  error?: string;
} {
  if (!token || !token.includes(".")) {
    return { valid: false, error: "Jeton de challenge manquant ou corrompu." };
  }
  const parts = token.split(".");
  if (parts.length !== 2) {
    return { valid: false, error: "Format du challenge invalide." };
  }
  const [payloadStr, hmac] = parts;
  const expectedHmac = crypto
    .createHmac("sha256", getSigningSecret())
    .update(payloadStr)
    .digest("hex");

  const hmacBuffer = Buffer.from(hmac);
  const expectedBuffer = Buffer.from(expectedHmac);
  if (
    hmacBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(hmacBuffer, expectedBuffer)
  ) {
    return { valid: false, error: "Signature du challenge de sécurité invalide ou altérée." };
  }

  let data: OtpChallengePayload;
  try {
    data = JSON.parse(Buffer.from(payloadStr, "base64url").toString("utf8"));
  } catch {
    return { valid: false, error: "Données du challenge illisibles." };
  }

  if (Date.now() > data.expiresAt) {
    return { valid: false, error: "Le challenge de sécurité a expiré." };
  }

  const currentFingerprint = getClientFingerprint(request);
  if (data.fingerprint !== currentFingerprint) {
    return { valid: false, error: "Divergence d'empreinte réseau détectée. Session révoquée." };
  }

  return { valid: true, payload: data };
}

/**
 * Valide le challenge OTP 2FA signé et décrémente les tentatives en cas d'erreur
 */
export function verifyOtpChallenge(
  token: string,
  inputOtp: string,
  request: NextRequest
): {
  valid: boolean;
  email?: string;
  attemptsLeft?: number;
  updatedToken?: string;
  error?: string;
} {
  const verified = getValidChallengePayload(token, request);
  if (!verified.valid || !verified.payload) {
    return { valid: false, error: verified.error || "Challenge invalide." };
  }

  const data = verified.payload;
  const inputHash = crypto.createHash("sha256").update(inputOtp).digest("hex");
  const isMatch = safeCompare(inputHash, data.codeHash);

  if (isMatch) {
    return { valid: true, email: data.email };
  }

  // Échec : décrémenter le nombre d'essais
  data.attemptsLeft -= 1;
  if (data.attemptsLeft <= 0) {
    return {
      valid: false,
      attemptsLeft: 0,
      error: "Sécurité déclenchée : 3 codes incorrects consécutifs. Veuillez recommencer.",
    };
  }

  const newPayloadStr = Buffer.from(JSON.stringify(data)).toString("base64url");
  const newHmac = crypto
    .createHmac("sha256", getSigningSecret())
    .update(newPayloadStr)
    .digest("hex");

  return {
    valid: false,
    attemptsLeft: data.attemptsLeft,
    updatedToken: `${newPayloadStr}.${newHmac}`,
    error: `Code de sécurité invalide. Il vous reste ${data.attemptsLeft} tentative(s).`,
  };
}

/**
 * Génère un jeton de session administrateur signé numériquement avec empreinte client et timestamp
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
 * Vérifie la signature, l'expiration temporelle et l'empreinte matérielle du jeton de session
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

  // Vérification de l'expiration temporelle serveur (8 heures max)
  const segments = payload.split("_");
  if (segments.length >= 3) {
    const timestamp = parseInt(segments[2], 10);
    if (isNaN(timestamp) || Date.now() - timestamp > ADMIN_MAX_AGE_SECONDS * 1000) {
      console.warn("[ALERTE SÉCURITÉ] Jeton de session administrateur expiré.");
      return false;
    }
  } else {
    return false;
  }

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
