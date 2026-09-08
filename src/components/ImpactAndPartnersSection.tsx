"use client";

import { useState, useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  TrendingUp,
  School,
  Landmark,
  Briefcase,
  CheckCircle,
  Handshake,
  Sparkles,
  Award,
} from "lucide-react";

function AnimatedCounter({
  target,
  suffix = "",
}: {
  target: number;
  suffix?: string;
}) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });

  useEffect(() => {
    if (!isInView) return;

    let start = 0;
    const duration = 2200;
    const interval = 25;
    const steps = duration / interval;
    const increment = target / steps;

    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, interval);

    return () => clearInterval(timer);
  }, [isInView, target]);

  return (
    <span ref={ref} className="tabular-nums">
      {count.toLocaleString("fr-FR")}
      {suffix}
    </span>
  );
}

export default function ImpactAndPartnersSection() {
  const stats = [
    {
      numeric: 10000,
      suffix: "+",
      label: "Étudiants & Porteurs de Projets",
      subtext: "Mobilisés et formés à travers les campus du continent",
      icon: TrendingUp,
      accent: "from-[#D4AF37] to-[#F3DE8A]",
    },
    {
      numeric: 45,
      suffix: "+",
      label: "Universités Partenaires",
      subtext: "Facultés de sciences, d'agronomie et écoles d'ingénieurs",
      icon: School,
      accent: "from-sky-400 to-blue-500",
    },
    {
      numeric: 18,
      suffix: " Pays",
      label: "Territoires & Diaspora",
      subtext: "Antennes actives dans 18+ capitales régionales et à l'international",
      icon: Landmark,
      accent: "from-emerald-400 to-teal-500",
    },
    {
      numeric: 120,
      suffix: "+",
      label: "Startups & Fermes Pilotes",
      subtext: "Projets innovants incubés, financés et suivis",
      icon: Briefcase,
      accent: "from-indigo-400 to-purple-500",
    },
  ];

  const partners = [
    { name: "Ministère de l'Enseignement Supérieur", category: "Tutelle & Agrément Étatique" },
    { name: "Ministère de l'Agriculture & du Développement Rural", category: "Partenaire Stratégique" },
    { name: "Banque Ouest Africaine de Développement (BOAD)", category: "Appui Institutionnel" },
    { name: "Fonds Panafricain pour l'Innovation Étudiante", category: "Financement d'Amorçage" },
    { name: "Chambre de Commerce & d'Industrie", category: "Insertion & Marchés" },
    { name: "Agence Universitaire de la Francophonie (AUF)", category: "Coopération Académique" },
    { name: "Réseau des Business Angels d'Afrique", category: "Investissement Privé" },
    { name: "Alliance Panafricaine pour l'Agrobusiness", category: "Filières Agricoles" },
  ];

  return (
    <section id="impact" className="relative py-24 sm:py-32 bg-[#040813] overflow-hidden border-t border-white/5">
      {/* Background Soft Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[400px] bg-[#0B3C8A]/10 rounded-full blur-[180px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0F224A]/90 border border-[#D4AF37]/40 text-xs font-semibold text-[#D4AF37] uppercase tracking-wider mb-4 shadow-sm">
            <TrendingUp className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span className="font-cinzel">Impact Réel & Métriques Certifiées</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Des chiffres qui attestent de notre rigueur
          </h2>

          <p className="mt-4 text-base sm:text-lg text-slate-300">
            Depuis 2008, l&apos;EEA bâtit une organisation solennelle, reconnue par les pouvoirs publics et capable de porter des projets d&apos;envergure continentale.
          </p>
        </div>

        {/* Stats Grid with Live Animated Counters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-7">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.6, delay: i * 0.12 }}
                className="relative rounded-3xl bg-gradient-to-b from-[#091733]/90 via-[#071328]/95 to-[#040813] border border-white/10 p-7 flex flex-col justify-between hover:border-[#D4AF37]/50 transition-all duration-300 hover:-translate-y-1.5 shadow-2xl shadow-black/50 group"
              >
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-[#0F224A] border border-white/10 flex items-center justify-center text-[#D4AF37] mb-6 group-hover:scale-110 transition-transform shadow-md">
                    <Icon className="w-6 h-6 text-[#D4AF37]" />
                  </div>

                  {/* Animated Counter Display */}
                  <div className="font-cinzel text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight mb-2">
                    <AnimatedCounter target={stat.numeric} suffix={stat.suffix} />
                  </div>

                  <div className="text-base font-bold text-[#D4AF37] mb-1.5 leading-snug">
                    {stat.label}
                  </div>

                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
                    {stat.subtext}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-white/10 flex items-center gap-2 text-[11px] text-slate-400">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Registre central vérifié</span>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Partners & Institutional Sponsors Strip */}
        <div id="partenaires" className="mt-28 pt-16 border-t border-white/10">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-10">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#D4AF37] mb-2 font-cinzel">
                <Handshake className="w-4 h-4 text-[#D4AF37]" />
                <span>Écosystème & Parrainages</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                Sponsors, Ministères & Partenaires Stratégiques
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md">
              Des institutions étatiques et des partenaires financiers d&apos;envergure qui soutiennent l&apos;autonomie économique des étudiants d&apos;Afrique.
            </p>
          </div>

          {/* Infinite Marquee Container */}
          <div className="relative overflow-hidden py-4 [mask-image:linear-gradient(to_right,transparent,white_15%,white_85%,transparent)]">
            <div className="flex gap-6 animate-marquee w-max">
              {[...partners, ...partners, ...partners].map((p, index) => (
                <div
                  key={`${p.name}-${index}`}
                  className="flex flex-col justify-center px-6 py-4 rounded-2xl bg-gradient-to-br from-[#091733]/95 to-[#071328] border border-white/10 hover:border-[#D4AF37]/50 transition-colors shrink-0 max-w-xs shadow-lg shadow-black/30"
                >
                  <span className="font-cinzel text-[10px] uppercase font-bold text-[#D4AF37] tracking-wider mb-1">
                    {p.category}
                  </span>
                  <span className="text-sm font-semibold text-slate-200">
                    {p.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
