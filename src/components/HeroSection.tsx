"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Sprout,
  Cpu,
  GraduationCap,
  Globe2,
} from "lucide-react";

export default function HeroSection() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as any },
    },
  };

  return (
    <section className="relative min-h-[92vh] flex flex-col justify-center pt-28 pb-16 overflow-hidden bg-gradient-to-b from-[#060d1d] via-[#091733] to-[#060d1d]">
      {/* Real Historic UCAD Library Background - Enhanced Visibility */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <Image
          src="/ucad-library.jpg"
          alt="Bibliothèque Universitaire Centrale UCAD en arrière-plan"
          fill
          priority
          className="object-cover object-center opacity-40 scale-105 filter saturate-75 contrast-110"
        />
        {/* Subtle Vignette & Directional Gradients to keep text crisp while displaying the monument */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#060d1d] via-[#060d1d]/75 to-[#060d1d]/40" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#060d1d]/80 via-transparent to-[#060d1d]" />
      </div>

      {/* Background Subtle Geometric Pattern - No Neon */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px]" />

      {/* Very Soft Deep Blue Lighting Accents (Non-Neon) */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-[#0B3C8A]/25 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[300px] bg-[#D4AF37]/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full my-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Mission, Typography & Actions */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="lg:col-span-7 flex flex-col text-left space-y-6"
          >
            {/* Status / Authority Pill */}
            <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-2">
              <div className="inline-flex flex-wrap items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0F224A] border border-[#D4AF37]/40 shadow-sm text-[11px] sm:text-xs font-semibold text-white max-w-full">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                  <span>Reconnu par l&apos;État</span>
                </div>
                <span className="text-[#D4AF37] hidden sm:inline">•</span>
                <span className="text-slate-300 font-normal text-[10px] sm:text-xs">Initié en 2008 à l&apos;UCAD • Démarrage 2026</span>
              </div>
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              variants={itemVariants}
              className="text-2xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.2] sm:leading-[1.15]"
            >
              Bâtir l&apos;Avenir de l&apos;Afrique par{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] via-[#F3DE8A] to-[#D4AF37]">
                l&apos;Entrepreneuriat
              </span>
              , la Tech et la Terre.
            </motion.h1>

            {/* Mission Subtitle / Manifeste Officiel */}
            <motion.div
              variants={itemVariants}
              className="space-y-3 p-4 sm:p-5 rounded-2xl bg-[#091733]/80 border border-[#D4AF37]/30 shadow-lg"
            >
              <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#D4AF37]">
                Manifeste Statutaire & Engagement Continental
              </p>
              <p className="text-xs sm:text-base text-slate-300 leading-relaxed">
                <strong className="text-white font-semibold">EEA</strong> veut
                promouvoir et impliquer le talent entrepreneurial de ses membres et
                les orienter vers le grand défi de redressement de l&apos;Afrique et
                permettre auxdits talents et créativités de s&apos;affirmer, de
                s&apos;épanouir, de se revaloriser dans un{" "}
                <span className="text-[#D4AF37] font-semibold">
                  Partenariat fécond
                </span>
                .
              </p>
            </motion.div>

            {/* 4 Core Pillars Pills */}
            <motion.div
              variants={itemVariants}
              className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1"
            >
              <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-white/[0.04] border border-white/10 text-[11px] sm:text-xs font-medium text-slate-200">
                <Cpu className="w-3.5 h-3.5 text-[#38BDF8] shrink-0" />
                <span>Tech & IA</span>
              </div>
              <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-white/[0.04] border border-white/10 text-[11px] sm:text-xs font-medium text-slate-200">
                <Sprout className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Agro-business</span>
              </div>
              <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-white/[0.04] border border-white/10 text-[11px] sm:text-xs font-medium text-slate-200">
                <GraduationCap className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                <span>Excellence</span>
              </div>
              <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-white/[0.04] border border-white/10 text-[11px] sm:text-xs font-medium text-slate-200">
                <Globe2 className="w-3.5 h-3.5 text-[#60A5FA] shrink-0" />
                <span>Diaspora</span>
              </div>
            </motion.div>

            {/* CTAs */}
            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2"
            >
              <a
                href="#adhesion"
                className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl font-bold text-[#060d1d] bg-gradient-to-r from-[#D4AF37] via-[#F3DE8A] to-[#D4AF37] hover:brightness-105 shadow-xl shadow-[#D4AF37]/20 transition-all duration-300 text-sm sm:text-base group cursor-pointer text-center"
              >
                <span>Rejoindre le Mouvement • 5 000 FCFA</span>
                <ArrowRight className="w-4 h-4 text-[#060d1d]" />
              </a>

              <a
                href="#mouvement"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-medium text-slate-200 bg-white/[0.05] hover:bg-white/[0.1] border border-white/15 transition-all duration-200 text-sm sm:text-base"
              >
                <span>Découvrir notre Histoire</span>
              </a>
            </motion.div>

            {/* Optional Adhesion Clarification */}
            <motion.p variants={itemVariants} className="text-xs text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>
                Accès libre aux informations • Adhésion officielle avec carte numérique sécurisée à 5 000 FCFA.
              </span>
            </motion.p>
          </motion.div>

          {/* Right Column: Prestigious Emblem & Card Showcase */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="lg:col-span-5 flex justify-center lg:justify-end"
          >
            <div className="relative w-full max-w-md">
              {/* Subtle Backglow Card Frame */}
              <div className="relative rounded-2xl bg-gradient-to-b from-[#0F224A]/90 to-[#08142c]/95 border border-[#D4AF37]/30 p-6 sm:p-8 shadow-2xl shadow-black/60 backdrop-blur-xl">
                {/* Header of the Showcase Card */}
                <div className="flex items-center justify-between pb-4 border-b border-white/10">
                  <div className="flex flex-col">
                    <span className="text-[11px] uppercase tracking-widest text-[#D4AF37] font-semibold">
                      Sceau Officiel EEA
                    </span>
                    <span className="text-xs text-slate-300">
                      Organisation Panafricaine
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30">
                    Initié 2008 • Démarré 2026
                  </span>
                </div>

                {/* Central Emblem Display */}
                <div className="my-6 flex flex-col items-center justify-center">
                  <div className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-full overflow-hidden border-4 border-[#D4AF37] shadow-xl shadow-black/50">
                    <Image
                      src="/logo-eea.jpg"
                      alt="Sceau officiel de l'Étudiant Entrepreneuriat Afrique"
                      fill
                      className="object-cover"
                      priority
                    />
                  </div>
                </div>

                {/* Key Sub-indicators under Emblem */}
                <div className="space-y-2.5 pt-2 border-t border-white/10 text-xs">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#D4AF37]" />
                      Reconnaissance officielle
                    </span>
                    <span className="text-white font-medium">Agréé par l&apos;État</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#2563EB]" />
                      Synergie Panafricaine
                    </span>
                    <span className="text-white font-medium">Afrique & Diaspora</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      Double Vocation
                    </span>
                    <span className="text-white font-medium">Haute Tech & Agro-industrie</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Bottom Key Numbers Strip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-16 sm:mt-20 pt-8 border-t border-white/10 grid grid-cols-2 md:grid-cols-4 gap-6 text-center"
        >
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white">
              2008
            </div>
            <div className="text-xs sm:text-sm text-slate-400 mt-1">
              Genèse à l&apos;UCAD Dakar
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#D4AF37]">
              2026
            </div>
            <div className="text-xs sm:text-sm text-slate-400 mt-1">
              Démarrage opérationnel
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white">
              18+ Pays
            </div>
            <div className="text-xs sm:text-sm text-slate-400 mt-1">
              Continent & Diaspora
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#D4AF37]">
              10 000+
            </div>
            <div className="text-xs sm:text-sm text-slate-400 mt-1">
              Étudiants et porteurs de projets
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
