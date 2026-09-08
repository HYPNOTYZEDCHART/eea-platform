"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import QRCode from "qrcode";
import { jsPDF } from "jspdf";
import {
  Download,
  FileDown,
  Printer,
  ShieldCheck,
  ExternalLink,
  Sparkles,
  QrCode as QrIcon,
  CheckCircle,
} from "lucide-react";
import { Member } from "@/lib/supabase";

interface MemberCardBadgeProps {
  member?: Member | null;
  compact?: boolean;
}

const defaultDemoMember: Member = {
  id: "demo-id",
  membership_id: "EEA-2026-SN-0842",
  first_name: "Jean-David",
  last_name: "KOUASSI",
  email: "kouassi.jeandavid@ucad.edu.sn",
  phone: "+221 78 542 53 45",
  country: "Sénégal",
  university: "Université Cheikh Anta Diop (UCAD Dakar)",
  field_of_study: "Génie Logiciel & Agrobusiness",
  photo_url: null,
  qr_code_token: "eea_token_demo_0842",
  status: "active",
  created_at: "2026-01-01T00:00:00.000Z",
  expires_at: "2027-01-01T00:00:00.000Z",
};

export default function MemberCardBadge({
  member: initialMember,
  compact = false,
}: MemberCardBadgeProps) {
  const [localMember, setLocalMember] = useState<Member | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [downloadingPng, setDownloadingPng] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const cardElementRef = useRef<HTMLDivElement>(null);

  const member: Member = initialMember || localMember || defaultDemoMember;

  // Set client-side timestamp and fallback to localStorage if no prop provided
  useEffect(() => {
    setCurrentTime(Date.now());
    if (!initialMember && typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("eea_current_member");
        if (stored) {
          setLocalMember(JSON.parse(stored));
        }
      } catch (err) {
        console.error(err);
      }
    }
  }, [initialMember]);

  // Generate dynamic QR Code for official verification URL
  useEffect(() => {
    if (!member) return;

    const baseUrl =
      typeof window !== "undefined"
        ? window.location.origin
        : "https://eea-afrique.org";
    const verifyUrl = `${baseUrl}/verify/${member.qr_code_token}`;

    QRCode.toDataURL(
      verifyUrl,
      {
        width: 340,
        margin: 1,
        color: {
          dark: "#060d1d",
          light: "#ffffff",
        },
      },
      (err, url) => {
        if (!err && url) {
          setQrCodeDataUrl(url);
        }
      }
    );
  }, [member]);

  // Reusable Canvas Generator (High-Resolution 300 DPI equivalent)
  const generateCanvas = async (): Promise<HTMLCanvasElement | null> => {
    if (!member) return null;

    const canvas = document.createElement("canvas");
    const width = 1050;
    const height = 660;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // 1. Background Gradient (Deep Institutional Navy)
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, "#0F224A");
    grad.addColorStop(0.5, "#091733");
    grad.addColorStop(1, "#060e1d");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // 2. Gold Outer Border (Prestige Framing)
    ctx.strokeStyle = "#D4AF37";
    ctx.lineWidth = 8;
    ctx.strokeRect(16, 16, width - 32, height - 32);

    // 3. Inner Header Banner
    ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
    ctx.fillRect(24, 24, width - 48, 110);
    ctx.strokeStyle = "rgba(212, 175, 55, 0.3)";
    ctx.lineWidth = 2;
    ctx.strokeRect(24, 24, width - 48, 110);

    // Draw Official Logo
    const logoImg = new window.Image();
    logoImg.crossOrigin = "anonymous";
    logoImg.src = "/logo-eea.jpg";
    await new Promise((res) => {
      logoImg.onload = res;
      logoImg.onerror = res;
    });

    if (logoImg.complete && logoImg.naturalWidth > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(80, 78, 42, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(logoImg, 38, 36, 84, 84);
      ctx.restore();
      ctx.strokeStyle = "#D4AF37";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(80, 78, 42, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Header Institutional Titles
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 26px sans-serif";
    ctx.fillText("ÉTUDIANT ENTREPRENEURIAT AFRIQUE", 140, 64);

    ctx.fillStyle = "#D4AF37";
    ctx.font = "bold 15px sans-serif";
    ctx.fillText("CARTE OFFICIELLE DE MEMBRE • INITIÉ EN 2008 • PROMOTION OFFICIELLE 2026", 140, 92);

    ctx.fillStyle = "#94a3b8";
    ctx.font = "12px sans-serif";
    ctx.fillText("BERCEAU HISTORIQUE : BIBLIOTHÈQUE CENTRALE UCAD (DAKAR, SÉNÉGAL)", 140, 114);

    // 4. Member Photo
    const photoBoxX = 50;
    const photoBoxY = 165;
    const photoWidth = 180;
    const photoHeight = 220;

    ctx.fillStyle = "#040914";
    ctx.fillRect(photoBoxX, photoBoxY, photoWidth, photoHeight);
    ctx.strokeStyle = "#D4AF37";
    ctx.lineWidth = 4;
    ctx.strokeRect(photoBoxX, photoBoxY, photoWidth, photoHeight);

    if (member.photo_url) {
      const userImg = new window.Image();
      if (!member.photo_url.startsWith("data:")) {
        userImg.crossOrigin = "anonymous";
      }
      userImg.src = member.photo_url;
      await new Promise((res) => {
        userImg.onload = res;
        userImg.onerror = res;
      });
      if (userImg.complete && userImg.naturalWidth > 0) {
        ctx.drawImage(userImg, photoBoxX, photoBoxY, photoWidth, photoHeight);
      }
    } else {
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 20px sans-serif";
      ctx.fillText("PHOTO", photoBoxX + 55, photoBoxY + 115);
    }

    // 5. Member Details Fields
    const textStartX = 260;

    ctx.fillStyle = "#94a3b8";
    ctx.font = "13px sans-serif";
    ctx.fillText("NOM & PRÉNOM", textStartX, 185);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 28px sans-serif";
    ctx.fillText(`${member.last_name.toUpperCase()} ${member.first_name}`, textStartX, 220);

    ctx.fillStyle = "#94a3b8";
    ctx.font = "13px sans-serif";
    ctx.fillText("MATRICULE OFFICIEL", textStartX, 260);
    ctx.fillStyle = "#D4AF37";
    ctx.font = "bold 26px monospace";
    ctx.fillText(member.membership_id, textStartX, 292);

    ctx.fillStyle = "#94a3b8";
    ctx.font = "13px sans-serif";
    ctx.fillText("UNIVERSITÉ & PAYS", textStartX, 332);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 20px sans-serif";
    ctx.fillText(`${member.university} • ${member.country}`, textStartX, 360);

    ctx.fillStyle = "#94a3b8";
    ctx.font = "13px sans-serif";
    ctx.fillText("FILIÈRE / DOMAINE D'EXCELLENCE", textStartX, 400);
    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 19px sans-serif";
    ctx.fillText(member.field_of_study, textStartX, 428);

    // 6. QR Code
    const qrBoxX = 810;
    const qrBoxY = 175;
    const qrSize = 180;

    if (qrCodeDataUrl) {
      const qrImg = new window.Image();
      qrImg.src = qrCodeDataUrl;
      await new Promise((res) => {
        qrImg.onload = res;
        qrImg.onerror = res;
      });
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(qrBoxX - 8, qrBoxY - 8, qrSize + 16, qrSize + 16);
      ctx.drawImage(qrImg, qrBoxX, qrBoxY, qrSize, qrSize);
      ctx.fillStyle = "#D4AF37";
      ctx.font = "bold 12px sans-serif";
      ctx.fillText("SCAN D'AUTHENTICITÉ", qrBoxX + 10, qrBoxY + qrSize + 25);
    }

    // 7. Card Footer
    ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
    ctx.fillRect(24, 560, width - 48, 76);
    ctx.strokeStyle = "rgba(212, 175, 55, 0.2)";
    ctx.strokeRect(24, 560, width - 48, 76);

    const isExpired = new Date(member.expires_at).getTime() < Date.now();
    if (member.status === "revoked") {
      ctx.fillStyle = "#f43f5e";
      ctx.font = "bold 15px sans-serif";
      ctx.fillText("● STATUT : CARTE RÉVOQUÉE (EXCLU)", 50, 605);
    } else if (isExpired) {
      ctx.fillStyle = "#f59e0b";
      ctx.font = "bold 15px sans-serif";
      ctx.fillText("● STATUT : CARTE EXPIRÉE (À RENOUVELER)", 50, 605);
    } else if (member.status === "pending") {
      ctx.fillStyle = "#fbbf24";
      ctx.font = "bold 15px sans-serif";
      ctx.fillText("● STATUT : ADHÉSION EN ATTENTE (5 000 F)", 50, 605);
    } else {
      ctx.fillStyle = "#10b981";
      ctx.font = "bold 15px sans-serif";
      ctx.fillText("● STATUT : MEMBRE ACTIF VALIDE", 50, 605);
    }

    ctx.fillStyle = "#94a3b8";
    ctx.font = "13px sans-serif";
    const expDate = new Date(member.expires_at).toLocaleDateString("fr-FR");
    ctx.fillText(`VALIDE JUSQU'AU : ${expDate}`, 380, 605);

    ctx.fillStyle = "#D4AF37";
    ctx.font = "13px sans-serif";
    ctx.fillText("VÉRIFIABLE SUR EEA-AFRIQUE.ORG/VERIFY", 670, 605);

    return canvas;
  };

  // 1. Download as Official CR80 PDF (85.6mm x 54mm)
  const handleDownloadPDF = async () => {
    if (!member) return;
    setDownloadingPdf(true);

    try {
      const canvas = await generateCanvas();
      if (!canvas) throw new Error("Échec de création du canvas.");

      const imgData = canvas.toDataURL("image/png");

      // Dimensions standard carte plastique ISO/IEC 7810 ID-1 : 85.6mm x 54mm
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: [85.6, 54],
      });

      pdf.addImage(imgData, "PNG", 0, 0, 85.6, 54);
      pdf.save(`Carte_Officielle_EEA_${member.last_name}_${member.first_name}.pdf`);

      setSuccessNotice("Badge officiel téléchargé avec succès au format PDF !");
      setTimeout(() => setSuccessNotice(null), 5000);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la création du fichier PDF.");
    } finally {
      setDownloadingPdf(false);
    }
  };

  // 2. Download as High-Def PNG Image
  const handleDownloadPNG = async () => {
    if (!member) return;
    setDownloadingPng(true);

    try {
      const canvas = await generateCanvas();
      if (!canvas) throw new Error("Échec de création du canvas.");

      const dataUrl = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `Carte_Officielle_EEA_${member.last_name}_${member.first_name}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setSuccessNotice("Badge officiel téléchargé avec succès au format PNG HD !");
      setTimeout(() => setSuccessNotice(null), 5000);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la génération de l'image.");
    } finally {
      setDownloadingPng(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!member) {
    return null;
  }

  // Visual Card JSX Representation
  const renderVisualCard = () => (
    <div
      ref={cardElementRef}
      className="w-full max-w-2xl min-h-[220px] sm:min-h-0 sm:aspect-[1.586/1] rounded-2xl bg-gradient-to-br from-[#0F224A] via-[#091733] to-[#060e1d] border-2 border-[#D4AF37] p-3.5 sm:p-6 shadow-2xl shadow-black/80 flex flex-col justify-between relative overflow-hidden text-white"
    >
      {/* Watermark Logo */}
      <div className="absolute right-4 bottom-4 opacity-5 pointer-events-none w-52 h-52">
        <Image src="/logo-eea.jpg" alt="Logo" fill className="object-contain" />
      </div>

      {/* Card Header */}
      <div className="relative z-10 flex items-center justify-between border-b border-white/10 pb-2.5">
        <div className="flex items-center gap-2.5">
          <div className="relative w-9 h-9 sm:w-12 sm:h-12 rounded-full overflow-hidden border-2 border-[#D4AF37] shadow-sm shrink-0">
            <Image src="/logo-eea.jpg" alt="Logo EEA" fill className="object-cover" />
          </div>
          <div>
            <h3 className="font-extrabold text-[11px] sm:text-sm tracking-wide text-white">
              ÉTUDIANT ENTREPRENEURIAT AFRIQUE
            </h3>
            <p className="text-[8.5px] sm:text-[10px] text-[#D4AF37] font-semibold tracking-wider uppercase">
              Carte Officielle de Membre • Né en 2008 • Démarrage officiel 2026
            </p>
          </div>
        </div>

        <span className="px-2 py-0.5 rounded bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[8.5px] sm:text-[10px] font-bold text-[#D4AF37] uppercase tracking-wider shrink-0">
          Membre Actif
        </span>
      </div>

      {/* Card Body */}
      <div className="relative z-10 grid grid-cols-12 gap-2.5 sm:gap-3 items-center my-auto py-1">
        {/* Photo */}
        <div className="col-span-4 sm:col-span-3 flex justify-center">
          <div className="relative w-16 h-20 sm:w-24 sm:h-30 rounded-xl overflow-hidden border-2 border-[#D4AF37] bg-[#040914] shadow-md shrink-0">
            {member.photo_url ? (
              <Image
                src={member.photo_url}
                alt="Photo officielle de membre"
                fill
                unoptimized
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-[#0B3C8A]/50 text-white">
                <span className="text-xs font-bold">EEA</span>
              </div>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="col-span-8 sm:col-span-6 space-y-1 pl-1">
          <div>
            <span className="text-[8px] sm:text-[9px] uppercase tracking-wider text-slate-400 font-semibold block">
              Nom & Prénom
            </span>
            <div className="text-sm sm:text-base font-extrabold text-white truncate">
              {member.last_name.toUpperCase()} {member.first_name}
            </div>
          </div>

          <div>
            <span className="text-[8px] sm:text-[9px] uppercase tracking-wider text-slate-400 font-semibold block">
              Matricule Officiel
            </span>
            <div className="text-xs sm:text-sm font-bold font-mono text-[#D4AF37]">
              {member.membership_id}
            </div>
          </div>

          <div>
            <span className="text-[8px] sm:text-[9px] uppercase tracking-wider text-slate-400 font-semibold block">
              Université / École & Pays
            </span>
            <div className="text-[10px] sm:text-[11px] text-slate-200 font-medium truncate">
              {member.university} • {member.country}
            </div>
          </div>

          <div>
            <span className="text-[8px] sm:text-[9px] uppercase tracking-wider text-slate-400 font-semibold block">
              Filière d&apos;Études
            </span>
            <div className="text-[10px] sm:text-[11px] text-[#38BDF8] font-medium truncate">
              {member.field_of_study}
            </div>
          </div>
        </div>

        {/* QR Code */}
        <div className="hidden sm:flex col-span-3 flex-col items-center justify-center border-l border-white/10 pl-2">
          {qrCodeDataUrl ? (
            <div className="p-1 bg-white rounded-lg shadow-md mb-1">
              <Image
                src={qrCodeDataUrl}
                alt="QR Code de Vérification"
                width={74}
                height={74}
                className="object-contain"
              />
            </div>
          ) : (
            <QrIcon className="w-14 h-14 text-slate-400" />
          )}
          <span className="text-[7.5px] text-[#D4AF37] uppercase font-bold tracking-tighter text-center">
            Vérifier Authenticité
          </span>
        </div>
      </div>

      {/* Card Footer */}
      <div className="relative z-10 flex items-center justify-between border-t border-white/10 pt-1.5 text-[9px] sm:text-[10px] text-slate-300">
        <div className="flex items-center gap-1.5">
          {member.status === "revoked" ? (
            <>
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span className="text-rose-400 font-bold">RÉVOQUÉ / ÉJECTÉ</span>
            </>
          ) : currentTime > 0 && new Date(member.expires_at).getTime() < currentTime ? (
            <>
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-amber-400 font-bold">EXPIRÉ (À RENOUVELER)</span>
            </>
          ) : member.status === "pending" ? (
            <>
              <span className="w-2 h-2 rounded-full bg-yellow-400" />
              <span className="text-yellow-400 font-bold">EN ATTENTE 5 000 F</span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-400 font-semibold">Membre Actif Certifié</span>
            </>
          )}
        </div>

        <div className="text-slate-400 text-[8.5px] sm:text-[9px]">
          Expire le : {new Date(member.expires_at).toLocaleDateString("fr-FR")}
        </div>

        <div className="flex items-center gap-1 text-[#D4AF37]">
          <ShieldCheck className="w-3 h-3" />
          <span className="font-medium text-[9px]">Agréé par l&apos;État • 2026</span>
        </div>
      </div>
    </div>
  );

  // Action Buttons Toolbar
  const renderActions = () => (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <button
        type="button"
        onClick={handleDownloadPDF}
        disabled={downloadingPdf}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-[#060d1d] bg-gradient-to-r from-[#D4AF37] via-[#F3DE8A] to-[#D4AF37] hover:brightness-110 shadow-lg shadow-[#D4AF37]/20 transition-all text-xs sm:text-sm disabled:opacity-50 cursor-pointer"
      >
        <FileDown className="w-4 h-4 text-[#060d1d]" />
        <span>{downloadingPdf ? "Génération PDF..." : "Télécharger la Carte en PDF (.pdf)"}</span>
      </button>

      <button
        type="button"
        onClick={handleDownloadPNG}
        disabled={downloadingPng}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/20 transition-all text-xs sm:text-sm disabled:opacity-50 cursor-pointer"
      >
        <Download className="w-4 h-4 text-slate-300" />
        <span>{downloadingPng ? "Export PNG..." : "Télécharger Image HD (.png)"}</span>
      </button>

      <button
        type="button"
        onClick={handlePrint}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-slate-300 bg-white/5 hover:bg-white/10 border border-white/10 transition-colors text-xs sm:text-sm cursor-pointer"
      >
        <Printer className="w-4 h-4 text-slate-400" />
        <span>Imprimer</span>
      </button>

      <Link
        href={`/verify/${member.qr_code_token}`}
        target="_blank"
        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-semibold text-[#38BDF8] bg-sky-950/40 hover:bg-sky-900/50 border border-sky-500/30 transition-colors text-xs sm:text-sm"
      >
        <ExternalLink className="w-3.5 h-3.5" />
        <span>Vérification publique</span>
      </Link>
    </div>
  );

  // If in COMPACT mode (e.g. inside Admin Modal or Email preview)
  if (compact) {
    return (
      <div className="space-y-4">
        {successNotice && (
          <div className="p-3 rounded-lg bg-emerald-950/70 border border-emerald-500/50 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-2 animate-in fade-in">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>{successNotice}</span>
          </div>
        )}

        <div className="flex justify-center">{renderVisualCard()}</div>

        {renderActions()}
      </div>
    );
  }

  // Standalone mode with full headers (if needed on dedicated page)
  return (
    <section id="badge-render" className="py-12 bg-[#060d1d] border-t border-white/10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-xl mx-auto mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0F224A] border border-[#D4AF37]/30 text-xs font-semibold text-[#D4AF37] uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Délivrance Immédiate</span>
          </div>
          <h2 className="text-2xl font-extrabold text-white">
            Votre Carte Officielle de Membre
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Certifiée par l&apos;Étudiant Entrepreneuriat Afrique (Initié en 2008 à l&apos;UCAD • Démarrage officiel 2026).
          </p>
        </div>

        {successNotice && (
          <div className="p-3 rounded-lg bg-emerald-950/70 border border-emerald-500/50 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-2 mb-6 animate-in fade-in">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>{successNotice}</span>
          </div>
        )}

        <div className="flex justify-center mb-6">{renderVisualCard()}</div>

        {renderActions()}
      </div>
    </section>
  );
}
