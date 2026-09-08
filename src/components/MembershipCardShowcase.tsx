"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import {
  CreditCard,
  ShieldCheck,
  QrCode,
  Sparkles,
  Check,
  Download,
  Share2,
  Lock,
  ArrowRight,
} from "lucide-react";

export default function MembershipCardShowcase() {
  const cardRef = useRef<HTMLDivElement>(null);

  // Framer Motion 3D tilt coordinates
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["12deg", "-12deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-12deg", "12deg"]);
  const glareX = useTransform(mouseXSpring, [-0.5, 0.5], ["0%", "100%"]);
  const glareY = useTransform(mouseYSpring, [-0.5, 0.5], ["0%", "100%"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const perks = [
    {
      title: "Carte Officielle Numérique Infalsifiable",
      desc: "QR code de vérification instantané certifié par l'association.",
    },
    {
      title: "Accès aux Bourses & Financements",
      desc: "Éligibilité prioritaire aux fonds d'amorçage tech et agro de l'EEA.",
    },
    {
      title: "Incubateurs Universitaires & Fermes Pilotes",
      desc: "Terrains d'expérimentation et labos pour lancer vos prototypes.",
    },
    {
      title: "Mentorat de Haut Niveau",
      desc: "Mise en relation avec des chefs d'entreprises et la diaspora.",
    },
    {
      title: "Stages & Opportunités Exclusives",
      desc: "Offres réservées auprès des partenaires du réseau.",
    },
    {
      title: "Délégations & Sommets Panafricains",
      desc: "Représentez votre université lors des grands forums régionaux.",
    },
  ];

  return (
    <section id="carte" className="relative py-24 sm:py-32 bg-[#08142c]/25 backdrop-blur-[1px] overflow-hidden border-t border-white/5">
      {/* Background Soft Lighting - Dignified, No Neon */}
      <div className="absolute top-1/4 left-1/4 w-[600px] h-[400px] bg-[#0B3C8A]/20 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[450px] h-[350px] bg-[#D4AF37]/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Section Header */}
        <div className="max-w-3xl mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0F224A] border border-[#D4AF37]/30 text-xs font-semibold text-[#D4AF37] uppercase tracking-wider mb-4">
            <CreditCard className="w-3.5 h-3.5" />
            <span>Badge d&apos;Appartenance Officiel</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Votre Carte de Membre Numérique Sécurisée
          </h2>

          <p className="mt-4 text-base sm:text-lg text-slate-300 font-normal">
            Le site et les informations sont en libre accès pour tous. L&apos;adhésion à <strong className="text-white">5 000 FCFA</strong> est un investissement unique qui vous confère le statut de membre officiel et déverrouille l&apos;ensemble de l&apos;écosystème.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-center">
          {/* Left Column: 3D Interactive Card Showcase */}
          <div className="lg:col-span-6 flex flex-col items-center">
            <div className="w-full flex items-center justify-between px-2 mb-3 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                Survolez la carte pour apprécier le relief 3D
              </span>
              <span className="hidden sm:inline text-[#D4AF37] font-medium">
                Puce & QR Code d&apos;Authenticité
              </span>
            </div>

            {/* 3D Tilt Wrapper */}
            <div
              style={{ perspective: "1000px" }}
              className="w-full max-w-lg cursor-pointer"
            >
              <motion.div
                ref={cardRef}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                style={{
                  rotateX,
                  rotateY,
                  transformStyle: "preserve-3d",
                }}
                className="relative aspect-[1.586/1] w-full rounded-2xl p-5 sm:p-6 bg-gradient-to-br from-[#0F224A] via-[#091733] to-[#060e1d] border-2 border-[#D4AF37]/60 shadow-2xl shadow-black/80 flex flex-col justify-between overflow-hidden select-none"
              >
                {/* Subtle Dynamic Glare */}
                <motion.div
                  style={{
                    background:
                      "radial-gradient(circle at center, rgba(212, 175, 55, 0.15) 0%, transparent 60%)",
                    left: glareX,
                    top: glareY,
                  }}
                  className="absolute -inset-24 pointer-events-none -translate-x-1/2 -translate-y-1/2"
                />

                {/* Card Watermark */}
                <div className="absolute right-4 bottom-4 opacity-5 pointer-events-none w-48 h-48">
                  <Image
                    src="/logo-eea.jpg"
                    alt="Watermark"
                    fill
                    className="object-contain"
                  />
                </div>

                {/* Card Header */}
                <div className="relative z-10 flex items-start justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="relative w-10 h-10 rounded-full overflow-hidden border border-[#D4AF37] shadow-sm">
                      <Image
                        src="/logo-eea.jpg"
                        alt="Logo EEA"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-extrabold text-white tracking-wide">
                        ÉTUDIANT ENTREPRENEURIAT AFRIQUE
                      </div>
                      <div className="text-[10px] text-[#D4AF37] font-semibold tracking-wider uppercase">
                        Carte Officielle de Membre • Né en 2008 • Démarrage officiel 2026
                      </div>
                    </div>
                  </div>

                  <div className="px-2 py-0.5 rounded bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[9px] font-bold text-[#D4AF37] uppercase tracking-wider">
                    Actif 2026-2027
                  </div>
                </div>

                {/* Card Body: Member Details & QR */}
                <div className="relative z-10 grid grid-cols-12 gap-3 items-center my-auto py-2">
                  {/* Member Photo */}
                  <div className="col-span-4 sm:col-span-3 flex justify-center">
                    <div className="relative w-16 h-20 sm:w-20 sm:h-24 rounded-lg overflow-hidden border-2 border-[#D4AF37] bg-slate-800 shadow-md">
                      {/* Placeholder Model Avatar */}
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-t from-[#0B3C8A] to-[#1E3A8A] text-white">
                        <div className="w-8 h-8 rounded-full bg-white/20 mb-1 flex items-center justify-center font-bold text-xs">
                          JD
                        </div>
                        <span className="text-[9px] text-slate-200">Photo 4x4</span>
                      </div>
                    </div>
                  </div>

                  {/* Member Information */}
                  <div className="col-span-8 sm:col-span-6 space-y-1 pl-1">
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold block">
                        Nom & Prénom
                      </span>
                      <div className="text-xs sm:text-sm font-bold text-white truncate">
                        KOUASSI Jean-David
                      </div>
                    </div>

                    <div>
                      <span className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold block">
                        Université & Pays
                      </span>
                      <div className="text-[11px] sm:text-xs text-slate-200 font-medium truncate">
                        Univ. Félix Houphouët-Boigny • CI
                      </div>
                    </div>

                    <div>
                      <span className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold block">
                        Filière & Spécialité
                      </span>
                      <div className="text-[11px] sm:text-xs text-slate-200 font-medium truncate">
                        Génie Logiciel & Agrobusiness
                      </div>
                    </div>
                  </div>

                  {/* QR Code & Security Stamp */}
                  <div className="hidden sm:flex col-span-3 flex-col items-center justify-center border-l border-white/10 pl-2">
                    <div className="p-1.5 bg-white rounded-lg shadow-md mb-1">
                      <QrCode className="w-12 h-12 text-[#060d1d]" />
                    </div>
                    <span className="text-[8px] text-slate-400 tracking-tighter text-center">
                      Scan de Vérification
                    </span>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="relative z-10 flex items-center justify-between border-t border-white/10 pt-2 text-[10px] text-slate-300">
                  <div className="flex items-center gap-1 font-mono text-[#D4AF37]">
                    <Lock className="w-3 h-3 text-[#D4AF37]" />
                    <span>ID : EEA-2026-CI-0492</span>
                  </div>

                  <div className="flex items-center gap-1 text-slate-400 text-[9px]">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    <span>Authenticité garantie par l&apos;État</span>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Quick Actions Preview */}
            <div className="flex items-center justify-center gap-4 mt-5 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <Download className="w-3.5 h-3.5 text-[#D4AF37]" />
                Export immédiat PDF & PNG
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Share2 className="w-3.5 h-3.5 text-[#D4AF37]" />
                Ajout Wallet & Partage LinkedIn
              </span>
            </div>
          </div>

          {/* Right Column: Membership Perks & 5,000 FCFA Pitch */}
          <div className="lg:col-span-6 space-y-8">
            <div className="p-6 rounded-2xl bg-[#091733] border border-[#D4AF37]/30 shadow-lg">
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div>
                  <span className="text-xs uppercase tracking-wider font-bold text-[#D4AF37]">
                    Cotisation Annuelle
                  </span>
                  <div className="text-3xl sm:text-4xl font-black text-white mt-1">
                    5 000 FCFA
                    <span className="text-xs sm:text-sm font-normal text-slate-400 ml-2">
                      (~7,60 € / an)
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-block px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                    Sans renouvellement forcé
                  </span>
                </div>
              </div>

              {/* Perks Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                {perks.map((perk) => (
                  <div key={perk.title} className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] shrink-0 mt-0.5">
                      <Check className="w-3 h-3" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-white">
                        {perk.title}
                      </h4>
                      <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
                        {perk.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Button */}
              <div className="mt-8 pt-6 border-t border-white/10">
                <a
                  href="#adhesion"
                  className="w-full inline-flex items-center justify-center gap-2.5 py-4 px-6 rounded-xl font-bold text-[#060d1d] bg-gradient-to-r from-[#D4AF37] via-[#F3DE8A] to-[#D4AF37] hover:brightness-105 transition-all duration-300 shadow-xl shadow-[#D4AF37]/20 text-base"
                >
                  <span>Rejoindre et obtenir ma carte (5 000 FCFA)</span>
                  <ArrowRight className="w-5 h-5 text-[#060d1d]" />
                </a>
                <p className="text-center text-[11px] text-slate-400 mt-2">
                  Paiement sécurisé instantané par Wave, Orange Money ou Carte Bancaire.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
