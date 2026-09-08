"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import {
  Award,
  Calendar,
  Building2,
  Users,
  Compass,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

export default function HistorySection() {
  const milestones = [
    {
      year: "2008",
      period: "Genèse Fondatrice",
      title: "La Genèse à l'UCAD Dakar",
      description:
        "L'idée et le projet voient le jour au sein de la Bibliothèque Centrale de l'UCAD, portés par des étudiants visionnaires avec l'appui du Dr. Serigne Saliou FALL (expert en finance), déterminés à transformer le continent.",
      icon: Award,
      badgeColor: "text-[#D4AF37] border-[#D4AF37]/40 bg-[#D4AF37]/10",
      accent: "from-[#D4AF37] to-[#F3DE8A]",
    },
    {
      year: "2008 — 2025",
      period: "Maturation Statutaire",
      title: "Agrément & Reconnaissance d'État",
      description:
        "Structuration des 7 statuts directeurs, consolidation des deux piliers Haute Tech & Agro-business et obtention de la reconnaissance formelle des autorités étatiques.",
      icon: Users,
      badgeColor: "text-sky-300 border-sky-400/40 bg-sky-950/40",
      accent: "from-sky-400 to-blue-600",
    },
    {
      year: "2026",
      period: "Phase Opérationnelle",
      title: "Démarrage Officiel Panafricain",
      description:
        "Entrée en pleine activité opérationnelle : déploiement de la plateforme numérique panafricaine, délivrance des cartes de membre certifiées par QR code et premiers fonds d'amorçage.",
      icon: Building2,
      badgeColor: "text-emerald-300 border-emerald-400/40 bg-emerald-950/40",
      accent: "from-emerald-400 to-teal-600",
    },
    {
      year: "Horizon 2030",
      period: "Cap Continental",
      title: "Souveraineté Économique & Diaspora",
      description:
        "Réseau continental interconnecté de 1 000 000+ étudiants entrepreneurs à travers 20+ pays africains et les grandes universités internationales de la diaspora.",
      icon: Compass,
      badgeColor: "text-indigo-300 border-indigo-400/40 bg-indigo-950/40",
      accent: "from-indigo-400 to-purple-600",
    },
  ];

  return (
    <section id="mouvement" className="relative py-24 sm:py-32 bg-[#040813] overflow-hidden border-t border-white/5">
      {/* Background Soft Deep Glow */}
      <div className="absolute top-1/2 left-0 w-[600px] h-[600px] bg-[#0B3C8A]/15 rounded-full blur-[160px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0F224A]/90 border border-[#D4AF37]/40 text-xs font-semibold text-[#D4AF37] uppercase tracking-wider mb-4 shadow-sm">
            <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span className="font-cinzel">Historique & Légitimité Institutionnelle</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Une vision née en{" "}
            <span className="font-cinzel text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] to-[#FFF3B0]">
              2008
            </span>
            , un déploiement officiel en{" "}
            <span className="font-cinzel text-transparent bg-clip-text bg-gradient-to-r from-[#38BDF8] to-[#60A5FA]">
              2026
            </span>
            .
          </h2>

          <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
            L&apos;association <strong className="text-white">Étudiant Entrepreneuriat Afrique (EEA)</strong> est un projet mature, agréé par l&apos;État, pensé pour doter la jeunesse estudiantine d&apos;outils concrets d&apos;incubation, de certification infalsifiable et de financement d&apos;amorçage.
          </p>
        </div>

        {/* CONNECTED INTERACTIVE TIMELINE */}
        <div className="mt-20 relative">
          
          {/* Desktop Connected Laser Beam Line */}
          <div className="hidden lg:block absolute top-[52px] left-8 right-8 h-[3px] bg-gradient-to-r from-[#D4AF37] via-[#38BDF8] to-emerald-400 shadow-[0_0_15px_rgba(212,175,55,0.6)] z-0 pointer-events-none" />

          {/* Milestone Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
            {milestones.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.year}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.6, delay: index * 0.15 }}
                  className="relative flex flex-col justify-between p-7 rounded-2xl bg-gradient-to-b from-[#091733]/90 via-[#071328]/95 to-[#050b18] border border-white/10 hover:border-[#D4AF37]/50 transition-all duration-300 hover:-translate-y-1.5 shadow-xl shadow-black/50 group"
                >
                  <div>
                    {/* Top Beacon & Icon Node */}
                    <div className="flex items-center justify-between mb-5">
                      <div className="relative">
                        <span className="font-cinzel text-xl sm:text-2xl font-black text-white block tracking-tight">
                          {item.year}
                        </span>
                        <span className="text-[10px] text-[#D4AF37] uppercase font-bold tracking-wider">
                          {item.period}
                        </span>
                      </div>

                      {/* Pulsing Beacon Node */}
                      <div className="w-12 h-12 rounded-xl bg-[#0F224A] border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] shadow-lg group-hover:scale-110 transition-transform">
                        <Icon className="w-5 h-5 text-[#D4AF37]" />
                      </div>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-white mb-2 leading-snug group-hover:text-[#FFF3B0] transition-colors">
                      {item.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
                      {item.description}
                    </p>
                  </div>

                  <div className="pt-4 mt-5 border-t border-white/10 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" />
                    <span className="text-[11px] font-semibold text-[#D4AF37] tracking-wider uppercase font-cinzel">
                      Jalon Certifié
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* DEDICATED UCAD HERITAGE SHOWCASE WITH GOLD LEAF CORNERS */}
        <div className="mt-20 relative rounded-3xl bg-gradient-to-br from-[#091733] via-[#071328] to-[#040813] border border-[#D4AF37]/40 p-8 sm:p-12 shadow-2xl shadow-black/80 overflow-hidden">
          
          {/* Decorative Corner Filigrees */}
          <div className="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-[#D4AF37] pointer-events-none" />
          <div className="absolute top-0 right-0 w-12 h-12 border-t-2 border-r-2 border-[#D4AF37] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-12 h-12 border-b-2 border-l-2 border-[#D4AF37] pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 border-[#D4AF37] pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            {/* Left: Real Photo of UCAD Library with Luxury Framing */}
            <div className="lg:col-span-6 relative">
              <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden border-2 border-[#D4AF37]/60 shadow-[0_0_30px_rgba(212,175,55,0.25)] group">
                <Image
                  src="/ucad-library.jpg"
                  alt="Bibliothèque Universitaire Centrale de l'UCAD (Dakar) - Berceau de l'EEA en 2008"
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#040813]/90 via-transparent to-transparent pointer-events-none" />
                
                <div className="absolute bottom-4 left-4 right-4 text-xs text-slate-200 bg-[#040813]/90 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/15 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-[#D4AF37]" />
                    <span className="font-bold text-white font-cinzel">
                      BIBLIOTHÈQUE CENTRALE • UCAD DAKAR
                    </span>
                  </div>
                  <span className="text-[#D4AF37] text-[11px] font-bold font-mono">
                    2008 — 2026
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Narrative of Origin & Architectural Symbolism */}
            <div className="lg:col-span-6 space-y-5">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0B3C8A]/40 border border-[#D4AF37]/40 text-xs font-semibold text-[#D4AF37]">
                <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span className="font-cinzel">Le Berceau Géographique du Mouvement</span>
              </div>

              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-snug">
                Projet né à l&apos;UCAD en 2008 • Démarrage officiel en 2026
              </h3>

              <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
                C&apos;est au sein de la prestigieuse{" "}
                <strong className="text-white font-semibold">Université Cheikh Anta Diop (UCAD)</strong>, devant sa Bibliothèque Universitaire Centrale, que des étudiants visionnaires ont proclamé la fondation de l&apos;EEA en 2008. En 2026, l&apos;organisation déploie toute sa puissance opérationnelle sur le terrain et en ligne.
              </p>

              <div className="text-xs sm:text-sm text-slate-200 leading-relaxed font-normal bg-white/[0.03] p-5 rounded-2xl border border-white/10 space-y-2">
                <strong className="font-cinzel text-[#D4AF37] block text-xs tracking-wider uppercase">
                  Une analogie architecturale vivante :
                </strong>
                <p className="text-slate-300">
                  La toiture de la bibliothèque de l&apos;UCAD, conçue en forme de livre ouvert vers l&apos;avenir, est le reflet physique direct du livre du savoir présent au cœur de notre blason officiel. C&apos;est ici que s&apos;est forgée notre conviction : le diplôme doit féconder la terre et armer l&apos;innovation technologique africaine.
                </p>
              </div>

              <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-slate-300">
                <span className="flex items-center gap-1.5 font-medium text-white">
                  <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />
                  Genèse UCAD (2008)
                </span>
                <span className="text-white/20">•</span>
                <span className="flex items-center gap-1.5 font-medium text-white">
                  <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />
                  Démarrage Officiel (2026)
                </span>
                <span className="text-white/20">•</span>
                <span className="flex items-center gap-1.5 font-medium text-white">
                  <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />
                  Agréé par l&apos;État
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
