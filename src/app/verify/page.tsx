"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ShieldCheck,
  Search,
  ArrowRight,
  ArrowLeft,
  QrCode,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import { supabase } from "@/lib/supabase";

export default function VerifyPortalPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanQuery = query.trim();
    if (!cleanQuery) {
      setErrorMessage("Veuillez saisir un matricule ou un jeton de vérification.");
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      // 1. If it looks like a token directly, route to /verify/[token]
      if (cleanQuery.startsWith("eea_token_") || cleanQuery.length > 20) {
        router.push(`/verify/${encodeURIComponent(cleanQuery)}`);
        return;
      }

      // 2. Query Supabase by membership_id or qr_code_token
      const { data } = await supabase
        .from("members")
        .select("qr_code_token")
        .or(`membership_id.ilike.%${cleanQuery}%,qr_code_token.eq.${cleanQuery}`)
        .limit(1)
        .maybeSingle();

      if (data?.qr_code_token) {
        router.push(`/verify/${encodeURIComponent(data.qr_code_token)}`);
        return;
      }

      // 3. Fallback search in localStorage
      if (typeof window !== "undefined") {
        try {
          const localList = JSON.parse(localStorage.getItem("eea_members") || "[]");
          const found = localList.find(
            (m: { membership_id?: string; qr_code_token?: string }) =>
              m.membership_id?.toLowerCase() === cleanQuery.toLowerCase() ||
              m.qr_code_token === cleanQuery
          );
          if (found?.qr_code_token) {
            router.push(`/verify/${encodeURIComponent(found.qr_code_token)}`);
            return;
          }
        } catch {
          // ignore
        }
      }

      // 4. If demo matricule
      if (cleanQuery.toUpperCase().includes("0842") || cleanQuery.toLowerCase().includes("demo")) {
        router.push(`/verify/eea_token_demo_0842`);
        return;
      }

      setErrorMessage(
        `Aucun membre officiel actif ne correspond au matricule ou jeton "${cleanQuery}". Vérifiez la saisie ou contactez le Secrétariat Général.`
      );
    } catch (err) {
      console.warn("Verify error:", err);
      // Fallback route directly
      router.push(`/verify/${encodeURIComponent(cleanQuery)}`);
    } finally {
      setLoading(false);
    }
  };

  const whatsappUrl = `https://wa.me/221785425345?text=${encodeURIComponent(
    "Bonjour Secrétariat EEA, je souhaite vérifier manuellement l'authenticité d'une carte de membre."
  )}`;

  return (
    <div className="min-h-screen bg-[#060d1d] text-white pt-28 pb-16 px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center relative overflow-hidden">
      {/* Background Soft Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[650px] h-[350px] bg-[#0B3C8A]/20 rounded-full blur-[150px] pointer-events-none" />

      <div className="w-full max-w-xl relative z-10 space-y-8">
        {/* Brand & Top Status */}
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-3 group mb-4">
            <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-[#D4AF37] shadow-lg shadow-[#D4AF37]/20">
              <Image src="/logo-eea.jpg" alt="Logo EEA" fill className="object-cover" />
            </div>
            <div className="text-left">
              <div className="font-black text-xl tracking-tight text-white">EEA</div>
              <div className="text-xs text-[#D4AF37] font-semibold uppercase tracking-wider">
                Étudiant Entrepreneuriat Afrique
              </div>
            </div>
          </Link>

          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#0F224A] border border-[#D4AF37]/30 text-xs font-bold text-[#D4AF37] uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Portail Officiel de Vérification d&apos;Authenticité</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-4">
            Vérifier une Carte de Membre
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-md mx-auto">
            Interrogez instantanément le registre central officiel de l&apos;organisation pour attester de la validité d&apos;une carte de membre EEA.
          </p>
        </div>

        {/* Card Form */}
        <div className="rounded-2xl bg-[#091733] border border-white/10 p-6 sm:p-8 shadow-2xl space-y-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Matricule Officiel ou Jeton de Sécurité
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="Ex: EEA-2026-SN-0842 ou eea_token_..."
                  required
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white/[0.04] border border-white/15 text-white placeholder-slate-500 focus:outline-none focus:border-[#D4AF37] text-sm font-mono"
                />
                <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">
                Saisissez le matricule figurant sous le nom de l&apos;étudiant ou scannez le QR code imprimé sur la carte.
              </p>
            </div>

            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-bold text-[#060d1d] bg-gradient-to-r from-[#D4AF37] via-[#F3DE8A] to-[#D4AF37] hover:brightness-105 transition-all text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-[#D4AF37]/20 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>Recherche dans le registre...</span>
              ) : (
                <>
                  <QrCode className="w-4 h-4" />
                  <span>Vérifier l&apos;Authenticité Immédiate</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Test Link */}
          <div className="pt-4 border-t border-white/10 text-center space-y-2">
            <span className="text-[11px] text-slate-400 block">
              Vous souhaitez tester avec un badge d&apos;exemple ?
            </span>
            <button
              type="button"
              onClick={() => router.push("/verify/eea_token_demo_0842")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-[#D4AF37] cursor-pointer"
            >
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>Tester la vérification : Carte Démo (EEA-2026-SN-0842)</span>
            </button>
          </div>

          {/* Bottom Actions */}
          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Retour à l&apos;accueil</span>
            </Link>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[#25D366] hover:underline font-semibold"
            >
              <WhatsAppIcon className="w-3.5 h-3.5" />
              <span>Assistance Secrétariat (+221 78 542 53 45)</span>
            </a>
          </div>
        </div>

        {/* Legal Authority Note */}
        <p className="text-[11px] text-slate-400 text-center leading-relaxed max-w-md mx-auto">
          Organisation reconnue par l&apos;État, fondée en 2008 à l&apos;UCAD (Dakar, Sénégal). Tout certificat ou carte non répertorié dans ce registre central est nul et non avenu.
        </p>
      </div>
    </div>
  );
}
