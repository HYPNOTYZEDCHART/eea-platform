"use client";

import { useEffect, useState, use } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Building,
  GraduationCap,
  ArrowLeft,
  AlertTriangle,
  Ban,
} from "lucide-react";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import MemberCardBadge from "@/components/MemberCardBadge";
import { supabase, Member, getEffectiveMemberStatus, getDaysUntilExpiry } from "@/lib/supabase";

export default function VerifyPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const resolvedParams = use(params);
  const token = resolvedParams.token;

  const [loading, setLoading] = useState(true);
  const [member, setMember] = useState<Member | null>(null);

  useEffect(() => {
    async function verifyToken() {
      setLoading(true);

      // Validation stricte du format du token (alphanumérique, tirets et underscores, 3 à 64 chars)
      const cleanToken = typeof token === "string" ? token.trim() : "";
      if (!cleanToken || !/^[a-zA-Z0-9_-]{3,64}$/.test(cleanToken)) {
        setMember(null);
        setLoading(false);
        return;
      }

      try {
        // 1. Try querying Supabase
        const { data, error } = await supabase
          .from("members")
          .select("*")
          .eq("qr_code_token", cleanToken)
          .single();

        if (data && !error) {
          setMember(data as Member);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.warn("Supabase check error, trying local fallback:", err);
      }

      // 2. Local fallback check (from localStorage)
      try {
        const localList = JSON.parse(localStorage.getItem("eea_members") || "[]");
        const found = localList.find((m: Member) => m.qr_code_token === token);
        if (found) {
          setMember(found);
          setLoading(false);
          return;
        }

        // Demo token fallback for showcase testing
        if (token === "eea_token_demo_0842" || token.startsWith("demo")) {
          setMember({
            id: "demo-id",
            membership_id: "EEA-2026-SN-0842",
            first_name: "Jean-David",
            last_name: "KOUASSI",
            email: "kouassi.jeandavid@ucad.edu.sn",
            phone: "+221 78 542 53 45",
            country: "Sénégal",
            university: "Université Cheikh Anta Diop (UCAD Dakar)",
            field_of_study: "Génie Logiciel & Agrobusiness",
            photo_url: null,
            qr_code_token: token,
            status: "active",
            created_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          });
          setLoading(false);
          return;
        }
      } catch {
        // ignore
      }

      setMember(null);
      setLoading(false);
    }

    verifyToken();
  }, [token]);

  const whatsappUrl = `https://wa.me/221785425345?text=${encodeURIComponent(
    `Bonjour Secrétariat EEA, je souhaite vérifier manuellement l'authenticité d'une carte de membre avec le token : ${token}`
  )}`;

  return (
    <div className="min-h-screen bg-[#060d1d] text-white pt-28 pb-16 px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center relative overflow-hidden">
      {/* Background Soft Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#0B3C8A]/20 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-xl relative z-10">
        {/* Brand & Top Status */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 group mb-4">
            <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-[#D4AF37] shadow-lg">
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
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Portail Officiel de Vérification d&apos;Authenticité</span>
          </div>
        </div>

        {/* Card Box */}
        <div className="rounded-2xl bg-[#091733] border border-white/10 p-6 sm:p-8 shadow-2xl space-y-6">
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-10 h-10 rounded-full border-2 border-[#D4AF37] border-t-transparent animate-spin mx-auto" />
              <p className="text-sm text-slate-300">
                Interrogation sécurisée du registre central EEA...
              </p>
            </div>
          ) : member ? (
            <>
              {/* Authenticity / Status Banner */}
              {(() => {
                const effectiveStatus = getEffectiveMemberStatus(member);
                const daysRemaining = getDaysUntilExpiry(member.expires_at);

                if (effectiveStatus === "revoked") {
                  return (
                    <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/40 flex items-start gap-3.5 shadow-lg">
                      <div className="w-10 h-10 rounded-full bg-rose-500/20 border border-rose-500/50 flex items-center justify-center text-rose-400 shrink-0 mt-0.5">
                        <Ban className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <div className="text-sm font-black text-rose-400 uppercase tracking-wide">
                          CARTE RÉVOQUÉE — MEMBRE ÉJECTÉ DU RÉSEAU
                        </div>
                        <p className="text-xs text-rose-200/90 leading-relaxed">
                          Ce membre a fait l&apos;objet d&apos;une mesure d&apos;exclusion ou de radiation prononcée par le Secrétariat Général. Cette carte et ce QR Code sont strictement caducs, privés de tout effet juridique et interdits d&apos;usage.
                        </p>
                      </div>
                    </div>
                  );
                }

                if (effectiveStatus === "expired") {
                  return (
                    <div className="p-4 rounded-xl bg-amber-500/15 border border-amber-500/40 flex items-start gap-3.5 shadow-lg">
                      <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                        <AlertTriangle className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <div className="text-sm font-black text-amber-400 uppercase tracking-wide">
                          CARTE EXPIRÉE — RENOUVELLEMENT REQUIS
                        </div>
                        <p className="text-xs text-amber-200/90 leading-relaxed">
                          La validité statutaire d&apos;un (1) an de cette carte de membre est arrivée à son terme. Les droits d&apos;accès aux programmes d&apos;incubation, hackathons et financements EEA sont suspendus tant que la cotisation annuelle (3 000 FCFA) n&apos;est pas renouvelée.
                        </p>
                      </div>
                    </div>
                  );
                }

                if (effectiveStatus === "pending") {
                  return (
                    <div className="p-4 rounded-xl bg-amber-400/15 border border-amber-400/30 flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-full bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shrink-0">
                        <Clock className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="text-sm font-extrabold text-amber-300 uppercase">
                          ADHÉSION EN ATTENTE DE VALIDATION
                        </div>
                        <p className="text-xs text-slate-300">
                          Le dossier a été soumis et attend la confirmation du versement de 3 000 FCFA par la trésorerie.
                        </p>
                      </div>
                    </div>
                  );
                }

                return (
                  <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-sm font-extrabold text-emerald-400">
                        DOCUMENT AUTHENTIQUE & OFFICIEL ACTIF
                      </div>
                      <p className="text-xs text-slate-300">
                        Cette carte est certifiée valide par le secrétariat permanent de l&apos;EEA (valide encore {daysRemaining > 0 ? `${daysRemaining} jours` : "moins d'un jour"}).
                      </p>
                    </div>
                  </div>
                );
              })()}

              {/* Official Member Virtual Card Badge with Download Actions */}
              <div className="pt-2">
                <MemberCardBadge member={member} compact={true} />
              </div>

              {/* Verified Details Table */}
              <div className="space-y-3 text-xs divide-y divide-white/5 pt-1">
                <div className="flex items-center justify-between py-2">
                  <span className="text-slate-400 flex items-center gap-2">
                    <Building className="w-4 h-4 text-[#D4AF37]" />
                    Université / Établissement
                  </span>
                  <span className="text-white font-medium text-right">{member.university}</span>
                </div>

                <div className="flex items-center justify-between py-2">
                  <span className="text-slate-400 flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-[#38BDF8]" />
                    Filière d&apos;Études
                  </span>
                  <span className="text-white font-medium text-right">{member.field_of_study}</span>
                </div>

                <div className="flex items-center justify-between py-2">
                  <span className="text-slate-400 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400" />
                    Période de Validité
                  </span>
                  <span
                    className={`font-semibold text-right ${
                      getEffectiveMemberStatus(member) === "expired"
                        ? "text-amber-400 underline font-bold"
                        : "text-slate-300"
                    }`}
                  >
                    Jusqu&apos;au {new Date(member.expires_at).toLocaleDateString("fr-FR")}
                    {getEffectiveMemberStatus(member) === "expired" && " (Échue)"}
                  </span>
                </div>
              </div>

              {/* Action Box if Expired */}
              {getEffectiveMemberStatus(member) === "expired" && (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-center space-y-2.5">
                  <p className="text-xs text-amber-200 font-semibold">
                    Besoin de réactiver votre carte de membre et vos droits EEA ?
                  </p>
                  <p className="text-[11px] text-slate-300">
                    Transférez votre cotisation annuelle de <strong>3 000 FCFA</strong> vers Wave ou Orange Money au <strong>+221 78 542 53 45</strong> en mentionnant votre matricule <em>{member.membership_id}</em>.
                  </p>
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                  >
                    <WhatsAppIcon className="w-4 h-4" />
                    <span>Contacter le Secrétariat pour Renouvellement (+221 78 542 53 45)</span>
                  </a>
                </div>
              )}

              {/* Institution Legal Note */}
              <p className="text-[11px] text-slate-400 leading-relaxed text-center bg-white/[0.02] p-3 rounded-lg border border-white/5">
                Organisation certifiée, fondée en 2008 à l&apos;Université Cheikh Anta Diop (UCAD) de Dakar. Tout usage frauduleux ou falsification expose son auteur aux poursuites prévues par la législation.
              </p>
            </>
          ) : (
            /* Member NOT FOUND */
            <div className="py-8 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-rose-500/20 border border-rose-500/40 mx-auto flex items-center justify-center text-rose-400">
                <XCircle className="w-6 h-6" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-white">
                  Carte ou Token Non Reconnu
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Aucun membre actif ne correspond à ce code de vérification dans le registre central officiel.
                </p>
              </div>

              <div className="pt-2">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs"
                >
                  <WhatsAppIcon className="w-4 h-4" />
                  <span>Vérifier manuellement auprès du secrétariat (+221 78 542 53 45)</span>
                </a>
              </div>
            </div>
          )}

          {/* Bottom Actions */}
          <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Retour à l&apos;accueil EEA</span>
            </Link>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#25D366] hover:underline font-semibold"
            >
              Assistance 78 542 53 45
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
