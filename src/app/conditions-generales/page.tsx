import type { Metadata } from "next";
import Link from "next/link";
import {
  FileText,
  ShieldCheck,
  Scale,
  CreditCard,
  QrCode,
  UserCheck,
  AlertCircle,
  ArrowLeft,
  ChevronRight,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Conditions Générales d'Adhésion et d'Utilisation (CGU / CGA) | EEA",
  description:
    "Conditions statutaires régissant l'adhésion, la délivrance de la carte officielle infalsifiable à 3 000 FCFA et l'utilisation de la plateforme de l'association Étudiant Entrepreneuriat Afrique.",
};

export default function ConditionsGeneralesPage() {
  return (
    <div className="min-h-screen py-28 sm:py-36 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-slate-400 mb-8">
        <Link href="/" className="hover:text-[#D4AF37] transition-colors">
          Accueil
        </Link>
        <ChevronRight className="w-3 h-3 text-slate-600" />
        <span className="text-[#D4AF37] font-medium">Conditions Générales d&apos;Adhésion</span>
      </nav>

      {/* Header Banner */}
      <div className="border-b border-white/10 pb-8 mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0F224A] border border-[#D4AF37]/30 text-xs font-semibold text-[#D4AF37] uppercase tracking-wider mb-4">
          <Scale className="w-3.5 h-3.5" />
          <span>Cadre Juridique Statutaire</span>
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
          Conditions Générales d&apos;Adhésion & d&apos;Utilisation (CGU / CGA)
        </h1>

        <p className="mt-4 text-base sm:text-lg text-slate-300 max-w-3xl leading-relaxed">
          Régissant l&apos;accès à la plateforme officielle, les droits et devoirs des membres adhérents, ainsi que les règles de délivrance et d&apos;usage de la Carte Officielle Numérique Infalsifiable de l&apos;association.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/[0.04] border border-white/10">
            <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Récépissé N° 11450/M.INT.CL/DAGAT/DEL/AS</span>
          </div>
          <span className="hidden sm:inline text-slate-600">•</span>
          <span>Dernière mise à jour : Campagne Opérationnelle 2026</span>
          <span className="hidden sm:inline text-slate-600">•</span>
          <span>Siège : UCAD Dakar, ENSEPT, Pavillon E</span>
        </div>
      </div>

      {/* Main Content Body */}
      <div className="space-y-12 text-slate-300 text-sm sm:text-base leading-relaxed">
        {/* Préambule */}
        <section className="p-6 rounded-2xl bg-[#091733] border border-[#D4AF37]/30 shadow-xl space-y-3">
          <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#D4AF37]" />
            <span>Préambule & Statut Institutionnel</span>
          </h2>
          <p>
            L&apos;association <strong>« Étudiant Entrepreneuriat Afrique » (EEA)</strong> est une organisation estudiantine panafricaine fondée en 2008 au sein du campus de l&apos;Université Cheikh Anta Diop (UCAD) de Dakar (Sénégal) et entrée en activité opérationnelle officielle en 2026.
          </p>
          <p>
            L&apos;association dispose de la reconnaissance officielle de l&apos;État du Sénégal, attestée par le <strong>Récépissé de Déclaration d&apos;Association N° 11450/M.INT.CL/DAGAT/DEL/AS</strong> délivré par le Ministère de l&apos;Intérieur.
          </p>
          <p className="text-xs text-[#F3DE8A] italic font-serif">
            Notre credo statutaire : « Devenir en entreprenant ».
          </p>
        </section>

        {/* Article 1 */}
        <section className="space-y-3">
          <h3 className="text-xl font-bold text-white border-l-4 border-[#D4AF37] pl-3">
            Article 1 — Objet & Champ d&apos;Application
          </h3>
          <p>
            Les présentes Conditions Générales définissent les règles d&apos;adhésion à l&apos;association EEA ainsi que les conditions d&apos;utilisation de sa plateforme numérique officielle (<code className="text-xs font-mono bg-white/10 px-1.5 py-0.5 rounded text-[#D4AF37]">eea-platform</code>).
          </p>
          <p>
            Toute inscription et toute validation de paiement de cotisation emportent adhésion pleine, entière et sans réserve aux présents statuts et règlement intérieur.
          </p>
        </section>

        {/* Article 2 */}
        <section className="space-y-3">
          <h3 className="text-xl font-bold text-white border-l-4 border-[#D4AF37] pl-3">
            Article 2 — Accès Libre & Modalités d&apos;Adhésion
          </h3>
          <p>
            La consultation des informations publiques, l&apos;accès à l&apos;historique et la vérification des cartes par QR code sont <strong>libres et gratuits pour tous</strong>.
          </p>
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
            <h4 className="font-bold text-white flex items-center gap-2 text-sm">
              <CreditCard className="w-4 h-4 text-[#D4AF37]" />
              <span>Cotisation Unique Forfaitaire de 3 000 FCFA :</span>
            </h4>
            <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
              <li>
                L&apos;adhésion au statut de <strong>Membre Actif Officiel</strong> requiert le versement d&apos;une cotisation unique de <strong>3 000 FCFA</strong> (soit environ 4,60 €).
              </li>
              <li>
                <strong>Validité Permanente à vie :</strong> Aucun renouvellement annuel ni aucune cotisation périodique récurrente ne sont imposés. Une fois acquittée et validée, l&apos;adhésion confère le titre de membre de manière pérenne, sauf décision expresse de radiation.
              </li>
              <li>
                Les paiements sont effectués via les canaux officiels habilités (Wave, Orange Money ou virement validé par le Secrétariat Général).
              </li>
            </ul>
          </div>
        </section>

        {/* Article 3 */}
        <section className="space-y-3">
          <h3 className="text-xl font-bold text-white border-l-4 border-[#D4AF37] pl-3">
            Article 3 — Carte Officielle Numérique Infalsifiable
          </h3>
          <p>
            Chaque membre en règle reçoit une <strong>Carte Officielle Numérique de Membre (Format Standard CR80)</strong>, téléchargeable aux formats PDF haute définition (prêt pour impression PVC) et image PNG.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <QrCode className="w-4 h-4 text-[#38BDF8]" />
                <span>QR Code Dynamique d&apos;Authenticité</span>
              </div>
              <p className="text-xs text-slate-300">
                La carte intègre un QR code unique relié directement au registre centralisé de l&apos;EEA. Le scan public permet à toute autorité, recruteur ou partenaire de certifier instantanément le matricule officiel, le nom et le statut actif du porteur.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Caractère Incessible & Sécurité</span>
              </div>
              <p className="text-xs text-slate-300">
                La carte de membre est strictement nominative et personnelle. Toute tentative de falsification, de modification des métadonnées ou d&apos;usurpation de matricule entraîne l&apos;invalidation immédiate du jeton de vérification et des poursuites légales.
              </p>
            </div>
          </div>
        </section>

        {/* Article 4 */}
        <section className="space-y-3">
          <h3 className="text-xl font-bold text-white border-l-4 border-[#D4AF37] pl-3">
            Article 4 — Droits & Avantages des Membres Actifs
          </h3>
          <p>L&apos;obtention de la carte officielle confère les droits statutaires suivants :</p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-xs sm:text-sm">
            <li className="p-3 rounded-lg bg-white/[0.02] border border-white/5 flex items-start gap-2">
              <span className="text-[#D4AF37] font-bold">•</span>
              <span>Accès prioritaire aux programmes de bourses et d&apos;amorçage de projets de l&apos;EEA.</span>
            </li>
            <li className="p-3 rounded-lg bg-white/[0.02] border border-white/5 flex items-start gap-2">
              <span className="text-[#D4AF37] font-bold">•</span>
              <span>Participation aux incubateurs universitaires et fermes pilotes expérimentales.</span>
            </li>
            <li className="p-3 rounded-lg bg-white/[0.02] border border-white/5 flex items-start gap-2">
              <span className="text-[#D4AF37] font-bold">•</span>
              <span>Mentorat de haut niveau assuré par des chefs d&apos;entreprises et la diaspora.</span>
            </li>
            <li className="p-3 rounded-lg bg-white/[0.02] border border-white/5 flex items-start gap-2">
              <span className="text-[#D4AF37] font-bold">•</span>
              <span>Éligibilité pour représenter l&apos;EEA lors des délégations et sommets économiques africains.</span>
            </li>
          </ul>
        </section>

        {/* Article 5 */}
        <section className="space-y-3">
          <h3 className="text-xl font-bold text-white border-l-4 border-[#D4AF37] pl-3">
            Article 5 — Devoirs, Éthique & Radiation
          </h3>
          <p>
            Tout membre adhérent s&apos;engage à porter haut les valeurs d&apos;intégrité, de probité intellectuelle, d&apos;excellence managériale et de solidarité africaine.
          </p>
          <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/30 text-rose-200 text-xs sm:text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-white mb-1">Motifs de Révocation ou Radiation :</strong>
              Le bureau exécutif se réserve le droit de révoquer un badge officiel et de radier un membre en cas de fausse déclaration d&apos;identité, d&apos;atteinte délibérée à l&apos;honneur ou aux biens de l&apos;association, ou d&apos;utilisation frauduleuse du matricule d&apos;authentification.
            </div>
          </div>
        </section>

        {/* Article 6 */}
        <section className="space-y-3">
          <h3 className="text-xl font-bold text-white border-l-4 border-[#D4AF37] pl-3">
            Article 6 — Politique de Règlement & Non-Remboursement
          </h3>
          <p>
            La cotisation d&apos;adhésion de 3 000 FCFA est définitivement acquise à l&apos;association dès lors que le dossier a été validé et que la carte officielle numérique personnalisée a été générée.
          </p>
          <p>
            En raison de la délivrance immédiate d&apos;un titre numérique certifié et personnalisé infalsifiable, aucun remboursement ne sera effectué une fois l&apos;attribution du matricule opérée, sauf en cas de double versement accidentel avéré faisant l&apos;objet d&apos;une réclamation sous 48 heures.
          </p>
        </section>

        {/* Article 7 */}
        <section className="space-y-3">
          <h3 className="text-xl font-bold text-white border-l-4 border-[#D4AF37] pl-3">
            Article 7 — Propriété Intellectuelle
          </h3>
          <p>
            Le nom « Étudiant Entrepreneuriat Afrique », le sigle « EEA », les logos officiels, la devise « Devenir en entreprenant », ainsi que l&apos;architecture graphique du badge de membre sont protégés au titre de la propriété intellectuelle et des droits associatifs statutaires.
          </p>
          <p>
            Toute reproduction ou imitation non autorisée à des fins commerciales est passible de sanctions conformément aux lois en vigueur.
          </p>
        </section>

        {/* Article 8 */}
        <section className="space-y-3">
          <h3 className="text-xl font-bold text-white border-l-4 border-[#D4AF37] pl-3">
            Article 8 — Droit Applicable & Juridiction Compétente
          </h3>
          <p>
            Les présentes conditions sont régies et interprétées selon le droit de la République du Sénégal et les traités régionaux applicables.
          </p>
          <p>
            En cas de litige relatif à l&apos;interprétation ou à l&apos;exécution des statuts, les parties s&apos;efforceront de trouver un règlement amiable auprès du Secrétariat Général. À défaut, compétence exclusive est attribuée aux tribunaux compétents du ressort de Dakar.
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
            href="/confidentialite"
            className="text-xs text-[#38BDF8] hover:underline"
          >
            Politique de Confidentialité →
          </Link>
          <Link
            href="/#adhesion"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-[#060d1d] bg-gradient-to-r from-[#D4AF37] via-[#F3DE8A] to-[#D4AF37] hover:brightness-105 transition-all shadow-md"
          >
            <UserCheck className="w-3.5 h-3.5 text-[#060d1d]" />
            <span>Adhérer (3 000 FCFA)</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
