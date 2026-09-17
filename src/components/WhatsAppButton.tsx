"use client";

import { usePathname } from "next/navigation";
import WhatsAppIcon from "./WhatsAppIcon";

export default function WhatsAppButton() {
  const pathname = usePathname();

  // Masquer le bouton WhatsApp sur l'espace d'administration
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  const phoneNumber = "221785425345";
  const defaultMessage = encodeURIComponent(
    "Bonjour Secrétariat EEA, je souhaite des informations sur l'adhésion ou payer directement ma carte de membre (3 000 FCFA) pour activation à distance."
  );
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${defaultMessage}`;

  return (
    <div className="fixed bottom-5 right-4 sm:bottom-6 sm:right-6 z-50">
      {/* Main WhatsApp Floating Trigger Button */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Contacter l'EEA sur WhatsApp"
        className="relative group flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-xl shadow-[#25D366]/30 transition-all duration-300 hover:scale-110 active:scale-95 border-2 border-white/20"
      >
        {/* WhatsApp Icon */}
        <WhatsAppIcon className="w-6 h-6 sm:w-7 sm:h-7 text-white relative z-10" />
      </a>
    </div>
  );
}
