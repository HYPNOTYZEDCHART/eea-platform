import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const PLACEHOLDER_URL = "https://placeholder-project.supabase.co";

function resolveSupabaseUrl(): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!url || url.includes("placeholder-project") || url.includes("your-project")) {
    return null;
  }
  return url;
}

function resolvePublicKey(): string | null {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    null
  );
}

function resolveSecretKey(): string | null {
  return (
    process.env.SUPABASE_SECRET_KEY?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    null
  );
}

// Client public pour le frontend (Publishable Key / Anon Key soumise à RLS)
const publicUrl = resolveSupabaseUrl() || PLACEHOLDER_URL;
const publicKey = resolvePublicKey() || "placeholder-publishable-key";
export const supabase: SupabaseClient = createClient(publicUrl, publicKey);

// Client administrateur serveur (Secret Key sb_secret_... ou legacy service_role, UNIQUEMENT côté serveur)
export const getSupabaseAdmin = (): SupabaseClient => {
  const url = resolveSupabaseUrl();
  if (!url) {
    throw new Error("La variable d'environnement NEXT_PUBLIC_SUPABASE_URL est manquante ou invalide.");
  }
  const secretKey = resolveSecretKey();
  if (!secretKey) {
    throw new Error(
      "La variable d'environnement SUPABASE_SECRET_KEY (ou SUPABASE_SERVICE_ROLE_KEY) est manquante."
    );
  }
  return createClient(url, secretKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
};

// Types TypeScript des données EEA
export type MemberStatus = "pending" | "active" | "expired" | "revoked";

/**
 * Calcule le statut effectif d'un membre (prise en compte de l'état, de l'expiration et de la révocation)
 */
export function getEffectiveMemberStatus(member: {
  status: MemberStatus;
  expires_at?: string | null;
}): MemberStatus {
  if (member.status === "revoked") return "revoked";
  if (member.status === "pending") return "pending";
  if (member.status === "expired") return "expired";

  // Vérification de l'échéance temporelle
  if (member.expires_at) {
    const expiryTime = new Date(member.expires_at).getTime();
    if (!isNaN(expiryTime) && expiryTime < Date.now()) {
      return "expired";
    }
  }

  return "active";
}

/**
 * Calcule le nombre de jours restants avant expiration (ou négatif si expiré)
 */
export function getDaysUntilExpiry(expires_at?: string | null): number {
  if (!expires_at) return 0;
  const expiryTime = new Date(expires_at).getTime();
  if (isNaN(expiryTime)) return 0;
  const diffMs = expiryTime - Date.now();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export interface Member {
  id: string;
  membership_id: string; // Ex: EEA-2026-CI-0842
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  country: string;
  university: string;
  field_of_study: string;
  photo_url?: string | null;
  card_pdf_url?: string | null;
  card_image_url?: string | null;
  qr_code_token: string;
  status: MemberStatus;
  payment_method?: string | null;
  payment_reference?: string | null;
  created_at: string;
  expires_at: string;
}

export type PaymentProvider = "wave" | "orange_money" | "stripe" | "cinetpay" | "paydunya" | "whatsapp_manual";
export type PaymentStatus = "pending" | "successful" | "failed";

export interface Payment {
  id: string;
  member_id: string;
  amount: number; // 3000
  currency: string; // XOF
  provider: PaymentProvider;
  transaction_reference?: string | null;
  status: PaymentStatus;
  created_at: string;
  paid_at?: string | null;
}
