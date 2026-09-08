"use client";

import { motion } from "framer-motion";
import {
  Monitor,
  Wheat,
  GraduationCap,
  Globe,
  ArrowUpRight,
  Sparkles,
  Layers,
} from "lucide-react";

export default function PillarsSection() {
  const pillars = [
    {
      id: "tech",
      number: "01",
      icon: Monitor,
      title: "Haute Technologie & Digitalisation",
      tag: "Souveraineté Numérique",
      tagColor: "bg-sky-500/10 text-sky-300 border-sky-500/30",
      description:
        "Accompagner les étudiants codeurs, ingénieurs et créateurs de solutions logicielles adaptées aux réalités africaines : fintech inclusive, IA appliquée, plateformes logistiques et santé connectée.",
      keyProjects: [
        "Incubateurs de startups universitaires",
        "Formations intensives au code & à l'IA",
        "Hackathons régionaux inter-universités",
      ],
    },
    {
      id: "agro",
      number: "02",
      icon: Wheat,
      title: "Agro-business & Souveraineté Alimentaire",
      tag: "Terre & Prospérité",
      tagColor: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
      description:
        "Transformer l'agriculture traditionnelle en un secteur moderne, rentable et valorisant. Permettre aux étudiants agronomes, gestionnaires et ingénieurs de créer des fermes pilotes durables et des unités de transformation.",
      keyProjects: [
        "Fermes d'expérimentation étudiantes",
        "Transformation locale des récoltes",
        "Mécanisation et irrigation solaire",
      ],
    },
    {
      id: "education",
      number: "03",
      icon: GraduationCap,
      title: "Formation d'Excellence & Mentorat",
      tag: "Savoir & Leadership",
      tagColor: "bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/30",
      description:
        "Faire le lien entre la théorie dispensée dans les facultés et l'exigence du monde des affaires. Nos membres bénéficient d'un parrainage direct par des dirigeants d'entreprises et d'experts aguerris.",
      keyProjects: [
        "Masterclasses avec des chefs d'entreprises",
        "Accompagnement juridique et financier",
        "Certifications professionnelles EEA",
      ],
    },
    {
      id: "diaspora",
      number: "04",
      icon: Globe,
      title: "Synergie Panafricaine & Diaspora",
      tag: "Union & Réseau Global",
      tagColor: "bg-indigo-500/10 text-indigo-300 border-indigo-500/30",
      description:
        "Mobiliser l'expertise, les financements et le carnet d'adresses de la diaspora pour catalyser les projets des étudiants sur le continent. Un pont structuré, officiel et transparent.",
      keyProjects: [
        "Clubs EEA dans les capitales internationales",
        "Fonds d'amorçage mixte Diaspora-Continent",
        "Conférences annuelles panafricaines",
      ],
    },
  ];

  const statutoryGoals = [
    {
      number: "01",
      title: "Soutien aux Initiatives",
      description: "Soutenir les initiatives entrepreneuriales de ses membres.",
    },
    {
      number: "02",
      title: "Programmes Multidimensionnels",
      description: "Initier des programmes couvrant les divers volets et domaines de l'entrepreneuriat.",
    },
    {
      number: "03",
      title: "Canal Financier Dédié",
      description: "Promouvoir la mise en place et le management d'un canal financier adapté au financement des projets.",
    },
    {
      number: "04",
      title: "Liens de Partenariat",
      description: "Tisser des liens de partenariat avec les institutions étatiques, bailleurs et entreprises.",
    },
    {
      number: "05",
      title: "Plateforme de Coopération",
      description: "Asseoir une plate-forme d'échange, de coopération et de concertation entre étudiants.",
    },
    {
      number: "06",
      title: "Réseau de Personnes-Ressources",
      description: "Constituer un réseau influent d'experts, de chefs d'entreprises et de mentors dévoués.",
    },
    {
      number: "07",
      title: "Unité Africaine & NEPAD",
      description: "S'impliquer résolument dans les grands chantiers de l'Unité Africaine et du Nepad.",
    },
  ];

  return (
    <section id="piliers" className="relative py-24 sm:py-32 bg-[#08142c] overflow-hidden border-t border-white/5">
      {/* Background Ambience (No Neon) */}
      <div className="absolute top-1/3 right-0 w-[500px] h-[500px] bg-[#0B3C8A]/15 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-14 border-b border-white/10">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0F224A] border border-[#D4AF37]/30 text-xs font-semibold text-[#D4AF37] uppercase tracking-wider mb-4">
              <Layers className="w-3.5 h-3.5" />
              <span>Champs d&apos;Action Stratégiques</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
              Les Quatre Piliers du Mouvement EEA
            </h2>

            <p className="mt-4 text-base sm:text-lg text-slate-300 font-normal">
              Chaque pilier incarne la mission fondamentale de l&apos;EEA : unir l&apos;excellence universitaire à la terre nourricière et aux technologies de pointe.
            </p>
          </div>

          <div className="shrink-0">
            <a
              href="#carte"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#D4AF37] hover:text-[#F3DE8A] transition-colors group"
            >
              <span>Voir les avantages réservés aux membres</span>
              <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
          </div>
        </div>

        {/* Horizontal Editorial Panorama (Option A - No Cards) */}
        <div className="mt-8 divide-y divide-white/10 border-b border-white/10">
          {pillars.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <motion.div
                key={pillar.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="py-10 sm:py-12 transition-colors group"
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-start">
                  {/* Left Column: Number & Icon */}
                  <div className="lg:col-span-2 flex items-center lg:flex-col lg:items-start gap-4">
                    <span className="text-4xl sm:text-5xl font-black text-white font-serif tracking-tight">
                      {pillar.number}
                    </span>
                    <div className="w-11 h-11 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-[#D4AF37] group-hover:border-[#D4AF37]/50 group-hover:bg-[#D4AF37]/10 transition-colors shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Center Column: Domain Badge & Main Title */}
                  <div className="lg:col-span-4 space-y-2.5">
                    <span
                      className={`inline-flex text-[11px] font-semibold tracking-wider uppercase px-2.5 py-0.5 rounded-full border ${pillar.tagColor}`}
                    >
                      {pillar.tag}
                    </span>
                    <h3 className="text-xl sm:text-2xl font-extrabold text-white group-hover:text-[#F3DE8A] transition-colors leading-snug">
                      {pillar.title}
                    </h3>
                  </div>

                  {/* Right Column: Description & 2026 Action Axes */}
                  <div className="lg:col-span-6 space-y-4">
                    <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
                      {pillar.description}
                    </p>

                    <div>
                      <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 block mb-2.5">
                        Axes d&apos;action prioritaires 2026 :
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {pillar.keyProjects.map((project) => (
                          <span
                            key={project}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/[0.03] border border-white/10 text-xs text-slate-200 font-medium hover:border-[#D4AF37]/30 transition-colors"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
                            {project}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Official Statutory Goals Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.6 }}
          className="mt-16 rounded-2xl bg-gradient-to-br from-[#0B234F]/90 via-[#091733] to-[#08142c] border-2 border-[#D4AF37]/40 p-8 sm:p-10 shadow-2xl relative overflow-hidden"
        >
          {/* Subtle Background Watermark */}
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none text-9xl font-black text-[#D4AF37]">
            EEA
          </div>

          <div className="relative z-10">
            {/* Header of Statutory Goals */}
            <div className="max-w-3xl mb-10">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-xs font-bold text-[#D4AF37] uppercase tracking-wider mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Statuts Officiels • Objet & Buts Généraux</span>
              </div>

              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
                Les Buts Généraux de l&apos;Association
              </h3>

              <p className="text-sm sm:text-base text-slate-300 mt-2 font-normal">
                Déposés et reconnus par l&apos;autorité étatique, ces sept buts directeurs constituent le contrat moral et l&apos;engagement d&apos;action de l&apos;EEA auprès de la communauté universitaire et de l&apos;Afrique.
              </p>
            </div>

            {/* Grid of the 7 Statutory Goals */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {statutoryGoals.map((goal) => (
                <div
                  key={goal.number}
                  className="p-5 rounded-xl bg-white/[0.03] border border-white/10 hover:border-[#D4AF37]/40 transition-all duration-200 flex flex-col justify-between group hover:bg-white/[0.05]"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-black text-[#D4AF37] tracking-wider px-2 py-0.5 rounded bg-[#D4AF37]/15 border border-[#D4AF37]/30">
                        {goal.number}
                      </span>
                      <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]/60 group-hover:bg-[#D4AF37] transition-colors" />
                    </div>

                    <h4 className="text-sm sm:text-base font-bold text-white mb-2 group-hover:text-[#F3DE8A] transition-colors">
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
        </motion.div>
      </div>
    </section>
  );
}
