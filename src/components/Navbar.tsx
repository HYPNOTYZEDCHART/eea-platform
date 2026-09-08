"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ShieldCheck, CreditCard } from "lucide-react";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Le Mouvement", href: "#mouvement" },
    { name: "Piliers & Vision", href: "#piliers" },
    { name: "Impact & Chiffres", href: "#impact" },
    { name: "Carte Membre", href: "#carte" },
    { name: "Partenaires", href: "#partenaires" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#08142c]/90 backdrop-blur-md shadow-lg shadow-black/20 border-b border-white/10 py-3"
          : "bg-[#08142c]/50 backdrop-blur-sm border-b border-white/5 py-4"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo & Institution Brand */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-11 h-11 rounded-full overflow-hidden border-2 border-[#D4AF37] shadow-sm shadow-black/40 transition-transform group-hover:scale-105">
              <Image
                src="/logo-eea.jpg"
                alt="Logo EEA"
                fill
                className="object-cover"
                priority
              />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-cinzel font-black text-xl tracking-tight text-white">
                  EEA
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] uppercase font-semibold tracking-wider text-[#D4AF37] bg-[#D4AF37]/10 px-2 py-0.5 rounded-full border border-[#D4AF37]/30">
                  <ShieldCheck className="w-3 h-3 text-[#D4AF37]" />
                  Reconnu par l&apos;État
                </span>
              </div>
              <span className="text-[11px] text-slate-300 hidden sm:inline-block font-medium">
                Initié en 2008 à l&apos;UCAD • Démarrage officiel 2026
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-sm font-medium text-slate-200 hover:text-[#D4AF37] transition-colors duration-200 relative group py-1"
              >
                {link.name}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-[#D4AF37] to-[#FFF3B0] shadow-[0_0_8px_rgba(212,175,55,0.8)] transition-all duration-300 group-hover:w-full" />
              </a>
            ))}
          </nav>

          {/* Call to Action Desktop */}
          <div className="hidden md:flex items-center gap-4">
            <a
              href="#adhesion"
              className="relative inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-extrabold text-[#060d1d] bg-gradient-to-r from-[#D4AF37] via-[#FFF3B0] to-[#D4AF37] animate-sheen hover:brightness-105 shadow-lg shadow-[#D4AF37]/25 transition-all duration-300 hover:scale-[1.03] active:scale-[0.98]"
            >
              <CreditCard className="w-4 h-4 text-[#060d1d]" />
              <span>Adhérer • 5 000 FCFA</span>
            </a>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex md:hidden items-center gap-3">
            <a
              href="#adhesion"
              className="text-xs font-semibold px-3 py-2 rounded-md bg-[#D4AF37] text-[#060d1d]"
            >
              Adhérer
            </a>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-200 hover:text-white hover:bg-white/5 transition-colors"
              aria-label="Menu"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden bg-[#08142c] border-b border-white/10 px-4 pt-3 pb-6 space-y-3"
          >
            <div className="text-xs text-slate-400 font-medium px-2 pb-1 border-b border-white/5">
              Initié en 2008 à l&apos;UCAD • Démarrage officiel 2026
            </div>
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-slate-200 hover:text-white hover:bg-white/5 transition-colors"
              >
                {link.name}
              </a>
            ))}
            <div className="pt-2">
              <a
                href="#adhesion"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold text-[#060d1d] bg-gradient-to-r from-[#D4AF37] to-[#F3DE8A]"
              >
                <CreditCard className="w-4 h-4 text-[#060d1d]" />
                Obtenir ma Carte Officielle (5 000 FCFA)
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
