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
  Eye,
  Award,
} from "lucide-react";

export default function MembershipCardShowcase() {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isFoilActive, setIsFoilActive] = useState(false);

  // Framer Motion 3D tilt coordinates
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 280, damping: 25 });
  const mouseYSpring = useSpring(y, { stiffness: 280, damping: 25 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["14deg", "-14deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-14deg", "14deg"]);
  const glareX = useTransform(mouseXSpring, [-0.5, 0.5], ["-30%", "130%"]);
  const glareY = useTransform(mouseYSpring, [-0.5, 0.5], ["-30%", "130%"]);

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
    setIsFoilActive(true);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
    setIsFoilActive(false);
  };

  const perks = [
    {
      title: "Badge Numérique Officiel Infalsifiable",
      desc: "QR code de vérification instantané certifié par le registre central.",
    },
    {
      title: "Accès Prioritaire aux Fonds & Concours",
      desc: "Éligibilité directe aux subventions et capitaux d'amorçage tech & agro.",
    },
    {
      title: "Fermes Pilotes & Labos Universitaires",
      desc: "Terrains d'expérimentation et serveurs pour déployer vos prototypes.",
    },
    {
      title: "Mentorat de Dirigeants & Patrons",
      desc: "Mise en relation directe avec les chefs d'entreprises et la diaspora.",
    },
    {
      title: "Stages & Recrutements Exclusifs",
      desc: "Opportunités réservées auprès des 45+ institutions partenaires.",
    },
    {
      title: "Délégations & Sommets Panafricains",
      desc: "Représentez officiellement votre faculté lors des forums continentaux.",
    },
  ];

  return (
    <section id="carte" className="relative py-24 sm:py-32 bg-[#040813] overflow-hidden border-t border-white/5">
      {/* Dynamic Background Atmospheric Lighting */}
      <div className="absolute top-1/3 left-1/4 w-[650px] h-[450px] bg-[#0B3C8A]/20 rounded-full blur-[170px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[500px] h-[400px] bg-[#D4AF37]/8 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0F224A]/90 border border-[#D4AF37]/40 text-xs font-semibold text-[#D4AF37] uppercase tracking-wider mb-4 shadow-sm">
            <CreditCard className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span className="font-cinzel">Badge d&apos;Appartenance Officiel</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Votre Carte de Membre Numérique Sécurisée
          </h2>

          <p className="mt-4 text-base sm:text-lg text-slate-300 font-normal">
            Le site et les informations sont en libre accès pour tous. L&apos;adhésion à <strong className="text-white">5 000 FCFA</strong> est un investissement unique qui vous confère le statut de membre officiel et déverrouille l&apos;ensemble de l&apos;écosystème continental.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-center">
          
          {/* Left Column: 3D Holographic Card Showcase */}
          <div className="lg:col-span-6 flex flex-col items-center">
            
            <div className="w-full flex items-center justify-between px-2 mb-3 text-xs text-slate-400">
              <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                Survolez pour activer le relief 3D et le reflet holographique
              </span>
              <span className="hidden sm:inline text-[#D4AF37] font-semibold font-cinzel text-[11px]">
                Norme ISO/IEC 7810 CR80
              </span>
            </div>

            {/* 3D Tilt Wrapper */}
            <div
              style={{ perspective: "1200px" }}
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
                className="relative aspect-[1.586/1] w-full rounded-2xl p-5 sm:p-6 bg-gradient-to-br from-[#0F224A] via-[#091733] to-[#040813] border-2 border-[#D4AF37] shadow-[0_20px_60px_rgba(0,0,0,0.9)] flex flex-col justify-between overflow-hidden select-none transition-shadow duration-300"
              >
                {/* HOLOGRAPHIC FOIL SECURITY REFLECTION LAYER */}
                <motion.div
                  style={{
                    left: glareX,
                    top: glareY,
                    opacity: isFoilActive ? 0.75 : 0.25,
                  }}
                  className="hologram-shimmer absolute -inset-32 pointer-events-none rounded-full blur-xl -translate-x-1/2 -translate-y-1/2 transition-opacity duration-300"
                />

                {/* Subtle Card Background Watermark Logo */}
                <div className="absolute right-3 bottom-3 opacity-[0.06] pointer-events-none w-56 h-56">
                  <Image
                    src="/logo-eea.jpg"
                    alt="Watermark"
                    fill
                    className="object-contain"
                  />
                </div>

                {/* Card Header */}
                <div className="relative z-10 flex items-start justify-between border-b border-white/10 pb-2.5">
                  <div className="flex items-center gap-3">
                    <div className="relative w-11 h-11 rounded-full overflow-hidden border-2 border-[#D4AF37] shadow-md shadow-black/60 shrink-0">
                      <Image
                        src="/logo-eea.jpg"
                        alt="Logo EEA"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <div className="font-cinzel text-xs sm:text-sm font-extrabold text-white tracking-wide">
                        ÉTUDIANT ENTREPRENEURIAT AFRIQUE
                      </div>
                      <div className="text-[9.5px] text-[#D4AF37] font-semibold tracking-wider uppercase">
                        Carte Officielle • Né en 2008 • Démarrage officiel 2026
                      </div>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded bg-[#D4AF37]/20 border border-[#D4AF37]/50 text-[9px] font-extrabold text-[#D4AF37] uppercase tracking-wider font-cinzel shrink-0">
                    Membre Actif
                  </span>
                </div>

                {/* Card Body: Member Details, Passport Photo & Verification QR */}
                <div className="relative z-10 grid grid-cols-12 gap-3 items-center my-auto py-1">
                  
                  {/* Member Photo */}
                  <div className="col-span-4 sm:col-span-3 flex justify-center">
                    <div className="relative w-16 h-20 sm:w-20 sm:h-24 rounded-xl overflow-hidden border-2 border-[#D4AF37] bg-[#040813] shadow-lg shrink-0">
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-t from-[#0B3C8A] to-[#1E3A8A] text-white">
                        <div className="w-8 h-8 rounded-full bg-white/20 mb-1 flex items-center justify-center font-bold text-xs">
                          JD
                        </div>
                        <span className="text-[8.5px] text-slate-200 uppercase font-semibold">Photo 4x4</span>
                      </div>
                    </div>
                  </div>

                  {/* Member Information */}
                  <div className="col-span-8 sm:col-span-6 space-y-1 pl-1">
                    <div>
                      <span className="text-[8px] sm:text-[9px] text-slate-400 uppercase tracking-wider font-semibold block">
                        Nom & Prénom
                      </span>
                      <div className="text-xs sm:text-sm font-extrabold text-white truncate">
                        KOUASSI Jean-David
                      </div>
                    </div>

                    <div>
                      <span className="text-[8px] sm:text-[9px] text-slate-400 uppercase tracking-wider font-semibold block">
                        Matricule Officiel
                      </span>
                      <div className="text-xs font-mono font-bold text-[#D4AF37]">
                        EEA-2026-CI-0492
                      </div>
                    </div>

                    <div>
                      <span className="text-[8px] sm:text-[9px] text-slate-400 uppercase tracking-wider font-semibold block">
                        Université & Pays
                      </span>
                      <div className="text-[10px] sm:text-[11px] text-slate-200 font-medium truncate">
                        Univ. Félix Houphouët-Boigny • CI
                      </div>
                    </div>

                    <div>
                      <span className="text-[8px] sm:text-[9px] text-slate-400 uppercase tracking-wider font-semibold block">
                        Filière
                      </span>
                      <div className="text-[10px] sm:text-[11px] text-[#38BDF8] font-medium truncate">
                        Génie Logiciel & Agrobusiness
                      </div>
                    </div>
                  </div>

                  {/* QR Code & Security Stamp */}
                  <div className="hidden sm:flex col-span-3 flex-col items-center justify-center border-l border-white/10 pl-2">
                    <div className="p-1 bg-white rounded-lg shadow-md mb-1">
                      <QrCode className="w-12 h-12 text-[#060d1d]" />
                    </div>
                    <span className="text-[7.5px] text-[#D4AF37] uppercase font-bold tracking-tighter text-center">
                      Scan d&apos;Authenticité
                    </span>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="relative z-10 flex items-center justify-between border-t border-white/10 pt-2 text-[10px] text-slate-300">
                  <div className="flex items-center gap-1 font-mono text-[#D4AF37]">
                    <Lock className="w-3 h-3 text-[#D4AF37]" />
                    <span>ID-1 • CR80 ISO/IEC</span>
                  </div>

                  <div className="flex items-center gap-1 text-slate-400 text-[9px]">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    <span>Agréé par l&apos;État • 2026</span>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Quick Actions Preview */}
            <div className="flex items-center justify-center gap-4 mt-5 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <Download className="w-3.5 h-3.5 text-[#D4AF37]" />
                Format PDF & PNG HD
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Share2 className="w-3.5 h-3.5 text-[#D4AF37]" />
                Vérifiable en ligne 24/7
              </span>
            </div>
          </div>

          {/* Right Column: Membership Perks & 5,000 FCFA Pitch */}
          <div className="lg:col-span-6 space-y-8">
            <div className="p-7 sm:p-8 rounded-3xl bg-gradient-to-br from-[#091733] via-[#071328] to-[#040813] border-2 border-[#D4AF37]/40 shadow-2xl shadow-black/60">
              
              <div className="flex items-center justify-between pb-5 border-b border-white/10">
                <div>
                  <span className="font-cinzel text-xs uppercase tracking-wider font-bold text-[#D4AF37] block">
                    Cotisation Annuelle Unique
                  </span>
                  <div className="text-3xl sm:text-4xl font-black text-white mt-1">
                    5 000 FCFA
                    <span className="text-xs sm:text-sm font-normal text-slate-400 ml-2">
                      (≈ 7,60 € / an)
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-block px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                    Sans prélèvement forcé
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
                      <h4 className="text-xs sm:text-sm font-bold text-white leading-snug">
                        {perk.title}
                      </h4>
                      <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed font-normal">
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
                  className="w-full inline-flex items-center justify-center gap-2.5 py-4 px-6 rounded-xl font-bold text-[#060d1d] bg-gradient-to-r from-[#D4AF37] via-[#FFF3B0] to-[#D4AF37] animate-sheen hover:brightness-105 transition-all duration-300 shadow-xl shadow-[#D4AF37]/20 text-base cursor-pointer"
                >
                  <span>Rejoindre et obtenir ma carte (5 000 FCFA)</span>
                  <ArrowRight className="w-5 h-5 text-[#060d1d]" />
                </a>
                <p className="text-center text-[11px] text-slate-400 mt-2.5">
                  Règlement instantané par Wave, Orange Money ou Carte Bancaire.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
