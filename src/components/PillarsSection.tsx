"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  Monitor,
  Wheat,
  GraduationCap,
  Globe,
  ArrowUpRight,
  Sparkles,
  Layers,
  Terminal,
  Sprout,
  Users2,
  Award,
  CheckCircle2,
  Compass,
} from "lucide-react";

interface SpotlightCardProps {
  children: React.ReactNode;
  className?: string;
}

function SpotlightCard({ children, className = "" }: SpotlightCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#091733]/90 via-[#071328]/95 to-[#040813] transition-all duration-300 hover:border-[#D4AF37]/50 shadow-2xl shadow-black/50 ${className}`}
    >
      {/* Dynamic Golden Spotlight Ray that tracks cursor */}
      {isHovered && (
        <div
          className="pointer-events-none absolute -inset-px transition-opacity duration-300 z-0"
          style={{
            background: `radial-gradient(450px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(212, 175, 55, 0.16), transparent 70%)`,
          }}
        />
      )}
      <div className="relative z-10 h-full">{children}</div>
    </div>
  );
}

export default function PillarsSection() {
  const statutoryGoals = [
    {
      number: "01",
      title: "Soutien aux Initiatives",
      description: "Soutenir et encadrer les initiatives entrepreneuriales des étudiants membres.",
    },
    {
      number: "02",
      title: "Programmes Multidimensionnels",
      description: "Initier des programmes couvrant les divers volets stratégiques de l'entrepreneuriat.",
    },
    {
      number: "03",
      title: "Canal Financier Dédié",
      description: "Mettre en place un canal financier adapté au financement effectif des projets.",
    },
    {
      number: "04",
      title: "Liens de Partenariat",
      description: "Tisser des partenariats étroits avec les institutions étatiques, bailleurs et entreprises.",
    },
    {
      number: "05",
      title: "Plateforme de Coopération",
      description: "Asseoir une plate-forme d'échange et de concertation continue entre universités.",
    },
    {
      number: "06",
      title: "Réseau de Personnes-Ressources",
      description: "Constituer un réseau influent d'experts, de dirigeants d'entreprises et de mentors dévoués.",
    },
    {
      number: "07",
      title: "Unité Africaine & NEPAD",
      description: "S'impliquer résolument dans les grands chantiers de l'Unité Africaine et du Nepad.",
    },
  ];

  return (
    <section id="piliers" className="relative py-24 sm:py-32 bg-[#060d1d] overflow-hidden border-t border-white/5">
      {/* Ambient Lighting */}
      <div className="absolute top-1/4 right-0 w-[600px] h-[600px] bg-[#0B3C8A]/15 rounded-full blur-[170px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-14 border-b border-white/10">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0F224A]/90 border border-[#D4AF37]/40 text-xs font-semibold text-[#D4AF37] uppercase tracking-wider mb-4 shadow-sm">
              <Layers className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span className="font-cinzel">Champs d&apos;Action Stratégiques</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
              Les Quatre Piliers du Mouvement EEA
            </h2>

            <p className="mt-4 text-base sm:text-lg text-slate-300 font-normal">
              Chaque pilier donne corps aux emblèmes gravés sur notre blason officiel : unir l&apos;esprit académique à la terre nourricière et à la puissance technologique.
            </p>
          </div>

          <div className="shrink-0">
            <a
              href="#carte"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#D4AF37] hover:text-[#FFF3B0] transition-colors group"
            >
              <span>Privilèges réservés aux membres</span>
              <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
          </div>
        </div>

        {/* CUTTING-EDGE ASYMMETRIC BENTO GRID WITH SPOTLIGHT CURSOR */}
        <div className="mt-14 grid grid-cols-1 lg:grid-cols-12 gap-7">
          
          {/* BENTO CARD 1: FLAGSHIP HAUTE TECHNOLOGIE (7 COLS) */}
          <SpotlightCard className="lg:col-span-7 p-8 sm:p-10 flex flex-col justify-between group">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-2xl bg-[#0B3C8A]/50 border border-sky-400/40 flex items-center justify-center text-sky-400 shadow-lg group-hover:scale-110 transition-transform">
                  <Monitor className="w-7 h-7" />
                </div>
                <span className="px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-sky-950/60 text-sky-300 border border-sky-500/40">
                  Souveraineté Numérique
                </span>
              </div>

              <div>
                <span className="font-cinzel text-xs text-[#D4AF37] uppercase font-bold tracking-widest block mb-1">
                  Pilier I • Code, IA & Systèmes
                </span>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Haute Technologie & Digitalisation
                </h3>
              </div>

              <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
                Accompagner les étudiants codeurs, ingénieurs et chercheurs dans la création de technologies souveraines adaptées aux besoins du continent : fintech inclusive, IA locale, santé connectée et chaînes logistiques décentralisées.
              </p>

              {/* Simulated Code Console Pill Box */}
              <div className="p-4 rounded-xl bg-black/40 border border-white/10 font-mono text-xs text-slate-300 space-y-1.5">
                <div className="flex items-center gap-1.5 pb-2 border-b border-white/10 text-[11px] text-slate-400">
                  <Terminal className="w-3.5 h-3.5 text-[#38BDF8]" />
                  <span>eea-incubator-cli --stack=ai-agrotech --region=panafrican</span>
                </div>
                <p className="text-emerald-400 font-semibold">
                  ✓ 45+ Hackathons régionaux organisés
                </p>
                <p className="text-sky-300">
                  ✓ Bourses d&apos;accélération technologique pour startups étudiantes
                </p>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
              <span className="text-[#38BDF8] font-semibold flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                Incubateurs universitaires connectés
              </span>
              <span className="text-slate-400">Inspiré de l&apos;ordinateur du blason</span>
            </div>
          </SpotlightCard>

          {/* BENTO CARD 2: FLAGSHIP AGRO-BUSINESS & TERRE (5 COLS) */}
          <SpotlightCard className="lg:col-span-5 p-8 sm:p-10 flex flex-col justify-between group">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-2xl bg-emerald-950/50 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shadow-lg group-hover:scale-110 transition-transform">
                  <Wheat className="w-7 h-7" />
                </div>
                <span className="px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-950/60 text-emerald-300 border border-emerald-500/40">
                  Terre & Prospérité
                </span>
              </div>

              <div>
                <span className="font-cinzel text-xs text-[#D4AF37] uppercase font-bold tracking-widest block mb-1">
                  Pilier II • Souveraineté Alimentaire
                </span>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Agro-business Moderne
                </h3>
              </div>

              <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
                Convertir l&apos;agriculture en filière d&apos;excellence hautement lucrative. Doter les jeunes agronomes et gestionnaires de fermes d&apos;expérimentation, de pompage solaire et de chaînes de transformation agroalimentaire locale.
              </p>

              <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-xs text-slate-200 space-y-2">
                <div className="flex items-center gap-2 font-bold text-emerald-300">
                  <Sprout className="w-4 h-4" />
                  <span>Fermes Pilotes Étudiantes</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Irrigation automatisée, valorisation des récoltes et création d&apos;exploitations rentables dès la fin des études.
                </p>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
              <span className="text-emerald-400 font-semibold">Fermes d&apos;expérimentation</span>
              <span>Inspiré des sillons du blason</span>
            </div>
          </SpotlightCard>

          {/* BENTO CARD 3: FORMATION D'EXCELLENCE & MENTORAT (6 COLS) */}
          <SpotlightCard className="lg:col-span-6 p-8 sm:p-10 flex flex-col justify-between group">
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-[#0F224A] border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] shadow-lg group-hover:scale-110 transition-transform">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#0F224A] text-[#D4AF37] border border-[#D4AF37]/30">
                  Savoir & Leadership
                </span>
              </div>

              <div>
                <span className="font-cinzel text-xs text-[#D4AF37] uppercase font-bold tracking-widest block mb-1">
                  Pilier III • Académie & Compétences
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  Formation d&apos;Excellence & Mentorat
                </h3>
              </div>

              <p className="text-sm text-slate-300 leading-relaxed font-normal">
                Faire le pont entre la théorie des amphithéâtres et les réalités du marché. Chaque membre accède à des parrainages directs assurés par des patrons d&apos;industries et des experts comptables agréés.
              </p>

              <div className="space-y-2 pt-2">
                {[
                  "Masterclasses avec des capitaines d'industrie",
                  "Appui juridique & structuration d'entreprise",
                  "Certifications professionnelles EEA officielles",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-xs text-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-[#D4AF37] shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-white/10 text-xs text-[#D4AF37] font-medium font-cinzel">
              Inspiré du mortier académique & du livre du savoir
            </div>
          </SpotlightCard>

          {/* BENTO CARD 4: SYNERGIE PANAFRICAINE & DIASPORA (6 COLS) */}
          <SpotlightCard className="lg:col-span-6 p-8 sm:p-10 flex flex-col justify-between group">
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-indigo-950/60 border border-indigo-400/40 flex items-center justify-center text-indigo-400 shadow-lg group-hover:scale-110 transition-transform">
                  <Globe className="w-6 h-6" />
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-950/60 text-indigo-300 border border-indigo-500/40">
                  Union & Réseau Global
                </span>
              </div>

              <div>
                <span className="font-cinzel text-xs text-[#D4AF37] uppercase font-bold tracking-widest block mb-1">
                  Pilier IV • Continent & Diaspora
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  Synergie Panafricaine & Diaspora
                </h3>
              </div>

              <p className="text-sm text-slate-300 leading-relaxed font-normal">
                Mobiliser les compétences, financements et réseaux des étudiants africains établis en Europe, aux Amériques et en Asie pour catalyser directement les projets sur le sol africain.
              </p>

              <div className="space-y-2 pt-2">
                {[
                  "Délégations EEA dans 18+ capitales régionales",
                  "Fonds d'amorçage mixte Diaspora-Continent",
                  "Forums annuels et mobilités estudiantines",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-xs text-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-white/10 text-xs text-indigo-300 font-medium font-cinzel">
              Inspiré de la carte d&apos;Afrique et de la couronne de laurier
            </div>
          </SpotlightCard>
        </div>

        {/* FULL-WIDTH GRAND CHARTER BANNER: THE 7 STATUTORY GOALS */}
        <div className="mt-16 rounded-3xl bg-gradient-to-br from-[#0B234F]/95 via-[#091733] to-[#040813] border-2 border-[#D4AF37]/50 p-8 sm:p-12 shadow-2xl relative overflow-hidden">
          
          {/* Watermark Logo */}
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none font-cinzel text-9xl font-black text-[#D4AF37]">
            EEA
          </div>

          <div className="relative z-10">
            <div className="max-w-3xl mb-10">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-xs font-bold text-[#D4AF37] uppercase tracking-wider mb-3">
                <Award className="w-3.5 h-3.5" />
                <span className="font-cinzel">Statuts Officiels Déposés • Charte des 7 Buts</span>
              </div>

              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
                Les Sept Buts Généraux de l&apos;Association
              </h3>

              <p className="text-sm sm:text-base text-slate-300 mt-2 font-normal">
                Reconnus par l&apos;autorité étatique, ces sept buts directeurs constituent la boussole éthique et le cadre d&apos;action indéfectible de l&apos;EEA auprès de la communauté universitaire africaine.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {statutoryGoals.map((goal) => (
                <div
                  key={goal.number}
                  className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-[#D4AF37]/50 transition-all duration-300 flex flex-col justify-between group hover:bg-white/[0.06] shadow-md"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-cinzel text-xs font-black text-[#D4AF37] px-2.5 py-1 rounded bg-[#D4AF37]/15 border border-[#D4AF37]/30">
                        {goal.number}
                      </span>
                      <span className="w-2 h-2 rounded-full bg-[#D4AF37]/40 group-hover:bg-[#D4AF37] transition-colors" />
                    </div>

                    <h4 className="text-sm sm:text-base font-bold text-white mb-2 group-hover:text-[#FFF3B0] transition-colors">
                      {goal.title}
                    </h4>

                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
                      {goal.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
