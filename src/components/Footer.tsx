"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ShieldCheck,
  Phone,
  MapPin,
  ArrowUpRight,
  Heart,
  Navigation,
  Mail,
} from "lucide-react";
import WhatsAppIcon from "./WhatsAppIcon";

export default function Footer() {
  const router = useRouter();
  const lastTapRef = useRef<number>(0);

  const handleSecretDoubleTap = () => {
    const now = Date.now();
    const timeDiff = now - lastTapRef.current;
    if (timeDiff > 0 && timeDiff < 450) {
      lastTapRef.current = 0;
      router.push("/admin");
    } else {
      lastTapRef.current = now;
    }
  };

  const whatsappUrl = `https://wa.me/221785425345?text=${encodeURIComponent(
    "Bonjour Secrétariat EEA, je souhaite des informations sur l'adhésion ou payer directement ma carte de membre (3 000 FCFA) pour activation à distance."
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
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                <span>
                  <strong>Adresse officielle :</strong> UCAD, Campus universitaire, ENSEPT, Pavillon E, Dakar (Sénégal)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#38BDF8] shrink-0" />
                <span>
                  <strong>E-mail officiel :</strong>{" "}
                  <a href="mailto:eeaucad@yahoo.fr" className="text-slate-200 hover:text-[#D4AF37] underline transition-colors">
                    eeaucad@yahoo.fr
                  </a>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#25D366] shrink-0" />
                <span>
                  <strong>Ligne directe & WhatsApp :</strong> +221 78 542 53 45
                </span>
              </div>
            </div>

            {/* Sceau & Badge Officiel de Reconnaissance Étatique */}
            <div className="mt-3 p-3.5 rounded-xl bg-gradient-to-br from-[#0B2A4A]/80 via-[#091733] to-[#060d1d] border border-[#D4AF37]/50 shadow-lg shadow-black/40 flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-white/[0.04] border-2 border-[#D4AF37]/50 flex items-center justify-center text-[#D4AF37] shrink-0 mt-0.5 shadow-md shadow-black/40">
                <ShieldCheck className="w-5 h-5 text-[#D4AF37]" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-white text-[11px] uppercase tracking-wider">
                    Reconnaissance Officielle d&apos;État
                  </span>
                  <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-400 bg-emerald-500/15 px-1.5 py-0.5 rounded-full border border-emerald-500/30">
                    <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                    Enregistré
                  </span>
                </div>
                <div className="font-mono text-[#F3DE8A] text-xs font-bold tracking-tight">
                  Récépissé N° 11450/M.INT.CL/DAGAT/DEL/AS
                </div>
                <p className="text-[10px] text-slate-300 leading-snug">
                  Délivré par le Ministère de l&apos;Intérieur (DAGAT / DEL / AS) attestant de l&apos;existence légale et statutaire de l&apos;association.
                </p>
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
                  7 Buts Statutaires
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
                  Carte Numérique (3 000 F)
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

          {/* Col 4: Contact & Administration (3 cols) */}
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

            <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-500">
              <span>Secrétariat Général</span>
              <span className="text-slate-500">Permanence UCAD</span>
            </div>
          </div>
        </div>

        {/* MODULE MODERNE : PLAN D'ACCÈS & ITINÉRAIRE GPS (AUCUNE COULEUR NÉON) */}
        <div className="my-10 p-5 sm:p-7 rounded-2xl bg-[#061024] border border-[#D4AF37]/30 shadow-2xl relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
            {/* Colonne Gauche : Coordonnées du Siège & Itinéraire (5 colonnes) */}
            <div className="lg:col-span-5 space-y-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0B3C8A]/40 border border-[#D4AF37]/30 text-[11px] font-bold text-[#D4AF37] uppercase tracking-wider mb-2">
                  <MapPin className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Siège Administratif & Campus Universitaire</span>
                </div>
                <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  Plan d&apos;Accès au Pavillon E (ENSEPT UCAD)
                </h3>
                <p className="text-xs text-[#D4AF37] italic font-serif mt-0.5">
                  Notre credo : « Devenir en entreprenant »
                </p>
              </div>

              {/* Détails du lieu officiel */}
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-2.5 text-xs text-slate-300">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block">Adresse statutaire officielle :</strong>
                    <span>UCAD, Campus universitaire, ENSEPT, Pavillon E — Dakar, Sénégal</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1 border-t border-white/5">
                  <Mail className="w-4 h-4 text-[#38BDF8] shrink-0" />
                  <div>
                    <span className="text-slate-400">Courriel officiel : </span>
                    <a href="mailto:eeaucad@yahoo.fr" className="text-white hover:text-[#D4AF37] underline font-mono">
                      eeaucad@yahoo.fr
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-[#25D366] shrink-0" />
                  <div>
                    <span className="text-slate-400">Permanence secrétariat : </span>
                    <span className="text-white font-mono font-medium">+221 78 542 53 45</span>
                  </div>
                </div>
              </div>

              {/* Bouton d'Itinéraire Direct Google Maps */}
              <div className="pt-1 flex flex-col sm:flex-row gap-3">
                <a
                  href="https://www.google.com/maps/dir/?api=1&destination=ENSEPT+UCAD+Dakar+Senegal"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-[#060d1d] bg-gradient-to-r from-[#D4AF37] via-[#F3DE8A] to-[#D4AF37] hover:brightness-105 transition-all text-xs shadow-md shadow-black/40 w-full sm:w-auto"
                >
                  <Navigation className="w-4 h-4 text-[#060d1d]" />
                  <span>Calculer mon Itinéraire GPS</span>
                </a>

                <a
                  href="mailto:eeaucad@yahoo.fr"
                  className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors text-xs w-full sm:w-auto"
                >
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span>Écrire au Secrétariat</span>
                </a>
              </div>
            </div>

            {/* Colonne Droite : Carte Interactive Sombre (7 colonnes) */}
            <div className="lg:col-span-7">
              <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] lg:h-[280px] rounded-xl overflow-hidden border border-[#D4AF37]/30 shadow-xl bg-[#040914]">
                <iframe
                  title="Carte de localisation de l'EEA à l'ENSEPT UCAD Dakar"
                  src="https://maps.google.com/maps?q=ENSEPT%20UCAD%20Dakar%20Senegal&t=&z=16&ie=UTF8&iwloc=&output=embed"
                  width="100%"
                  height="100%"
                  style={{
                    border: 0,
                    filter: "contrast(105%) brightness(92%)",
                  }}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="w-full h-full"
                />

                {/* Badge d'identification flottant sur la carte */}
                <div className="absolute top-3 left-3 bg-[#061024]/95 backdrop-blur-md border border-[#D4AF37]/50 px-3 py-1.5 rounded-lg shadow-lg text-[11px] font-semibold text-white flex items-center gap-1.5 pointer-events-none">
                  <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-ping" />
                  <span className="font-bold text-[#F3DE8A]">ENSEPT • Pavillon E</span>
                  <span className="text-slate-400 hidden sm:inline">• Campus UCAD</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Attribution */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 border-t border-white/5">
          <p>
            © 2008 — 2026 Association estudiantine Étudiant Entreprenariat Afrique (EEA) • Récépissé Officiel N° 11450/M.INT.CL/DAGAT/DEL/AS • UCAD Dakar.
          </p>

          <div className="flex items-center gap-1 text-slate-400">
            <span
              onClick={handleSecretDoubleTap}
              onDoubleClick={() => router.push("/admin")}
              className="italic font-serif text-[#D4AF37] select-none cursor-default touch-manipulation"
              role="presentation"
            >
              « Devenir en entreprenant »
            </span>
            <span className="mx-1.5 text-slate-600">•</span>
            <span>Pour l&apos;Afrique</span>
            <Heart className="w-3 h-3 text-red-400 fill-red-400 inline" />
          </div>
        </div>
      </div>
    </footer>
  );
}
