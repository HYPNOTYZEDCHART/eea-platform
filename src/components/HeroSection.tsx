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

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 w-full my-auto flex flex-col items-center text-center">
        {/* Main Content: Mission, Typography & Actions */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full flex flex-col items-center space-y-6"
        >
          {/* Status / Authority Pill */}
          <motion.div variants={itemVariants} className="flex justify-center">
            <div className="inline-flex flex-wrap items-center justify-center gap-1.5 px-4 py-1.5 rounded-full bg-[#0F224A]/90 border border-[#D4AF37]/40 shadow-sm text-[11px] sm:text-xs font-semibold text-white max-w-full">
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
            className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.2] sm:leading-[1.15] max-w-4xl"
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
            className="max-w-3xl space-y-3 p-5 sm:p-6 rounded-2xl bg-[#091733]/80 border border-[#D4AF37]/30 shadow-lg text-center"
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
            className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 w-full max-w-2xl"
          >
            <div className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/10 text-[11px] sm:text-xs font-medium text-slate-200">
              <Cpu className="w-3.5 h-3.5 text-[#38BDF8] shrink-0" />
              <span>Tech & IA</span>
            </div>
            <div className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/10 text-[11px] sm:text-xs font-medium text-slate-200">
              <Sprout className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Agro-business</span>
            </div>
            <div className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/10 text-[11px] sm:text-xs font-medium text-slate-200">
              <GraduationCap className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
              <span>Excellence</span>
            </div>
            <div className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/10 text-[11px] sm:text-xs font-medium text-slate-200">
              <Globe2 className="w-3.5 h-3.5 text-[#60A5FA] shrink-0" />
              <span>Diaspora</span>
            </div>
          </motion.div>

          {/* CTAs */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 w-full"
          >
            <a
              href="#adhesion"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-[#060d1d] bg-gradient-to-r from-[#D4AF37] via-[#F3DE8A] to-[#D4AF37] hover:brightness-105 shadow-xl shadow-[#D4AF37]/20 transition-all duration-300 text-sm sm:text-base group cursor-pointer text-center"
            >
              <span>Rejoindre le Mouvement • 5 000 FCFA</span>
              <ArrowRight className="w-4 h-4 text-[#060d1d]" />
            </a>

            <a
              href="#mouvement"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-medium text-slate-200 bg-white/[0.05] hover:bg-white/[0.1] border border-white/15 transition-all duration-200 text-sm sm:text-base"
            >
              <span>Découvrir notre Histoire</span>
            </a>
          </motion.div>

          {/* Optional Adhesion Clarification */}
          <motion.p variants={itemVariants} className="text-xs text-slate-400 flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>
              Accès libre aux informations • Adhésion officielle avec carte numérique sécurisée à 5 000 FCFA.
            </span>
          </motion.p>
        </motion.div>

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
