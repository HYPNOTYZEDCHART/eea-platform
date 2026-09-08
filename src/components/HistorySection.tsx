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
} from "lucide-react";

export default function HistorySection() {
  const milestones = [
    {
      year: "2008",
      title: "La Genèse à l'UCAD Dakar",
      description:
        "L'idée et le projet voient le jour au sein de la Bibliothèque Centrale de l'UCAD, portés par des étudiants avec l'appui du Dr. Serigne Saliou FALL (expert en finance), déterminés à transformer le continent.",
      icon: Award,
    },
    {
      year: "2008 - 2025",
      title: "Maturation & Agrément d'État",
      description:
        "Structuration des 7 statuts officiels, consolidation des piliers Tech & Agro-business et obtention de la reconnaissance formelle des pouvoirs publics.",
      icon: Users,
    },
    {
      year: "2026",
      isCurrent: true,
      title: "Démarrage Opérationnel Officiel",
      description:
        "Entrée effective en activité opérationnelle : déploiement de la plateforme numérique panafricaine, délivrance des cartes de membre certifiées et fonds d'amorçage.",
      icon: Building2,
    },
    {
      year: "Horizon 2030",
      title: "Souveraineté Économique & Diaspora",
      description:
        "Réseau continental interconnecté de 1 million+ étudiants entrepreneurs à travers 20 pays africains et les universités internationales.",
      icon: Compass,
    },
  ];

  return (
    <section id="mouvement" className="relative py-24 sm:py-32 bg-[#060d1d]/20 backdrop-blur-[1px] overflow-hidden border-t border-white/5">
      {/* Background Subtle Accent */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-[#0B3C8A]/15 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Section Header */}
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0F224A] border border-[#D4AF37]/30 text-xs font-semibold text-[#D4AF37] uppercase tracking-wider mb-4">
            <Calendar className="w-3.5 h-3.5" />
            <span>Historique & Légitimité Institutionnelle</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Une vision née en{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] to-[#F3DE8A]">
              2008
            </span>
            , un déploiement officiel en{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#38BDF8] to-[#60A5FA]">
              2026
            </span>
            .
          </h2>

          <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
            L&apos;association <strong className="text-white">Étudiant Entrepreneuriat Afrique (EEA)</strong> a vu le jour au sein de l&apos;UCAD en 2008. Reconnue par l&apos;État, elle entre officiellement en pleine activité opérationnelle en 2026 pour doter la jeunesse africaine d&apos;outils concrets d&apos;incubation, de certification et de financement.
          </p>
        </div>

        {/* Continuous White Thread Timeline */}
        <div className="mt-20">
          {/* Desktop: Horizontal Continuous White Thread */}
          <div className="hidden lg:block relative">
            {/* The Horizontal Continuous White Line */}
            <div className="absolute top-6 left-6 right-6 h-0.5 bg-gradient-to-r from-white/20 via-white/80 to-white/20 pointer-events-none shadow-[0_0_8px_rgba(255,255,255,0.25)]" />

            <div className="grid grid-cols-4 gap-8 relative z-10">
              {milestones.map((item, index) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.year}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.5, delay: index * 0.15 }}
                    className="flex flex-col text-left group"
                  >
                    {/* Node on the Thread */}
                    <div className="flex items-center gap-3 mb-6">
                      <div
                        className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all duration-300 z-10 shrink-0 ${
                          item.isCurrent
                            ? "border-white bg-[#D4AF37] text-[#060d1d] shadow-lg shadow-[#D4AF37]/40 ring-4 ring-white/30"
                            : "border-white/50 bg-[#060d1d] text-white group-hover:border-white group-hover:scale-110 shadow-md shadow-black/60"
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      {item.isCurrent && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/15 px-2.5 py-1 rounded-full border border-emerald-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          En cours
                        </span>
                      )}
                    </div>

                    {/* Year Headline */}
                    <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] via-[#F3DE8A] to-[#D4AF37]">
                      {item.year}
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-bold text-white mt-1 leading-snug group-hover:text-[#F3DE8A] transition-colors">
                      {item.title}
                    </h3>

                    {/* Description */}
                    <p className="text-sm text-slate-300 leading-relaxed mt-2.5 font-normal">
                      {item.description}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Mobile / Tablet: Vertical Continuous White Thread */}
          <div className="lg:hidden relative pl-8 sm:pl-10 space-y-10 before:absolute before:top-2 before:bottom-2 before:left-[15px] sm:before:left-[19px] before:w-[2px] before:bg-gradient-to-b before:from-white/80 via-white/50 to-white/20">
            {milestones.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.year}
                  initial={{ opacity: 0, x: -15 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-30px" }}
                  transition={{ duration: 0.5, delay: index * 0.12 }}
                  className="relative text-left"
                >
                  {/* Node on vertical line */}
                  <div
                    className={`absolute -left-[31px] sm:-left-[39px] top-0 w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      item.isCurrent
                        ? "border-white bg-[#D4AF37] text-[#060d1d] ring-4 ring-white/30 shadow-md shadow-[#D4AF37]/30"
                        : "border-white/50 bg-[#060d1d] text-white"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] to-[#F3DE8A]">
                      {item.year}
                    </span>
                    {item.isCurrent && (
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        En cours
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-white mt-1 leading-snug">
                    {item.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mt-1.5 font-normal">
                    {item.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Dedicated UCAD Heritage Showcase Card */}
        <div className="mt-16 p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-[#091733] via-[#08142c] to-[#060d1d] border-2 border-[#D4AF37]/30 shadow-2xl shadow-black/80">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left: Real Photo of UCAD Library */}
            <div className="lg:col-span-6 relative">
              <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden border-2 border-[#D4AF37]/50 shadow-xl">
                <Image
                  src="/ucad-library.jpg"
                  alt="Bibliothèque Universitaire Centrale de l'UCAD (Dakar) - Berceau de l'EEA en 2008"
                  fill
                  className="object-cover hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#060d1d]/80 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 text-xs text-slate-200 bg-[#060d1d]/90 backdrop-blur-sm px-3 py-2 rounded-lg border border-white/10 flex items-center justify-between">
                  <span className="font-semibold text-white">
                    Bibliothèque Centrale • UCAD Dakar
                  </span>
                  <span className="text-[#D4AF37] text-[11px] font-bold">
                    Genèse 2008 • Démarrage 2026
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Narrative of Origin & Architectural Symbolism */}
            <div className="lg:col-span-6 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0B3C8A]/40 border border-[#D4AF37]/30 text-xs font-semibold text-[#D4AF37]">
                <Building2 className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Le Lieu Fondateur du Mouvement</span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-snug">
                Projet né à l&apos;UCAD en 2008 • Démarrage officiel en 2026
              </h3>

              <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
                C&apos;est au cœur de la prestigieuse{" "}
                <strong className="text-white">Université Cheikh Anta Diop (UCAD)</strong>, devant sa Bibliothèque Universitaire Centrale, que des étudiants visionnaires ont proclamé la naissance de l&apos;EEA en 2008. En 2026, l&apos;organisation déploie toute sa puissance opérationnelle sur le terrain et en ligne.
              </p>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal bg-white/[0.03] p-4 rounded-xl border border-white/10">
                <strong className="text-[#D4AF37] block mb-1">
                  Une analogie architecturale vivante :
                </strong>
                La toiture de la bibliothèque de l&apos;UCAD, conçue en forme de livre ouvert vers l&apos;avenir, est le reflet physique direct du livre du savoir présent au cœur de notre blason officiel. C&apos;est ici que s&apos;est forgée notre conviction : le diplôme doit féconder la terre et armer l&apos;innovation technologique africaine.
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-slate-300">
                <span className="flex items-center gap-1.5 font-medium text-white">
                  <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />
                  Genèse UCAD (2008)
                </span>
                <span className="text-slate-500">•</span>
                <span className="flex items-center gap-1.5 font-medium text-white">
                  <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />
                  Démarrage Officiel (2026)
                </span>
                <span className="text-slate-500">•</span>
                <span className="flex items-center gap-1.5 font-medium text-white">
                  <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />
                  Agréé par l&apos;État
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Institutional Quote Banner */}
        <div className="mt-12 rounded-2xl bg-gradient-to-r from-[#091733] via-[#0F224A] to-[#091733] border border-[#D4AF37]/30 p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <h4 className="text-lg sm:text-xl font-bold text-white">
              « L&apos;avenir de l&apos;Afrique appartient à ceux qui entreprennent dès l&apos;université. »
            </h4>
            <p className="text-sm text-slate-300 max-w-2xl">
              Les diplômes sont indispensables, mais la capacité à transformer les connaissances en exploitations agricoles modernes et en entreprises technologiques est le véritable moteur du continent.
            </p>
          </div>
          <a
            href="#piliers"
            className="shrink-0 px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-white/10 hover:bg-white/15 border border-white/20 transition-colors"
          >
            Découvrir nos piliers d&apos;action
          </a>
        </div>
      </div>
    </section>
  );
}
