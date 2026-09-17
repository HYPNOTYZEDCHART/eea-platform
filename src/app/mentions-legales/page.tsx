import type { Metadata } from "next";
import Link from "next/link";
import {
  Building2,
  ShieldCheck,
  Server,
  Mail,
  Phone,
  MapPin,
  FileText,
  ArrowLeft,
  ChevronRight,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Mentions Légales & Récépissé Officiel | EEA",
  description:
    "Mentions légales statutaires, identification de l'éditeur et de l'hébergeur de la plateforme de l'association Étudiant Entrepreneuriat Afrique (UCAD Dakar).",
};

export default function MentionsLegalesPage() {
  return (
    <div className="min-h-screen py-28 sm:py-36 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-slate-400 mb-8">
        <Link href="/" className="hover:text-[#D4AF37] transition-colors">
          Accueil
        </Link>
        <ChevronRight className="w-3 h-3 text-slate-600" />
        <span className="text-slate-300 font-medium">Mentions Légales</span>
      </nav>

      {/* Header Banner */}
      <div className="border-b border-white/10 pb-8 mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0F224A] border border-[#D4AF37]/30 text-xs font-semibold text-[#D4AF37] uppercase tracking-wider mb-4">
          <Building2 className="w-3.5 h-3.5" />
          <span>Informations Légales & Réglementaires</span>
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
          Mentions Légales Statutaires
        </h1>

        <p className="mt-4 text-base sm:text-lg text-slate-300 max-w-3xl leading-relaxed">
          Informations réglementaires relatives à l&apos;éditeur de la plateforme, à la reconnaissance étatique de l&apos;association et aux prestataires techniques d&apos;hébergement.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/[0.04] border border-white/10">
            <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Récépissé N° 11450/M.INT.CL/DAGAT/DEL/AS</span>
          </div>
          <span className="hidden sm:inline text-slate-600">•</span>
          <span>Dakar, République du Sénégal</span>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-10 text-slate-300 text-sm sm:text-base leading-relaxed">
        {/* Éditeur de la Plateforme */}
        <section className="p-6 rounded-2xl bg-[#091733] border border-[#D4AF37]/30 shadow-xl space-y-4">
          <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#D4AF37]" />
            <span>1. Éditeur de la Plateforme</span>
          </h2>
          <p>
            Le site internet accessible à l&apos;adresse officielle de l&apos;EEA est édité par l&apos;association :
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm font-mono pt-1">
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
              <div className="text-white font-bold text-base">
                Étudiant Entrepreneuriat Afrique (EEA)
              </div>
              <p className="text-slate-300">
                Association estudiantine panafricaine fondée en 2008 à l&apos;UCAD, entrée en activité opérationnelle officielle en 2026.
              </p>
              <p className="text-[#F3DE8A]">
                Notre credo : « Devenir en entreprenant »
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-2 text-xs">
              <div className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                <span>
                  <strong>Reconnaissance Officielle :</strong><br />
                  Récépissé N° 11450/M.INT.CL/DAGAT/DEL/AS délivré par le Ministère de l&apos;Intérieur.
                </span>
              </div>
              <div className="flex items-start gap-2 pt-1 border-t border-white/5">
                <MapPin className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                <span>
                  <strong>Siège Social :</strong><br />
                  UCAD, Campus universitaire, ENSEPT, Pavillon E — Dakar (Sénégal)
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Direction de la Publication & Contact */}
        <section className="space-y-4">
          <h3 className="text-xl font-bold text-white border-l-4 border-[#D4AF37] pl-3">
            2. Direction de la Publication & Contacts
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs sm:text-sm">
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-1">
              <FileText className="w-4 h-4 text-[#D4AF37]" />
              <strong className="text-white block">Direction de la Publication</strong>
              <p className="text-slate-300">Secrétariat Général & Bureau Exécutif de l&apos;EEA</p>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-1">
              <Mail className="w-4 h-4 text-[#38BDF8]" />
              <strong className="text-white block">Courriel Officiel</strong>
              <a href="mailto:eeaucad@yahoo.fr" className="text-slate-200 underline hover:text-[#D4AF37]">
                eeaucad@yahoo.fr
              </a>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-1">
              <Phone className="w-4 h-4 text-[#25D366]" />
              <strong className="text-white block">Permanence Téléphonique</strong>
              <p className="text-slate-200">+221 78 542 53 45</p>
            </div>
          </div>
        </section>

        {/* Hébergement Technique */}
        <section className="space-y-4">
          <h3 className="text-xl font-bold text-white border-l-4 border-[#D4AF37] pl-3">
            3. Hébergement Technique & Infrastructure
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
              <div className="flex items-center gap-2 font-bold text-white">
                <Server className="w-4 h-4 text-[#38BDF8]" />
                <span>Hébergeur Web & Déploiement</span>
              </div>
              <p className="text-slate-300">
                <strong>Vercel Inc.</strong><br />
                440 N Barranca Ave #4133, Covina, CA 91723 (États-Unis)<br />
                Site web : <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-[#38BDF8] underline">https://vercel.com</a>
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
              <div className="flex items-center gap-2 font-bold text-white">
                <Server className="w-4 h-4 text-emerald-400" />
                <span>Gestion de Base de Données Sécurisée</span>
              </div>
              <p className="text-slate-300">
                <strong>Supabase Inc.</strong><br />
                970 Toa Payoh North #07-04, Singapour<br />
                Site web : <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-emerald-400 underline">https://supabase.com</a>
              </p>
            </div>
          </div>
        </section>

        {/* Propriété Intellectuelle */}
        <section className="space-y-3">
          <h3 className="text-xl font-bold text-white border-l-4 border-[#D4AF37] pl-3">
            4. Propriété Intellectuelle & Droits Réservés
          </h3>
          <p>
            L&apos;ensemble des contenus présents sur cette plateforme (textes, logos, typographies, code source, graphismes, maquette officielle de la carte de membre) constitue la propriété exclusive de l&apos;association Étudiant Entrepreneuriat Afrique (EEA) ou fait l&apos;objet d&apos;une licence légitime.
          </p>
          <p>
            Toute reproduction, distribution ou modification totale ou partielle sans accord écrit préalable de l&apos;association est rigoureusement prohibée.
          </p>
        </section>
      </div>

      {/* Action Footnotes */}
      <div className="mt-16 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour à l&apos;accueil</span>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/conditions-generales"
            className="text-xs text-[#D4AF37] hover:underline"
          >
            Conditions Générales →
          </Link>
          <Link
            href="/confidentialite"
            className="text-xs text-[#38BDF8] hover:underline"
          >
            Politique de Confidentialité →
          </Link>
        </div>
      </div>
    </div>
  );
}
