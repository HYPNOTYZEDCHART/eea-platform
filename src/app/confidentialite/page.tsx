import type { Metadata } from "next";
import Link from "next/link";
import {
  ShieldCheck,
  Lock,
  Eye,
  Database,
  UserCheck,
  FileCheck,
  Mail,
  ArrowLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Politique de Confidentialité & Protection des Données | EEA",
  description:
    "Politique officielle de protection des données personnelles de l'association Étudiant Entrepreneuriat Afrique, conforme à la Loi sénégalaise N° 2008-12 et aux standards internationaux.",
};

export default function ConfidentialitePage() {
  return (
    <div className="min-h-screen py-28 sm:py-36 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-slate-400 mb-8">
        <Link href="/" className="hover:text-[#D4AF37] transition-colors">
          Accueil
        </Link>
        <ChevronRight className="w-3 h-3 text-slate-600" />
        <span className="text-[#38BDF8] font-medium">Politique de Confidentialité</span>
      </nav>

      {/* Header Banner */}
      <div className="border-b border-white/10 pb-8 mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0F224A] border border-[#38BDF8]/30 text-xs font-semibold text-[#38BDF8] uppercase tracking-wider mb-4">
          <Lock className="w-3.5 h-3.5" />
          <span>Protection des Données Personnelles</span>
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
          Politique de Confidentialité & Traitement des Données
        </h1>

        <p className="mt-4 text-base sm:text-lg text-slate-300 max-w-3xl leading-relaxed">
          L&apos;association Étudiant Entrepreneuriat Afrique (EEA) s&apos;engage à protéger la vie privée et les données à caractère personnel de ses membres adhérents et utilisateurs conformément à la législation en vigueur.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/[0.04] border border-white/10">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Conformité Loi N° 2008-12 (CDP Sénégal) & RGPD</span>
          </div>
          <span className="hidden sm:inline text-slate-600">•</span>
          <span>Dernière révision : 2026</span>
          <span className="hidden sm:inline text-slate-600">•</span>
          <span>Secrétariat Général EEA • UCAD Dakar</span>
        </div>
      </div>

      {/* Main Content Body */}
      <div className="space-y-12 text-slate-300 text-sm sm:text-base leading-relaxed">
        {/* Section 1 : Responsable */}
        <section className="p-6 rounded-2xl bg-[#091733] border border-white/10 shadow-xl space-y-3">
          <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-[#D4AF37]" />
            <span>1. Responsable du Traitement des Données</span>
          </h2>
          <p>
            Le responsable légal du traitement des données personnelles collectées sur la plateforme est :
          </p>
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 text-xs sm:text-sm space-y-1.5 font-mono">
            <p className="text-white font-bold">Association « Étudiant Entrepreneuriat Afrique » (EEA)</p>
            <p className="text-slate-300">Récépissé N° 11450/M.INT.CL/DAGAT/DEL/AS</p>
            <p className="text-slate-300">Siège social : UCAD, Campus universitaire, ENSEPT, Pavillon E — Dakar (Sénégal)</p>
            <p className="text-[#38BDF8]">Courriel délégué : eeaucad@yahoo.fr</p>
            <p className="text-slate-300">Ligne directe Secrétariat : +221 78 542 53 45</p>
          </div>
        </section>

        {/* Section 2 : Données Collectées */}
        <section className="space-y-3">
          <h3 className="text-xl font-bold text-white border-l-4 border-[#38BDF8] pl-3">
            2. Nature des Données Collectées
          </h3>
          <p>
            Dans le cadre du processus d&apos;adhésion et de délivrance de la carte officielle de membre, l&apos;EEA collecte strictement les données nécessaires à l&apos;identification et à la certification du membre :
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-1.5">
              <h4 className="font-bold text-white text-xs uppercase tracking-wider text-[#D4AF37]">
                Identité Civile & Contact
              </h4>
              <ul className="text-xs space-y-1 text-slate-300 list-disc pl-4">
                <li>Nom et Prénom</li>
                <li>Numéro de téléphone portable (WhatsApp)</li>
                <li>Adresse électronique académique ou personnelle</li>
                <li>Pays de résidence / d&apos;études</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-1.5">
              <h4 className="font-bold text-white text-xs uppercase tracking-wider text-[#38BDF8]">
                Parcours Académique & Titre
              </h4>
              <ul className="text-xs space-y-1 text-slate-300 list-disc pl-4">
                <li>Université, Institut ou École Supérieure d&apos;attache</li>
                <li>Filière d&apos;études et spécialité</li>
                <li>Photographie d&apos;identité officielle au format 4x4</li>
                <li>Matricule unique attribué (ex : EEA-2026-SN-0842)</li>
              </ul>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 text-xs space-y-1 mt-3">
            <strong className="text-white block text-sm">Données de règlement de la cotisation (3 000 FCFA) :</strong>
            <p className="text-slate-300">
              Référence du transfert financier Wave ou Orange Money et horodatage de la transaction. L&apos;association ne stocke aucun identifiant bancaire ni mot de passe secret.
            </p>
          </div>
        </section>

        {/* Section 3 : Finalités */}
        <section className="space-y-3">
          <h3 className="text-xl font-bold text-white border-l-4 border-[#38BDF8] pl-3">
            3. Finalités du Traitement
          </h3>
          <p>Les données personnelles sont traitées exclusivement pour les finalités suivantes :</p>
          <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm">
            <li>
              <strong>Génération et délivrance du badge officiel :</strong> Composition de la carte numérique infalsifiable (format PDF/PNG) avec photo 4x4 et QR Code.
            </li>
            <li>
              <strong>Vérification d&apos;authenticité publique par QR Code :</strong> Permettre aux tiers autorisés (universités, partenaires, recruteurs) de vérifier que le titulaire de la carte est un membre actif en règle sur la page officielle <code className="text-xs font-mono bg-white/10 px-1 py-0.5 rounded text-[#D4AF37]">/verify/[token]</code>.
            </li>
            <li>
              <strong>Gestion du registre officiel des adhérents :</strong> Tenue à jour du registre associatif statutaire requis par les autorités compétentes.
            </li>
            <li>
              <strong>Communication associative & opportunités :</strong> Envoi des invitations aux programmes de formation, mentorat, bourses de projets et incubateurs.
            </li>
          </ul>
        </section>

        {/* Section 4 : Non-Commercialisation */}
        <section className="space-y-3">
          <h3 className="text-xl font-bold text-white border-l-4 border-[#38BDF8] pl-3">
            4. Absence Totale de Vente ou Cession Commerciale
          </h3>
          <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-emerald-200 text-xs sm:text-sm space-y-2">
            <div className="flex items-center gap-2 font-bold text-white text-base">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span>Engagement Statutaire d&apos;Intégrité</span>
            </div>
            <p>
              L&apos;EEA ne vend, ne loue, n&apos;échange et ne cède à aucun tiers commercial les données personnelles ou photographies de ses membres.
            </p>
            <p>
              Les seules données rendues publiques sont celles accessibles lors du scan du QR code de vérification (Nom, Prénom, Université, Filière, Statut actif et Matricule), avec le consentement exprès du membre.
            </p>
          </div>
        </section>

        {/* Section 5 : Sécurité */}
        <section className="space-y-3">
          <h3 className="text-xl font-bold text-white border-l-4 border-[#38BDF8] pl-3">
            5. Mesures de Sécurité & Confidentialité
          </h3>
          <p>
            L&apos;EEA met en œuvre des mesures techniques et organisationnelles rigoureuses pour protéger vos données contre toute destruction accidentelle, perte, altération ou divulgation non autorisée :
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 text-xs">
            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-1">
              <Database className="w-4 h-4 text-[#D4AF37]" />
              <strong className="text-white block">Chiffrement & RLS</strong>
              <p className="text-slate-300">Base de données sécurisée avec politiques de sécurité au niveau des lignes (Row-Level Security).</p>
            </div>
            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-1">
              <Lock className="w-4 h-4 text-[#38BDF8]" />
              <strong className="text-white block">Accès Administrateur Restreint</strong>
              <p className="text-slate-300">Seul le Secrétariat Général habilité dispose des clés d&apos;accès au registre des membres.</p>
            </div>
            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-1">
              <FileCheck className="w-4 h-4 text-emerald-400" />
              <strong className="text-white block">Jetons Uniques Cryptographiques</strong>
              <p className="text-slate-300">Chaque carte dispose d&apos;un jeton UUID non prédictible pour éviter toute falsification.</p>
            </div>
          </div>
        </section>

        {/* Section 6 : Durée de Conservation */}
        <section className="space-y-3">
          <h3 className="text-xl font-bold text-white border-l-4 border-[#38BDF8] pl-3">
            6. Durée de Conservation des Données
          </h3>
          <p>
            Puisque l&apos;adhésion à l&apos;EEA confère le statut de membre officiel <strong>à vie</strong>, les données d&apos;adhésion et la validité de la carte de membre sont conservées pendant toute la durée d&apos;existence de l&apos;association ou jusqu&apos;à radiation ou demande expresse de suppression par l&apos;adhérent.
          </p>
        </section>

        {/* Section 7 : Droits des Membres */}
        <section className="space-y-3">
          <h3 className="text-xl font-bold text-white border-l-4 border-[#38BDF8] pl-3">
            7. Vos Droits & Modalités d&apos;Exercice
          </h3>
          <p>
            Conformément à la Loi sénégalaise N° 2008-12 et aux principes internationaux de protection des données, vous disposez des droits suivants :
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
            <li><strong>Droit d&apos;accès :</strong> Obtenir communication de l&apos;intégralité des données détenues sur vous.</li>
            <li><strong>Droit de rectification :</strong> Corriger une erreur de frappe sur votre nom, votre filière ou votre université.</li>
            <li><strong>Droit à l&apos;effacement :</strong> Demander la suppression de vos données personnelles et l&apos;annulation de votre carte de membre.</li>
            <li><strong>Droit d&apos;opposition :</strong> Vous opposer pour motifs légitimes à tout traitement spécifique.</li>
          </ul>

          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 text-xs sm:text-sm mt-3 flex items-start gap-3">
            <Mail className="w-5 h-5 text-[#38BDF8] shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block mb-1">Pour exercer vos droits :</strong>
              Envoyez un courriel à <a href="mailto:eeaucad@yahoo.fr" className="text-[#D4AF37] underline font-mono">eeaucad@yahoo.fr</a> en indiquant votre nom, prénom et matricule officiel. Votre demande sera traitée par le Secrétariat Général dans un délai maximal de 30 jours.
            </div>
          </div>
        </section>

        {/* Section 8 : Cookies */}
        <section className="space-y-3">
          <h3 className="text-xl font-bold text-white border-l-4 border-[#38BDF8] pl-3">
            8. Cookies & Traceurs
          </h3>
          <p>
            La plateforme EEA n&apos;utilise <strong>aucun cookie publicitaire tiers</strong>. Seuls des mécanismes techniques de stockage local (localStorage) strictement indispensables au bon déroulement du tunnel d&apos;adhésion, au maintien de la session administrative et à la prévisualisation instantanée de votre carte sont employés.
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
            Conditions Générales d&apos;Adhésion →
          </Link>
          <Link
            href="/#adhesion"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-[#060d1d] bg-gradient-to-r from-[#D4AF37] via-[#F3DE8A] to-[#D4AF37] hover:brightness-105 transition-all shadow-md"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#060d1d]" />
            <span>Adhérer à l&apos;EEA (3 000 FCFA)</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
