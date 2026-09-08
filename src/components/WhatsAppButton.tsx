"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import WhatsAppIcon from "./WhatsAppIcon";

export default function WhatsAppButton() {
  const [showTooltip, setShowTooltip] = useState(true);

  const phoneNumber = "221785425345";
  const defaultMessage = encodeURIComponent(
    "Bonjour Secrétariat EEA, je souhaite des informations sur l'adhésion ou payer directement ma carte de membre (5 000 FCFA) pour activation à distance."
  );
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${defaultMessage}`;

  return (
    <div className="fixed bottom-5 right-4 sm:bottom-6 sm:right-6 z-50 flex items-end gap-3">
      {/* Speech Bubble / Tooltip */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="hidden sm:flex items-center gap-2 bg-[#091733] border border-[#25D366]/40 text-white px-4 py-2.5 rounded-2xl shadow-xl shadow-black/50 text-xs font-medium max-w-xs relative"
          >
            <WhatsAppIcon className="w-4 h-4 text-[#25D366] shrink-0" />
            <div>
              <p className="font-bold text-slate-100">Assistance & Activation WhatsApp</p>
              <p className="text-[11px] text-slate-300">
                Payer par Wave / Orange Money ou poser vos questions (+221 78 542 53 45)
              </p>
            </div>
            <button
              onClick={() => setShowTooltip(false)}
              className="text-slate-400 hover:text-white ml-2 p-1"
              aria-label="Fermer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main WhatsApp Floating Trigger Button */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Contacter l'EEA sur WhatsApp"
        className="relative group flex items-center justify-center w-14 h-14 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-xl shadow-[#25D366]/30 transition-all duration-300 hover:scale-110 active:scale-95 border-2 border-white/20"
      >
        {/* Subtle Ping Animation Ring */}
        <span className="absolute inset-0 rounded-full bg-[#25D366]/40 animate-ping pointer-events-none" />

        {/* WhatsApp Icon */}
        <WhatsAppIcon className="w-8 h-8 text-white relative z-10" />

        {/* Badge Indicator */}
        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#D4AF37] border-2 border-[#060d1d] flex items-center justify-center text-[9px] font-black text-[#060d1d]">
          1
        </span>
      </a>
    </div>
  );
}
