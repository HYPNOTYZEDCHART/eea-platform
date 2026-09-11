"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ShieldCheck,
  Phone,
  MapPin,
  Lock,
  ArrowUpRight,
  Heart,
} from "lucide-react";
import WhatsAppIcon from "./WhatsAppIcon";

export default function Footer() {
  const whatsappUrl = `https://wa.me/221785425345?text=${encodeURIComponent(
    "Bonjour Secrétariat EEA, je souhaite des informations sur l'adhésion ou payer directement ma carte de membre (5 000 FCFA) pour activation à distance."
  )}`;

  return (
    <footer className="bg-[#040914]/85 backdrop-blur-sm text-slate-300 border-t border-white/10 relative overflow-hidden">
      {/* Top Banner Accent */}
      <div className="h-1 w-full bg-gradient-to-r from-[#0B3C8A] via-[#D4AF37] to-[#0B3C8A]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 pb-12 border-b border-white/10">
          {/* Col 1: Identity & Official Status (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-[#D4AF37] shadow-md">
                <Image
                  src="/logo-eea.jpg"
                  alt="Logo Officiel EEA"
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <span className="font-black text-xl text-white tracking-tight block">
                  EEA
                </span>
                <span className="text-xs text-[#D4AF37] font-semibold tracking-wider uppercase">
                  Étudiant Entrepreneuriat Afrique
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-md font-normal">
              Organisation estudiantine panafricaine. Projet conçu en 2008 à l&apos;UCAD de Dakar et officiellement entré en activité opérationnelle en 2026. Notre mission : former, financer et fédérer la nouvelle génération d&apos;entrepreneurs africains en agro-business et en technologies.
            </p>

            <div className="flex flex-col gap-2 pt-2 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#D4AF37] shrink-0" />
                <span>Certification Officielle EEA</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#D4AF37] shrink-0" />
                <span>Siège d&apos;origine : Bibliothèque Centrale, UCAD, Dakar (Sénégal)</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#25D366] shrink-0" />
                <span>Ligne directe & WhatsApp : <strong>+221 78 542 53 45</strong></span>
              </div>
            </div>
          </div>

          {/* Col 2: Navigation Rapide (2 cols) */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-xs uppercase tracking-wider font-bold text-[#D4AF37]">
              Le Mouvement
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li>
                <a href="#mouvement" className="hover:text-white transition-colors">
                  Histoire (2008 — 2026)
                </a>
              </li>
              <li>
                <a href="#piliers" className="hover:text-white transition-colors">
                  Les 4 Piliers Fondateurs
                </a>
              </li>
              <li>
                <a href="#piliers" className="hover:text-white transition-colors">
                  Buts Statutaires
                </a>
              </li>
              <li>
                <a href="#carte" className="hover:text-white transition-colors">
                  Carte Numérique Sécurisée
                </a>
              </li>
              <li>
                <a href="#adhesion" className="hover:text-white transition-colors">
                  Campagne d&apos;Adhésion 2026
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: Adhésion & Badge (2 cols) */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-xs uppercase tracking-wider font-bold text-[#D4AF37]">
              Adhésion & Carte
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li>
                <a href="#carte" className="hover:text-white transition-colors">
                  Carte Numérique (5 000 F)
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-white transition-colors">
                  Équivalences Monétaires
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-white transition-colors">
                  Foire Aux Questions
                </a>
              </li>
              <li>
                <Link href="/verify" className="hover:text-white transition-colors flex items-center gap-1">
                  <span>Vérifier une carte</span>
                  <ArrowUpRight className="w-3 h-3 text-[#D4AF37]" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Assistance & Administration (3 cols) */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-xs uppercase tracking-wider font-bold text-[#D4AF37]">
              Contact & Gestion
            </h4>
            <p className="text-xs text-slate-400">
              Besoin d&apos;assistance pour adhérer ou activer votre carte ?
            </p>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/30 text-[#25D366] text-xs font-semibold transition-colors"
            >
              <WhatsAppIcon className="w-3.5 h-3.5" />
              <span>WhatsApp : 78 542 53 45</span>
            </a>

            <div className="pt-3 border-t border-white/5 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">Secrétariat Général</span>
              <Link
                href="/admin"
                title="Accès Administrateur"
                className="p-1.5 rounded-lg text-slate-500 hover:text-[#D4AF37] hover:bg-white/5 border border-white/5 hover:border-[#D4AF37]/30 transition-all"
                aria-label="Accès Administrateur"
              >
                <Lock className="w-3.5 h-3.5 text-[#D4AF37]" />
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Attribution */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>
            © 2008 — 2026 Étudiant Entrepreneuriat Afrique (EEA) • Projet né en 2008 • Démarrage officiel en 2026.
          </p>

          <div className="flex items-center gap-1 text-slate-400">
            <span>Pour la souveraineté économique de la jeunesse africaine</span>
            <Heart className="w-3 h-3 text-red-400 fill-red-400 inline" />
          </div>
        </div>
      </div>
    </footer>
  );
}
