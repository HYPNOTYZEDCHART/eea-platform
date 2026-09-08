"use client";

import Image from "next/image";
import { motion, type Variants } from "framer-motion";
import {
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Sprout,
  Cpu,
  GraduationCap,
  Globe2,
  Building2,
  CheckCircle2,
  Award,
} from "lucide-react";

export default function HeroSection() {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.1,
      },
    },
  };

  const textRevealVariants: Variants = {
    hidden: { opacity: 0, y: 35 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.85,
        ease: "easeOut",
      },
    },
  };

  return (
    <section className="relative min-h-[95vh] flex flex-col justify-center pt-28 pb-16 overflow-hidden bg-gradient-to-b from-[#040813] via-[#08142c] to-[#060d1d]">
      {/* Real Historic UCAD Library Background with Atmospheric Vignette */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <Image
          src="/ucad-library.jpg"
          alt="Bibliothèque Universitaire Centrale UCAD en arrière-plan"
          fill
          priority
          className="object-cover object-center opacity-35 scale-105 filter saturate-75 contrast-115"
        />
        {/* Multilayer Directional Vignettes to maximize contrast and dramatic depth */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#040813] via-[#040813]/85 to-[#040813]/40" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#040813]/90 via-transparent to-[#060d1d]" />
      </div>

      {/* Subtle Classical Architectural Diamond Grid Overlay */}
      <div className="absolute inset-0 opacity-[0.035] pointer-events-none bg-[radial-gradient(#D4AF37_1px,transparent_1px)] [background-size:32px_32px]" />

      {/* Ambient Lighting Accents (Royal Navy & Academic Gold Glows) */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[400px] bg-[#0B3C8A]/25 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-12 right-12 w-[450px] h-[350px] bg-[#D4AF37]/8 rounded-full blur-[130px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full my-auto z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Prestigious Institutional Typography & Action */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="lg:col-span-7 flex flex-col text-left space-y-6"
          >
            {/* Republic & Sovereignty Credential Pill */}
            <motion.div variants={textRevealVariants} className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0F224A]/90 border border-[#D4AF37]/50 shadow-lg shadow-[#D4AF37]/10 backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" />
                <span className="font-cinzel tracking-wider text-[11px] sm:text-xs font-bold text-[#D4AF37] uppercase">
                  Organisation Agréée par l&apos;État
                </span>
                <span className="text-white/40 hidden sm:inline">•</span>
                <span className="text-slate-300 font-medium text-[11px] sm:text-xs hidden sm:inline">
                  Initié en 2008 à l&apos;UCAD
                </span>
              </div>
            </motion.div>

            {/* Main Grand Headline with Editorial Contrast */}
            <div className="overflow-hidden">
              <motion.h1
                variants={textRevealVariants}
                className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.12]"
              >
                Bâtir l&apos;Avenir de l&apos;Afrique par{" "}
                <span className="font-cinzel block sm:inline text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] via-[#FFF3B0] to-[#D4AF37] drop-shadow-[0_2px_15px_rgba(212,175,55,0.3)]">
                  l&apos;Entrepreneuriat
                </span>
                , la Haute Tech et la Terre.
              </motion.h1>
            </div>

            {/* Diplomatic Manifeste Card with Gold Quill Border */}
            <motion.div
              variants={textRevealVariants}
              className="relative p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-[#091733]/90 via-[#071328]/95 to-[#050b18] border-l-4 border-[#D4AF37] border-y border-r border-white/10 shadow-2xl backdrop-blur-md space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="font-cinzel text-xs font-bold uppercase tracking-widest text-[#D4AF37] flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5" />
                  Manifeste Statutaire Panafricain
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Art. 2 — Objet</span>
              </div>

              <p className="text-xs sm:text-base text-slate-200 leading-relaxed font-normal">
                « <strong className="text-white font-semibold">EEA</strong> veut promouvoir et impliquer le talent entrepreneurial de ses membres et les orienter vers le grand défi de redressement de l&apos;Afrique et permettre auxdits talents et créativités de s&apos;affirmer, de s&apos;épanouir, de se revaloriser dans un{" "}
                <span className="text-[#D4AF37] font-semibold underline decoration-[#D4AF37]/40 underline-offset-4">
                  partenariat fécond
                </span>
                . »
              </p>
            </motion.div>

            {/* 4 Interactive Tactical Pillars */}
            <motion.div
              variants={textRevealVariants}
              className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1"
            >
              {[
                { label: "Tech & IA", icon: Cpu, color: "text-[#38BDF8]", border: "hover:border-[#38BDF8]/50" },
                { label: "Agro-business", icon: Sprout, color: "text-emerald-400", border: "hover:border-emerald-500/50" },
                { label: "Excellence", icon: GraduationCap, color: "text-[#D4AF37]", border: "hover:border-[#D4AF37]/50" },
                { label: "Diaspora", icon: Globe2, color: "text-indigo-300", border: "hover:border-indigo-500/50" },
              ].map((p) => {
                const Icon = p.icon;
                return (
                  <div
                    key={p.label}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-xs font-semibold text-slate-200 transition-all duration-300 hover:-translate-y-0.5 shadow-sm ${p.border} cursor-default`}
                  >
                    <Icon className={`w-4 h-4 ${p.color} shrink-0`} />
                    <span className="truncate">{p.label}</span>
                  </div>
                );
              })}
            </motion.div>

            {/* High-Octane Action CTAs */}
            <motion.div
              variants={textRevealVariants}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-3"
            >
              {/* Primary Golden Shimmer Button */}
              <a
                href="#adhesion"
                className="relative inline-flex items-center justify-center gap-2.5 px-6 py-4 rounded-xl font-extrabold text-[#060d1d] bg-gradient-to-r from-[#D4AF37] via-[#FFF3B0] to-[#D4AF37] animate-sheen hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-[#D4AF37]/30 transition-all duration-300 text-sm sm:text-base group cursor-pointer text-center overflow-hidden"
              >
                <span>Rejoindre le Mouvement • 5 000 FCFA</span>
                <ArrowRight className="w-4 h-4 text-[#060d1d] transition-transform duration-300 group-hover:translate-x-1" />
              </a>

              {/* Secondary Prestigious Button */}
              <a
                href="#mouvement"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-slate-200 bg-white/[0.05] hover:bg-white/[0.1] border border-white/15 hover:border-[#D4AF37]/40 transition-all duration-200 text-sm sm:text-base cursor-pointer"
              >
                <Building2 className="w-4 h-4 text-[#D4AF37]" />
                <span>Découvrir la Genèse (2008)</span>
              </a>
            </motion.div>

            {/* Reassurance Subtext */}
            <motion.div variants={textRevealVariants} className="flex items-center gap-2 text-xs text-slate-400 pt-1">
              <ShieldCheck className="w-4 h-4 text-[#D4AF37] shrink-0" />
              <span>
                Plateforme ouverte à tous les étudiants d&apos;Afrique et de la diaspora • Carte officielle sécurisée par QR Code.
              </span>
            </motion.div>
          </motion.div>

          {/* Right Column: Prestigious Emblem with Celestial Orbital Rings & Floating Badges */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="lg:col-span-5 flex justify-center lg:justify-end relative"
          >
            {/* The Emblem Sanctuary */}
            <div className="relative w-72 h-72 sm:w-96 sm:h-96 flex items-center justify-center">
              
              {/* Outer Celestial Orbit Ring 1 (Clockwise) */}
              <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#D4AF37]/40 animate-orbit-slow pointer-events-none" />

              {/* Middle Compass Ring 2 (Counter-Clockwise) */}
              <div className="absolute inset-4 rounded-full border border-white/15 border-t-[#D4AF37] border-b-[#38BDF8] animate-orbit-reverse pointer-events-none" />

              {/* Radial Golden Aura Glow */}
              <div className="absolute inset-8 rounded-full bg-gradient-to-br from-[#0F224A] via-[#0B3C8A]/40 to-transparent blur-xl pointer-events-none" />

              {/* Central Official Seal Emblem */}
              <div className="relative z-10 w-44 h-44 sm:w-60 sm:h-60 rounded-full overflow-hidden border-4 border-[#D4AF37] shadow-[0_0_50px_rgba(212,175,55,0.4)] transition-transform duration-500 hover:scale-105">
                <Image
                  src="/logo-eea.jpg"
                  alt="Sceau officiel de l'Étudiant Entrepreneuriat Afrique"
                  fill
                  priority
                  className="object-cover"
                />
              </div>

              {/* FLOATING BADGE 1: Berceau UCAD 2008 (Top Left) */}
              <motion.div
                animate={{ y: [0, -8, 0], rotate: [0, 1, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0 }}
                className="absolute -top-2 -left-4 sm:top-2 sm:-left-6 z-20 px-3 py-1.5 rounded-xl bg-[#091733]/95 border border-[#D4AF37]/60 shadow-xl shadow-black/60 backdrop-blur-md flex items-center gap-2"
              >
                <div className="w-6 h-6 rounded-lg bg-[#0B3C8A]/50 flex items-center justify-center text-xs">
                  🏛️
                </div>
                <div>
                  <span className="font-cinzel text-[10px] font-bold text-white block">UCAD DAKAR</span>
                  <span className="text-[9px] text-[#D4AF37] font-semibold">Berceau 2008</span>
                </div>
              </motion.div>

              {/* FLOATING BADGE 2: Démarrage Officiel 2026 (Top Right) */}
              <motion.div
                animate={{ y: [0, -8, 0], rotate: [0, 1, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
                className="absolute -top-3 -right-3 sm:top-4 sm:-right-6 z-20 px-3 py-1.5 rounded-xl bg-[#091733]/95 border border-[#38BDF8]/60 shadow-xl shadow-black/60 backdrop-blur-md flex items-center gap-2"
              >
                <div className="w-6 h-6 rounded-lg bg-sky-950/60 flex items-center justify-center text-xs">
                  ⚡
                </div>
                <div>
                  <span className="font-cinzel text-[10px] font-bold text-white block">DÉMARRAGE</span>
                  <span className="text-[9px] text-[#38BDF8] font-semibold">Officiel 2026</span>
                </div>
              </motion.div>

              {/* FLOATING BADGE 3: 18+ Pays Panafricains (Bottom Center) */}
              <motion.div
                animate={{ y: [0, -8, 0], rotate: [0, 1, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
                className="absolute -bottom-4 left-1/2 -translate-x-1/2 z-20 px-4 py-2 rounded-xl bg-[#091733]/95 border border-emerald-500/60 shadow-xl shadow-black/60 backdrop-blur-md flex items-center gap-2.5 whitespace-nowrap"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <div>
                  <span className="font-cinzel text-xs font-bold text-white block">18+ PAYS AFRICAINS</span>
                  <span className="text-[9.5px] text-emerald-400 font-medium">Continent & Diaspora connectés</span>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Bottom Editorial Heritage Numbers Strip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-16 sm:mt-20 pt-8 border-t border-white/10 grid grid-cols-2 md:grid-cols-4 gap-6 text-center"
        >
          <div className="space-y-1">
            <div className="font-cinzel text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              2008
            </div>
            <div className="text-xs sm:text-sm text-slate-300 font-medium">
              Genèse à l&apos;UCAD Dakar
            </div>
          </div>

          <div className="space-y-1">
            <div className="font-cinzel text-2xl sm:text-4xl font-extrabold text-[#D4AF37] tracking-tight">
              2026
            </div>
            <div className="text-xs sm:text-sm text-slate-300 font-medium">
              Démarrage opérationnel officiel
            </div>
          </div>

          <div className="space-y-1">
            <div className="font-cinzel text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              18+ PAYS
            </div>
            <div className="text-xs sm:text-sm text-slate-300 font-medium">
              Continent & Diaspora active
            </div>
          </div>

          <div className="space-y-1">
            <div className="font-cinzel text-2xl sm:text-4xl font-extrabold text-[#D4AF37] tracking-tight">
              10 000+
            </div>
            <div className="text-xs sm:text-sm text-slate-300 font-medium">
              Étudiants et porteurs de projets
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
