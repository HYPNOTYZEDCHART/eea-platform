"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HelpCircle,
  ChevronDown,
  Coins,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import WhatsAppIcon from "./WhatsAppIcon";

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const currencies = [
    { country: "Zone CFA (Sénégal, CI, Cameroun, Bénin, etc.)", amount: "3 000 FCFA", flag: "🌍" },
    { country: "Diaspora Europe (Zone Euro)", amount: "≈ 4,60 €", flag: "🇪🇺" },
    { country: "Diaspora Amériques & International", amount: "≈ 5,00 $", flag: "🇺🇸" },
    { country: "Ghana (GHS)", amount: "≈ 45 GHS", flag: "🇬🇭" },
    { country: "Nigeria (NGN)", amount: "≈ 7 500 NGN", flag: "🇳🇬" },
    { country: "RD Congo (CDF)", amount: "≈ 13 200 CDF", flag: "🇨🇩" },
    { country: "Guinée (GNF)", amount: "≈ 42 000 GNF", flag: "🇬🇳" },
  ];

  const faqs = [
    {
      q: "L'accès au site et aux informations est-il payant ?",
      a: "Non, absolument pas. La consultation de la plateforme, l'exploration de nos piliers, l'accès à nos actualités et le partage d'idées sont 100 % libres et gratuits pour tous les étudiants et visiteurs. L'adhésion à 3 000 FCFA est une démarche volontaire réservée à ceux qui souhaitent devenir membres officiels, recevoir leur badge certifié et accéder aux financements et incubateurs.",
    },
    {
      q: "Quels sont les moyens de paiement acceptés pour les 3 000 FCFA ?",
      a: "Nous acceptons tous les moyens de paiement usuels sur le continent : Wave, Orange Money, MTN MoMo, Moov Money, ainsi que les cartes bancaires (Visa, Mastercard) pour les étudiants de la diaspora ou à l'international.",
    },
    {
      q: "Puis-je payer directement et faire activer ma carte via WhatsApp ?",
      a: "Oui ! Si vous rencontrez la moindre difficulté avec le paiement en ligne ou si vous préférez un accompagnement humain direct, notre secrétariat est joignable sur WhatsApp au +221 78 542 53 45. Vous pouvez y effectuer votre transfert Wave/Orange Money et votre carte officielle numérique vous sera envoyée immédiatement après validation.",
    },
    {
      q: "Comment ma carte de membre est-elle vérifiée par les tiers ?",
      a: "Chaque carte de membre générée dispose d'un QR code unique et infalsifiable relié à notre base centrale sécurisée. Un employeur, un partenaire ou un organisme académique peut simplement scanner le QR code pour afficher instantanément la page officielle de vérification attestant de votre statut de membre actif.",
    },
    {
      q: "Les étudiants de la diaspora africaine peuvent-ils adhérer ?",
      a: "Absolument. L'EEA est une organisation panafricaine fondée en 2008 à l'UCAD de Dakar et ouverte à l'ensemble des étudiants africains, qu'ils étudient sur le continent ou au sein des universités en Europe, en Amérique du Nord ou en Asie. La diaspora est un pilier essentiel de notre réseau de mentorat et d'investissement.",
    },
    {
      q: "Quelle est la durée de validité de l'adhésion ?",
      a: "L'adhésion est valable pour une année académique complète (12 mois). Aucun renouvellement n'est prélevé de manière automatique. Vous gardez le contrôle total.",
    },
  ];

  const whatsappUrl = `https://wa.me/221785425345?text=${encodeURIComponent(
    "Bonjour Secrétariat EEA, je souhaite des informations sur l'adhésion ou payer directement ma carte de membre (3 000 FCFA) pour activation à distance."
  )}`;

  return (
    <section id="faq" className="relative py-24 sm:py-32 bg-[#060d1d]/20 backdrop-blur-[1px] overflow-hidden border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0F224A] border border-[#D4AF37]/30 text-xs font-semibold text-[#D4AF37] uppercase tracking-wider mb-4">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Transparence & Modalités</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Foire Aux Questions & Équivalences
          </h2>

          <p className="mt-4 text-base sm:text-lg text-slate-300">
            Toutes les réponses pour comprendre l&apos;adhésion, la carte numérique officielle et les opportunités offertes par l&apos;EEA.
          </p>
        </div>

        {/* Currency Equivalences Strip */}
        <div className="mb-16 p-6 sm:p-8 rounded-2xl bg-[#091733] border border-white/10 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37]">
                <Coins className="w-4 h-4" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white">
                Équivalences Régionales pour la Cotisation de 3 000 FCFA
              </h3>
            </div>
            <span className="text-xs text-[#D4AF37] font-semibold">
              Tarif unique étudiant • Valable 1 an
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {currencies.map((c) => (
              <div
                key={c.country}
                className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex flex-col justify-between"
              >
                <span className="text-base mb-1">{c.flag}</span>
                <span className="text-[11px] text-slate-400 truncate block">
                  {c.country}
                </span>
                <span className="text-sm font-bold text-white mt-1">
                  {c.amount}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Two Columns: FAQ Accordion + WhatsApp Special Banner */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* FAQ Accordion (8 columns) */}
          <div className="lg:col-span-8 space-y-4">
            {faqs.map((faq, index) => {
              const isOpen = openIndex === index;
              return (
                <div
                  key={faq.q}
                  className="rounded-xl bg-[#091733]/80 border border-white/10 overflow-hidden transition-colors hover:border-[#D4AF37]/30"
                >
                  <button
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    className="w-full text-left p-5 flex items-center justify-between gap-4 font-semibold text-white text-sm sm:text-base"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-[#D4AF37] shrink-0 transition-transform duration-200 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-white/5">
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          {/* WhatsApp Direct Assistance Card (4 columns) */}
          <div className="lg:col-span-4">
            <div className="p-6 sm:p-7 rounded-2xl bg-gradient-to-br from-[#0B2A4A] via-[#091733] to-[#08142c] border-2 border-[#25D366]/40 shadow-xl space-y-4">
              <div className="w-12 h-12 rounded-xl bg-[#25D366]/20 border border-[#25D366]/40 flex items-center justify-center text-[#25D366]">
                <WhatsAppIcon className="w-6 h-6" />
              </div>

              <h4 className="text-lg sm:text-xl font-extrabold text-white">
                Assistance & Activation Directe sur WhatsApp
              </h4>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
                Vous avez une question particulière ? Vous préférez payer par transfert direct Wave ou Orange Money et recevoir votre carte activée à distance ?
              </p>

              <div className="py-2 space-y-2 text-xs text-slate-200">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[#25D366]" />
                  <span>Réponse rapide par le secrétariat</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[#25D366]" />
                  <span>Numéro officiel : <strong>+221 78 542 53 45</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[#25D366]" />
                  <span>Délivrance immédiate de votre carte</span>
                </div>
              </div>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-bold text-white bg-[#25D366] hover:bg-[#20bd5a] transition-all duration-200 shadow-lg shadow-[#25D366]/20 text-sm"
              >
                <span>Contacter au 78 542 53 45</span>
                <ArrowRight className="w-4 h-4 text-white" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
