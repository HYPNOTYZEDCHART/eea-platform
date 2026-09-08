"use client";

import { motion } from "framer-motion";
import {
  TrendingUp,
  School,
  Landmark,
  Briefcase,
  CheckCircle,
  Handshake,
} from "lucide-react";

export default function ImpactAndPartnersSection() {
  const stats = [
    {
      value: "10 000+",
      label: "Étudiants & Alumni",
      subtext: "Mobilisés et formés à travers le continent",
      icon: TrendingUp,
    },
    {
      value: "45+",
      label: "Universités Partenaires",
      subtext: "Facultés, écoles d'ingénieurs et d'agronomie",
      icon: School,
    },
    {
      value: "18",
      label: "Pays Africains & Diaspora",
      subtext: "Antennes actives et délégations régionales",
      icon: Landmark,
    },
    {
      value: "120+",
      label: "Startups & Fermes Pilotes",
      subtext: "Initiatives financées ou accompagnées",
      icon: Briefcase,
    },
  ];

  const partners = [
    { name: "Ministère de l'Enseignement Supérieur", category: "Tutelle & Agrément" },
    { name: "Ministère de l'Agriculture & du Développement Rural", category: "Partenaire Stratégique" },
    { name: "Banque Ouest Africaine de Développement (BOAD)", category: "Appui Institutionnel" },
    { name: "Fonds Panafricain pour l'Innovation Étudiante", category: "Financement" },
    { name: "Chambre de Commerce & d'Industrie", category: "Insertion & Marchés" },
    { name: "Agence Universitaire de la Francophonie (AUF)", category: "Coopération Académique" },
    { name: "Réseau des Business Angels d'Afrique", category: "Investissement Privé" },
    { name: "Alliance Panafricaine pour l'Agrobusiness", category: "Filières Agricoles" },
  ];

  return (
    <section id="impact" className="relative py-24 sm:py-32 bg-[#060d1d] overflow-hidden border-t border-white/5">
      {/* Background Soft Glow - No Neon */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[350px] bg-[#0B3C8A]/10 rounded-full blur-[160px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0F224A] border border-[#D4AF37]/30 text-xs font-semibold text-[#D4AF37] uppercase tracking-wider mb-4">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Impact Concret & Résultats Mesurables</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Des chiffres qui témoignent de notre rigueur
          </h2>

          <p className="mt-4 text-base sm:text-lg text-slate-300">
            Depuis 2008, l&apos;EEA construit une communauté solide, reconnue par les pouvoirs publics et capable de porter des projets d&apos;envergure.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="relative rounded-2xl bg-[#091733]/70 border border-white/10 p-7 flex flex-col justify-between hover:border-[#D4AF37]/40 transition-all duration-300 hover:-translate-y-1 shadow-lg shadow-black/30"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-[#0B3C8A]/30 border border-[#D4AF37]/20 flex items-center justify-center text-[#D4AF37] mb-5">
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-2">
                    {stat.value}
                  </div>

                  <div className="text-base font-bold text-[#D4AF37] mb-1">
                    {stat.label}
                  </div>

                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-normal">
                    {stat.subtext}
                  </p>
                </div>

                <div className="mt-6 pt-3 border-t border-white/5 flex items-center gap-1.5 text-[11px] text-slate-400">
                  <CheckCircle className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Données vérifiées par le secrétariat général</span>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Partners & Institutional Sponsors Strip */}
        <div id="partenaires" className="mt-28 pt-16 border-t border-white/10">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-10">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#D4AF37] mb-2">
                <Handshake className="w-4 h-4" />
                <span>Écosystème & Soutiens</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                Sponsors, Ministères & Partenaires Stratégiques
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md">
              Des institutions publiques et des acteurs financiers de premier plan qui croient au potentiel des étudiants africains.
            </p>
          </div>

          {/* Marquee Container */}
          <div className="relative overflow-hidden py-4 [mask-image:linear-gradient(to_right,transparent,white_20%,white_80%,transparent)]">
            <div className="flex gap-6 animate-marquee w-max">
              {[...partners, ...partners].map((p, index) => (
                <div
                  key={`${p.name}-${index}`}
                  className="flex flex-col justify-center px-6 py-4 rounded-xl bg-[#091733]/90 border border-white/10 hover:border-[#D4AF37]/40 transition-colors shrink-0 max-w-xs shadow-md shadow-black/20"
                >
                  <span className="text-[10px] uppercase font-bold text-[#D4AF37] tracking-wider mb-1">
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
