import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-project.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

// Client public pour le frontend (anonyme / RLS)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Client administrateur avec Service Role (exécuté UNIQUEMENT côté serveur pour opérations privilégiées)
export const getSupabaseAdmin = () => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error("La variable d'environnement SUPABASE_SERVICE_ROLE_KEY est manquante.");
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
};

// Types TypeScript des données EEA
export type MemberStatus = "pending" | "active" | "expired" | "revoked";

/**
 * Calcule le statut effectif d'un membre (adhésion permanente à vie)
 */
export function getEffectiveMemberStatus(member: {
  status: MemberStatus;
  expires_at?: string | null;
}): MemberStatus {
  if (member.status === "revoked") return "revoked";
  if (member.status === "pending") return "pending";
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
