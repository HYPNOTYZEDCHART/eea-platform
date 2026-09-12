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
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [downloadingPng, setDownloadingPng] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const cardElementRef = useRef<HTMLDivElement>(null);

  const member: Member = initialMember || localMember || defaultDemoMember;

  // Fallback to localStorage if no prop provided
  useEffect(() => {
    const timer = setTimeout(() => {
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
    }, 0);
    return () => clearTimeout(timer);
  }, [initialMember]);

  // Generate dynamic QR Code for official verification URL
  useEffect(() => {
    if (!member) return;

    const baseUrl =
      typeof window !== "undefined"
        ? window.location.origin
        : (process.env.NEXT_PUBLIC_APP_URL || "https://eea-platform.vercel.app");
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

// Fonctions utilitaires de dessin Canvas haute fidélité (équivalent 300 DPI)
function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawShieldCheck(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = "rgba(212, 175, 55, 0.15)";
  ctx.lineWidth = 2;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  // Forme de bouclier
  ctx.beginPath();
  ctx.moveTo(x + w / 2, y);
  ctx.lineTo(x + w, y + h * 0.25);
  ctx.quadraticCurveTo(x + w, y + h * 0.72, x + w / 2, y + h);
  ctx.quadraticCurveTo(x, y + h * 0.72, x, y + h * 0.25);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Coche de validation à l'intérieur
  ctx.beginPath();
  ctx.moveTo(x + w * 0.28, y + h * 0.48);
  ctx.lineTo(x + w * 0.46, y + h * 0.66);
  ctx.lineTo(x + w * 0.74, y + h * 0.34);
  ctx.stroke();

  ctx.restore();
}

function fitText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let truncated = text;
  while (truncated.length > 0 && ctx.measureText(truncated + "...").width > maxWidth) {
    truncated = truncated.slice(0, -1);
  }
  return truncated + "...";
}

function loadImageSafe(
  src: string,
  isCross = false
): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(null);
      return;
    }
    const img = new window.Image();
    if (isCross) img.crossOrigin = "anonymous";
    const timer = setTimeout(() => resolve(null), 5000);
    img.onload = () => {
      clearTimeout(timer);
      resolve(img);
    };
    img.onerror = () => {
      clearTimeout(timer);
      resolve(null);
    };
    img.src = src;
  });
}

  // Reusable Canvas Generator (High-Resolution 300 DPI equivalent)
  // Reproduit fidèlement et au pixel près le design de la carte visuelle avec les données réelles du membre
  const generateCanvas = async (): Promise<HTMLCanvasElement | null> => {
    if (!member) return null;

    const canvas = document.createElement("canvas");
    // Dimensions au format international CR80 (ratio 1.586 - 85.6mm x 54mm)
    const width = 1050;
    const height = 662;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // Coins arrondis de la carte externe
    const cardX = 4;
    const cardY = 4;
    const cardW = width - 8;
    const cardH = height - 8;
    const cardR = 26;

    // Découpe le rendu selon les coins arrondis
    ctx.save();
    drawRoundedRect(ctx, cardX, cardY, cardW, cardH, cardR);
    ctx.clip();

    // 1. Fond en dégradé bleu marine institutionnel
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, "#0F224A");
    bgGrad.addColorStop(0.5, "#091733");
    bgGrad.addColorStop(1, "#060e1d");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // 2. Chargement asynchrone sécurisé des images
    const logoImg = await loadImageSafe("/logo-eea.jpg");

    let qrData = qrCodeDataUrl;
    if (!qrData && member.qr_code_token) {
      const baseUrl =
        typeof window !== "undefined"
          ? window.location.origin
          : (process.env.NEXT_PUBLIC_APP_URL || "https://eea-platform.vercel.app");
      const verifyUrl = `${baseUrl}/verify/${member.qr_code_token}`;
      try {
        qrData = await QRCode.toDataURL(verifyUrl, {
          width: 360,
          margin: 1,
          color: { dark: "#060d1d", light: "#ffffff" },
        });
      } catch (e) {
        console.error(e);
      }
    }
    const qrImgObj = qrData ? await loadImageSafe(qrData) : null;

    let userImg: HTMLImageElement | null = null;
    if (member.photo_url) {
      userImg = await loadImageSafe(member.photo_url, !member.photo_url.startsWith("data:"));
    }

    // 3. Filigrane officiel (Watermark logo en bas à droite)
    if (logoImg) {
      ctx.save();
      ctx.globalAlpha = 0.055;
      const wmSize = 360;
      const wmX = width - wmSize - 25;
      const wmY = height - wmSize - 20;
      ctx.drawImage(logoImg, wmX, wmY, wmSize, wmSize);
      ctx.restore();
    }

    // 4. Ligne séparatrice d'en-tête
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(38, 108);
    ctx.lineTo(width - 38, 108);
    ctx.stroke();

    // 5. En-tête : Logo circulaire avec anneau doré
    const logoCenterX = 76;
    const logoCenterY = 62;
    const logoRadius = 32;

    if (logoImg) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(logoCenterX, logoCenterY, logoRadius, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(
        logoImg,
        logoCenterX - logoRadius,
        logoCenterY - logoRadius,
        logoRadius * 2,
        logoRadius * 2
      );
      ctx.restore();
    }
    ctx.strokeStyle = "#D4AF37";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(logoCenterX, logoCenterY, logoRadius, 0, Math.PI * 2);
    ctx.stroke();

    // 6. En-tête : Titre institutionnel & Sous-titre
    ctx.fillStyle = "#ffffff";
    ctx.font = "800 23px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText("ÉTUDIANT ENTREPRENEURIAT AFRIQUE", 125, 50);

    ctx.fillStyle = "#D4AF37";
    ctx.font = "700 12.5px system-ui, -apple-system, sans-serif";
    ctx.fillText("CARTE OFFICIELLE DE MEMBRE • NÉ EN 2008 • DÉMARRAGE OFFICIEL 2026", 125, 76);

    // 7. En-tête : Badge pilule supérieur droit (MEMBRE ACTIF)
    const pillW = 145;
    const pillH = 32;
    const pillX = width - 38 - pillW;
    const pillY = 46;

    ctx.fillStyle = "rgba(212, 175, 55, 0.15)";
    drawRoundedRect(ctx, pillX, pillY, pillW, pillH, 7);
    ctx.fill();

    ctx.strokeStyle = "rgba(212, 175, 55, 0.35)";
    ctx.lineWidth = 1.5;
    drawRoundedRect(ctx, pillX, pillY, pillW, pillH, 7);
    ctx.stroke();

    ctx.fillStyle =
      member.status === "revoked"
        ? "#f43f5e"
        : member.status === "pending"
        ? "#fbbf24"
        : "#D4AF37";
    ctx.font = "800 12px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const pillLabel =
      member.status === "revoked"
        ? "RÉVOQUÉ"
        : member.status === "pending"
        ? "EN ATTENTE"
        : "MEMBRE ACTIF";
    ctx.fillText(pillLabel, pillX + pillW / 2, pillY + pillH / 2);

    // 8. Corps : Cadre Photo (Gauche)
    const photoX = 48;
    const photoY = 152;
    const photoW = 195;
    const photoH = 260;
    const photoR = 14;

    ctx.save();
    drawRoundedRect(ctx, photoX, photoY, photoW, photoH, photoR);
    ctx.clip();

    if (userImg && userImg.naturalWidth > 0) {
      const imgRatio = userImg.naturalWidth / userImg.naturalHeight;
      const boxRatio = photoW / photoH;
      let sx = 0,
        sy = 0,
        sw = userImg.naturalWidth,
        sh = userImg.naturalHeight;
      if (imgRatio > boxRatio) {
        sw = userImg.naturalHeight * boxRatio;
        sx = (userImg.naturalWidth - sw) / 2;
      } else {
        sh = userImg.naturalWidth / boxRatio;
        sy = (userImg.naturalHeight - sh) / 2;
      }
      ctx.drawImage(userImg, sx, sy, sw, sh, photoX, photoY, photoW, photoH);
    } else {
      ctx.fillStyle = "rgba(11, 60, 138, 0.55)";
      ctx.fillRect(photoX, photoY, photoW, photoH);

      ctx.fillStyle = "#ffffff";
      ctx.font = "800 28px system-ui, -apple-system, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("EEA", photoX + photoW / 2, photoY + photoH / 2 - 12);

      ctx.fillStyle = "#cbd5e1";
      ctx.font = "600 15px system-ui, -apple-system, sans-serif";
      ctx.fillText("Photo 4x4", photoX + photoW / 2, photoY + photoH / 2 + 18);
    }
    ctx.restore();

    ctx.strokeStyle = "#D4AF37";
    ctx.lineWidth = 2.5;
    drawRoundedRect(ctx, photoX, photoY, photoW, photoH, photoR);
    ctx.stroke();

    // 9. Corps : Détails & Informations du Membre (Centre)
    const detailsX = 278;
    const maxDetailWidth = 465;
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";

    // Nom & Prénom
    ctx.fillStyle = "#94a3b8";
    ctx.font = "700 12px system-ui, -apple-system, sans-serif";
    ctx.fillText("NOM & PRÉNOM", detailsX, 178);

    ctx.fillStyle = "#ffffff";
    ctx.font = "800 26px system-ui, -apple-system, sans-serif";
    const fullName = fitText(
      ctx,
      `${member.last_name.toUpperCase()} ${member.first_name}`,
      maxDetailWidth
    );
    ctx.fillText(fullName, detailsX, 212);

    // Matricule Officiel
    ctx.fillStyle = "#94a3b8";
    ctx.font = "700 12px system-ui, -apple-system, sans-serif";
    ctx.fillText("MATRICULE OFFICIEL", detailsX, 256);

    ctx.fillStyle = "#D4AF37";
    ctx.font = "800 23px monospace, 'Courier New', system-ui";
    ctx.fillText(member.membership_id, detailsX, 288);

    // Université / École & Pays
    ctx.fillStyle = "#94a3b8";
    ctx.font = "700 12px system-ui, -apple-system, sans-serif";
    ctx.fillText("UNIVERSITÉ / ÉCOLE & PAYS", detailsX, 332);

    ctx.fillStyle = "#e2e8f0";
    ctx.font = "600 17px system-ui, -apple-system, sans-serif";
    const univText = fitText(
      ctx,
      `${member.university} • ${member.country}`,
      maxDetailWidth
    );
    ctx.fillText(univText, detailsX, 360);

    // Filière d'Études
    ctx.fillStyle = "#94a3b8";
    ctx.font = "700 12px system-ui, -apple-system, sans-serif";
    ctx.fillText("FILIÈRE D'ÉTUDES", detailsX, 404);

    ctx.fillStyle = "#38bdf8";
    ctx.font = "600 17px system-ui, -apple-system, sans-serif";
    const fieldText = fitText(ctx, member.field_of_study, maxDetailWidth);
    ctx.fillText(fieldText, detailsX, 432);

    // 10. Ligne verticale de séparation
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(768, 145);
    ctx.lineTo(768, 475);
    ctx.stroke();

    // 11. Corps : QR Code de Vérification (Droite)
    const qrContainerX = 804;
    const qrContainerY = 175;
    const qrContainerW = 168;
    const qrContainerH = 168;
    const qrContainerR = 14;

    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 4;
    ctx.fillStyle = "#ffffff";
    drawRoundedRect(ctx, qrContainerX, qrContainerY, qrContainerW, qrContainerH, qrContainerR);
    ctx.fill();
    ctx.restore();

    if (qrImgObj) {
      const qrPadding = 9;
      ctx.drawImage(
        qrImgObj,
        qrContainerX + qrPadding,
        qrContainerY + qrPadding,
        qrContainerW - qrPadding * 2,
        qrContainerH - qrPadding * 2
      );
    }

    ctx.fillStyle = "#D4AF37";
    ctx.font = "800 12px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      "SCAN DE VÉRIFICATION",
      qrContainerX + qrContainerW / 2,
      qrContainerY + qrContainerH + 24
    );

    // 12. Ligne séparatrice de pied de page
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(38, 540);
    ctx.lineTo(width - 38, 540);
    ctx.stroke();

    // 13. Pied de page : Statut, Validité et Certification
    const footerY = 590;
    const dotCenterX = 56;
    const dotCenterY = footerY;

    if (member.status === "revoked") {
      ctx.fillStyle = "#f43f5e";
      ctx.beginPath();
      ctx.arc(dotCenterX, dotCenterY, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#f43f5e";
      ctx.font = "800 15px system-ui, -apple-system, sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText("RÉVOQUÉ / ÉJECTÉ", dotCenterX + 16, footerY);
    } else if (member.status === "pending") {
      ctx.fillStyle = "#fbbf24";
      ctx.beginPath();
      ctx.arc(dotCenterX, dotCenterY, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#fbbf24";
      ctx.font = "800 15px system-ui, -apple-system, sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText("EN ATTENTE 3 000 F", dotCenterX + 16, footerY);
    } else {
      ctx.fillStyle = "rgba(16, 185, 129, 0.35)";
      ctx.beginPath();
      ctx.arc(dotCenterX, dotCenterY, 9, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#34d399";
      ctx.beginPath();
      ctx.arc(dotCenterX, dotCenterY, 5.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#34d399";
      ctx.font = "700 15px system-ui, -apple-system, sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText("Membre Actif Permanent", dotCenterX + 16, footerY);
    }

    ctx.fillStyle = "#94a3b8";
    ctx.font = "600 15px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Validité : Permanente (À vie)", width / 2, footerY);

    const rightMarginX = width - 38;
    const shieldW = 18;
    const shieldH = 20;
    const textCert = "Certification Officielle";

    ctx.font = "700 15px system-ui, -apple-system, sans-serif";
    const certTextWidth = ctx.measureText(textCert).width;
    const totalRightWidth = shieldW + 8 + certTextWidth;
    const shieldX = rightMarginX - totalRightWidth;
    const shieldY = footerY - shieldH / 2;

    drawShieldCheck(ctx, shieldX, shieldY, shieldW, shieldH, "#D4AF37");

    ctx.fillStyle = "#D4AF37";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(textCert, shieldX + shieldW + 8, footerY);

    // 14. Cadre doré prestigieux externe
    ctx.restore(); // Restaure le découpage des coins arrondis
    ctx.strokeStyle = "#D4AF37";
    ctx.lineWidth = 3.5;
    drawRoundedRect(ctx, cardX, cardY, cardW, cardH, cardR);
    ctx.stroke();

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
      className="w-full max-w-2xl aspect-[1.586/1] rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#0F224A] via-[#091733] to-[#060e1d] border-2 border-[#D4AF37] p-3 sm:p-6 shadow-2xl shadow-black/80 flex flex-col justify-between relative overflow-hidden text-white select-none"
    >
      {/* Watermark Logo */}
      <div className="absolute right-4 bottom-4 opacity-5 pointer-events-none w-36 h-36 sm:w-52 sm:h-52">
        <Image src="/logo-eea.jpg" alt="Logo" fill className="object-contain" />
      </div>

      {/* Card Header */}
      <div className="relative z-10 flex items-center justify-between border-b border-white/10 pb-2 sm:pb-2.5 gap-2">
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <div className="relative w-8 h-8 sm:w-12 sm:h-12 rounded-full overflow-hidden border-2 border-[#D4AF37] shadow-sm shrink-0">
            <Image src="/logo-eea.jpg" alt="Logo EEA" fill className="object-cover" />
          </div>
          <div className="min-w-0">
            <h3 className="font-extrabold text-[10px] sm:text-sm tracking-wide text-white truncate">
              ÉTUDIANT ENTREPRENEURIAT AFRIQUE
            </h3>
            <p className="text-[7px] sm:text-[10px] text-[#D4AF37] font-semibold tracking-wider uppercase truncate">
              Carte Officielle de Membre • Né en 2008 • Démarrage officiel 2026
            </p>
          </div>
        </div>

        <span className="px-1.5 sm:px-2 py-0.5 rounded bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[7px] sm:text-[10px] font-bold text-[#D4AF37] uppercase tracking-wider shrink-0 text-center leading-tight">
          Membre Actif
        </span>
      </div>

      {/* Card Body */}
      <div className="relative z-10 grid grid-cols-12 gap-1.5 sm:gap-3 items-center my-auto py-1 sm:py-2">
        {/* Photo */}
        <div className="col-span-3 flex justify-center">
          <div className="relative w-14 h-18 sm:w-24 sm:h-30 rounded-lg sm:rounded-xl overflow-hidden border-2 border-[#D4AF37] bg-[#040914] shadow-md shrink-0">
            {member.photo_url ? (
              <Image
                src={member.photo_url}
                alt="Photo officielle de membre"
                fill
                unoptimized
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-[#0B3C8A]/50 text-white p-1">
                <span className="text-[9px] sm:text-xs font-bold">EEA</span>
                <span className="text-[6.5px] sm:text-[8px] text-slate-300">Photo 4x4</span>
              </div>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="col-span-6 space-y-0.5 sm:space-y-1 pl-1 min-w-0">
          <div>
            <span className="text-[6.5px] sm:text-[9px] uppercase tracking-wider text-slate-400 font-semibold block leading-tight">
              Nom & Prénom
            </span>
            <div className="text-[10px] sm:text-base font-extrabold text-white truncate leading-tight">
              {member.last_name.toUpperCase()} {member.first_name}
            </div>
          </div>

          <div>
            <span className="text-[6.5px] sm:text-[9px] uppercase tracking-wider text-slate-400 font-semibold block leading-tight">
              Matricule Officiel
            </span>
            <div className="text-[8px] sm:text-sm font-bold font-mono text-[#D4AF37] truncate leading-tight">
              {member.membership_id}
            </div>
          </div>

          <div>
            <span className="text-[6.5px] sm:text-[9px] uppercase tracking-wider text-slate-400 font-semibold block leading-tight">
              Université / École & Pays
            </span>
            <div className="text-[8px] sm:text-[11px] text-slate-200 font-medium truncate leading-tight">
              {member.university} • {member.country}
            </div>
          </div>

          <div>
            <span className="text-[6.5px] sm:text-[9px] uppercase tracking-wider text-slate-400 font-semibold block leading-tight">
              Filière d&apos;Études
            </span>
            <div className="text-[8px] sm:text-[11px] text-[#38BDF8] font-medium truncate leading-tight">
              {member.field_of_study}
            </div>
          </div>
        </div>

        {/* QR Code */}
        <div className="col-span-3 flex flex-col items-center justify-center border-l border-white/10 pl-1 sm:pl-2">
          {qrCodeDataUrl ? (
            <div className="p-1 sm:p-1.5 bg-white rounded-md sm:rounded-lg shadow-md mb-0.5 sm:mb-1 shrink-0">
              <Image
                src={qrCodeDataUrl}
                alt="QR Code de Vérification"
                width={74}
                height={74}
                className="w-8 h-8 sm:w-16 sm:h-16 object-contain"
              />
            </div>
          ) : (
            <QrIcon className="w-8 h-8 sm:w-14 sm:h-14 text-slate-400" />
          )}
          <span className="text-[6.5px] sm:text-[8px] text-[#D4AF37] uppercase font-bold tracking-tighter text-center leading-tight">
            Scan de Vérification
          </span>
        </div>
      </div>

      {/* Card Footer */}
      <div className="relative z-10 flex items-center justify-between border-t border-white/10 pt-1 sm:pt-2 text-[7.5px] sm:text-[10px] text-slate-300">
        <div className="flex items-center gap-1 sm:gap-1.5">
          {member.status === "revoked" ? (
            <>
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-rose-500" />
              <span className="text-rose-400 font-bold text-[7px] sm:text-[9px]">RÉVOQUÉ / ÉJECTÉ</span>
            </>
          ) : member.status === "pending" ? (
            <>
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-yellow-400" />
              <span className="text-yellow-400 font-bold text-[7px] sm:text-[9px]">EN ATTENTE 3 000 F</span>
            </>
          ) : (
            <>
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-400 font-semibold text-[7px] sm:text-[9px]">Membre Actif Permanent</span>
            </>
          )}
        </div>

        <div className="text-slate-400 text-[7px] sm:text-[9px]">
          Validité : Permanente (À vie)
        </div>

        <div className="flex items-center gap-1 text-[#D4AF37]">
          <ShieldCheck className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
          <span className="font-medium text-[7px] sm:text-[9px]">Certification Officielle</span>
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
