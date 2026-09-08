"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  GraduationCap,
  CreditCard,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Smartphone,
  Sparkles,
  Building,
  Globe,
  Copy,
  Check,
  Clock,
} from "lucide-react";
import PhotoCapture from "./PhotoCapture";
import WhatsAppIcon from "./WhatsAppIcon";
import { supabase, Member } from "@/lib/supabase";

interface RegistrationFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country: string;
  university: string;
  fieldOfStudy: string;
  photoUrl: string | null;
  paymentMethod: "wave" | "orange_money" | "card" | "whatsapp";
  paymentReference: string;
}

const COUNTRIES = [
  "Sénégal",
  "Côte d'Ivoire",
  "Cameroun",
  "Bénin",
  "Togo",
  "Mali",
  "Burkina Faso",
  "Guinée",
  "RD Congo",
  "Gabon",
  "Congo",
  "Niger",
  "Tchad",
  "Ghana",
  "Nigeria",
  "Diaspora - Europe (France, Belgique, etc.)",
  "Diaspora - Amériques (Canada, USA)",
  "Autre pays d'Afrique",
];

export default function RegistrationTunnel({
  onMemberRegistered,
}: {
  onMemberRegistered?: (member: Member) => void;
}) {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [loading, setLoading] = useState(false);
  const [createdMember, setCreatedMember] = useState<Member | null>(null);
  const [copiedNumber, setCopiedNumber] = useState(false);

  const [formData, setFormData] = useState<RegistrationFormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    country: "Sénégal",
    university: "",
    fieldOfStudy: "",
    photoUrl: null,
    paymentMethod: "wave",
    paymentReference: "",
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateStep1 = () => {
    const errs: { [key: string]: string } = {};
    if (!formData.firstName.trim()) errs.firstName = "Le prénom est obligatoire.";
    if (!formData.lastName.trim()) errs.lastName = "Le nom est obligatoire.";
    if (!formData.email.trim() || !formData.email.includes("@"))
      errs.email = "Une adresse email valide est requise.";
    if (!formData.phone.trim())
      errs.phone = "Le numéro de téléphone est obligatoire.";
    if (!formData.university.trim())
      errs.university = "L'université ou école est requise.";
    if (!formData.fieldOfStudy.trim())
      errs.fieldOfStudy = "La filière d'études est requise.";

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateStep1()) {
      setCurrentStep(2);
    }
  };

  const handlePhotoCaptured = (photoDataUrl: string) => {
    setFormData((prev) => ({ ...prev, photoUrl: photoDataUrl }));
  };

  const handleProceedToPayment = () => {
    if (!formData.photoUrl) {
      alert("Veuillez valider une photo d'identité officielle avant de continuer.");
      return;
    }
    setCurrentStep(3);
  };

  const handleProcessPayment = async () => {
    setLoading(true);

    try {
      // 1. Generate unique membership numbers
      const countryCode = formData.country.slice(0, 2).toUpperCase();
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      const membershipId = `EEA-2026-${countryCode}-${randomNum}`;
      const qrToken = `eea_token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const newMember: Member = {
        id: crypto.randomUUID ? crypto.randomUUID() : `id-${Date.now()}`,
        membership_id: membershipId,
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        country: formData.country,
        university: formData.university.trim(),
        field_of_study: formData.fieldOfStudy.trim(),
        photo_url: formData.photoUrl,
        qr_code_token: qrToken,
        status: "pending", // Status is pending until manual transfer is confirmed by admin
        payment_method: formData.paymentMethod,
        payment_reference: formData.paymentReference.trim() || null,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      };

      // 2. Upload photo to Supabase Storage if present, or fallback gracefully
      let publicPhotoUrl = newMember.photo_url;
      if (newMember.photo_url && newMember.photo_url.startsWith("data:")) {
        try {
          const base64Data = newMember.photo_url.split(",")[1];
          if (base64Data) {
            const byteCharacters = atob(base64Data);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: "image/jpeg" });
            const fileName = `${newMember.membership_id}-${Date.now()}.jpg`;

            const { data: uploadData, error: uploadError } = await supabase.storage
              .from("member-photos")
              .upload(fileName, blob, { contentType: "image/jpeg", upsert: true });

            if (!uploadError && uploadData) {
              const { data: publicUrlData } = supabase.storage
                .from("member-photos")
                .getPublicUrl(fileName);
              if (publicUrlData?.publicUrl) {
                publicPhotoUrl = publicUrlData.publicUrl;
                newMember.photo_url = publicPhotoUrl;
              }
            }
          }
        } catch (uploadErr) {
          console.warn("Notice: Stockage local de la photo utilisé:", uploadErr);
        }
      }

      // 3. Insert to Supabase if configured, or gracefully fallback locally
      try {
        const { error } = await supabase.from("members").insert({
          membership_id: newMember.membership_id,
          first_name: newMember.first_name,
          last_name: newMember.last_name,
          email: newMember.email,
          phone: newMember.phone,
          country: newMember.country,
          university: newMember.university,
          field_of_study: newMember.field_of_study,
          photo_url: publicPhotoUrl,
          qr_code_token: newMember.qr_code_token,
          status: "pending",
        });

        if (error) {
          console.warn("Notice: Enregistrement local utilisé :", error.message);
        }
      } catch (err) {
        console.warn("Mode local actif :", err);
      }

      // Save to localStorage so state persists across reloads
      try {
        const existing = JSON.parse(localStorage.getItem("eea_members") || "[]");
        existing.unshift(newMember);
        localStorage.setItem("eea_members", JSON.stringify(existing));
        localStorage.setItem("eea_current_member", JSON.stringify(newMember));
      } catch {
        // ignore storage errors
      }

      setCreatedMember(newMember);
      if (onMemberRegistered) {
        onMemberRegistered(newMember);
      }
      setCurrentStep(4);
    } catch (err) {
      console.error(err);
      alert("Une erreur est survenue lors de l'enregistrement. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="adhesion" className="relative py-24 sm:py-32 bg-[#060d1d]/25 backdrop-blur-[1px] overflow-hidden border-t border-white/5">
      {/* Background Soft Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#0B3C8A]/15 rounded-full blur-[160px] pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Section Title */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0F224A] border border-[#D4AF37]/30 text-xs font-semibold text-[#D4AF37] uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Formulaire d&apos;Adhésion Officielle</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Rejoignez l&apos;Étudiant Entrepreneuriat Afrique
          </h2>

          <p className="mt-3 text-sm sm:text-base text-slate-300 font-normal">
            Cotisation annuelle de <strong>5 000 FCFA</strong>. Remplissez vos informations et demandez votre carte officielle de membre au format PDF.
          </p>
        </div>

        {/* Step Progression Bar */}
        <div className="mb-8 grid grid-cols-4 gap-1.5 sm:gap-4 text-center">
          {[
            { step: 1, title: "1. Profil" },
            { step: 2, title: "2. Photo" },
            { step: 3, title: "3. Paiement" },
            { step: 4, title: "4. Validé" },
          ].map((s) => (
            <div
              key={s.step}
              className={`py-2 px-1 sm:p-2.5 rounded-xl border transition-all ${
                currentStep === s.step
                  ? "bg-[#0B3C8A]/40 border-[#D4AF37] text-white font-bold shadow-md shadow-[#D4AF37]/10"
                  : currentStep > s.step
                  ? "bg-emerald-950/30 border-emerald-500/40 text-emerald-400 font-medium"
                  : "bg-white/[0.02] border-white/5 text-slate-500 font-normal"
              }`}
            >
              <span className="text-[10px] sm:text-xs font-semibold truncate block">
                {s.title}
              </span>
            </div>
          ))}
        </div>

        {/* Step Container */}
        <div className="rounded-2xl bg-[#091733] border border-white/10 p-4 sm:p-10 shadow-2xl">
          <AnimatePresence mode="wait">
            {/* STEP 1: PROFIL INFORMATIONS */}
            {currentStep === 1 && (
              <motion.form
                key="step1"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                onSubmit={handleStep1Submit}
                className="space-y-6"
              >
                <div className="border-b border-white/10 pb-4">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <User className="w-5 h-5 text-[#D4AF37]" />
                    <span>Identité de l&apos;Étudiant Entrepreneur</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Ces informations figureront sur votre carte officielle de membre.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                      Prénom <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) =>
                        setFormData({ ...formData, firstName: e.target.value })
                      }
                      placeholder="Ex: Cheikh, Aïssatou, Jean-David"
                      className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-[#D4AF37] text-base sm:text-sm"
                    />
                    {errors.firstName && (
                      <p className="text-xs text-rose-400 mt-1">{errors.firstName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                      Nom de Famille <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) =>
                        setFormData({ ...formData, lastName: e.target.value })
                      }
                      placeholder="Ex: DIOP, KOUASSI, TOURE"
                      className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-[#D4AF37] text-base sm:text-sm"
                    />
                    {errors.lastName && (
                      <p className="text-xs text-rose-400 mt-1">{errors.lastName}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                      Adresse Email Académique ou Personnelle <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      placeholder="etudiant@ucad.edu.sn ou nom@gmail.com"
                      className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-[#D4AF37] text-base sm:text-sm"
                    />
                    {errors.email && (
                      <p className="text-xs text-rose-400 mt-1">{errors.email}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                      Téléphone / WhatsApp <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      placeholder="+221 78 542 53 45"
                      className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-[#D4AF37] text-base sm:text-sm"
                    />
                    {errors.phone && (
                      <p className="text-xs text-rose-400 mt-1">{errors.phone}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                      Pays d&apos;Études / Résidence <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={formData.country}
                        onChange={(e) =>
                          setFormData({ ...formData, country: e.target.value })
                        }
                        className="w-full px-4 py-3 rounded-xl bg-[#060d1d] border border-white/10 text-white focus:outline-none focus:border-[#D4AF37] text-base sm:text-sm appearance-none"
                      >
                        {COUNTRIES.map((c) => (
                          <option key={c} value={c} className="bg-[#060d1d]">
                            {c}
                          </option>
                        ))}
                      </select>
                      <Globe className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                      Université / Grande École <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.university}
                        onChange={(e) =>
                          setFormData({ ...formData, university: e.target.value })
                        }
                        placeholder="Ex: UCAD Dakar, INPHB Yamoussoukro, etc."
                        className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-[#D4AF37] text-base sm:text-sm"
                      />
                      <Building className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
                    </div>
                    {errors.university && (
                      <p className="text-xs text-rose-400 mt-1">
                        {errors.university}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Filière d&apos;Études & Domaine d&apos;Excellence <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.fieldOfStudy}
                      onChange={(e) =>
                        setFormData({ ...formData, fieldOfStudy: e.target.value })
                      }
                      placeholder="Ex: Agronomie & Agro-business, Informatique & IA, Économie, etc."
                      className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-[#D4AF37] text-base sm:text-sm"
                    />
                    <GraduationCap className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
                  </div>
                  {errors.fieldOfStudy && (
                    <p className="text-xs text-rose-400 mt-1">
                      {errors.fieldOfStudy}
                    </p>
                  )}
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-bold text-[#060d1d] bg-gradient-to-r from-[#D4AF37] via-[#F3DE8A] to-[#D4AF37] hover:brightness-105 transition-all shadow-lg shadow-[#D4AF37]/20 text-sm cursor-pointer"
                  >
                    <span>Continuer vers la Photo</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.form>
            )}

            {/* STEP 2: PHOTO CAPTURE & CROP */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-6"
              >
                <div className="border-b border-white/10 pb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      Photo d&apos;Identité Officielle
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Cette photo apparaîtra sur votre carte de membre numérique et physique.
                    </p>
                  </div>
                  <span className="text-xs px-3 py-1 rounded-full bg-[#0F224A] text-[#D4AF37] border border-[#D4AF37]/30 font-semibold">
                    Norme 4x4
                  </span>
                </div>

                <PhotoCapture
                  onPhotoCaptured={handlePhotoCaptured}
                  onPhotoSelected={handlePhotoCaptured}
                />

                <div className="pt-6 border-t border-white/10 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Retour au profil</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleProceedToPayment}
                    className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-[#060d1d] bg-gradient-to-r from-[#D4AF37] via-[#F3DE8A] to-[#D4AF37] hover:brightness-105 transition-all shadow-lg shadow-[#D4AF37]/20 text-sm cursor-pointer"
                  >
                    <span>Continuer vers le Paiement</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: PAYMENT & MANUAL TRANSFER INSTRUCTIONS */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-6"
              >
                <div className="border-b border-white/10 pb-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-[#D4AF37]" />
                      <span>Cotisation Annuelle • 5 000 FCFA</span>
                    </h3>
                    <span className="text-xs px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                      Agrément d&apos;État
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-300 font-normal mt-1">
                    Effectuez votre transfert de <strong>5 000 FCFA</strong> vers notre compte officiel pour déclencher la validation et l&apos;envoi de votre carte officielle au format PDF.
                  </p>
                </div>

                {/* OFFICIAL RECIPIENT BOX */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-[#0B2A4A]/80 via-[#091733] to-[#060d1d] border-2 border-[#D4AF37]/50 shadow-xl space-y-4">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-5 h-5 text-[#D4AF37]" />
                      <span className="font-bold text-white text-sm">
                        Coordonnées du Compte Récepteur Officiel
                      </span>
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Wave & Orange Money
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10">
                      <span className="text-slate-400 block text-[11px]">Numéro Récepteur Officiel :</span>
                      <div className="flex items-center justify-between mt-1">
                        <span className="font-mono text-base font-extrabold text-[#D4AF37]">
                          +221 78 542 53 45
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText("+221785425345");
                            setCopiedNumber(true);
                            setTimeout(() => setCopiedNumber(false), 3000);
                          }}
                          className="px-2.5 py-1 rounded bg-[#D4AF37]/20 hover:bg-[#D4AF37]/30 text-[#D4AF37] font-semibold text-[10px] flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          {copiedNumber ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedNumber ? "Copié !" : "Copier"}</span>
                        </button>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10">
                      <span className="text-slate-400 block text-[11px]">Bénéficiaire du Compte :</span>
                      <span className="font-bold text-white text-sm block mt-1">
                        Étudiant Entrepreneuriat Afrique (EEA)
                      </span>
                    </div>
                  </div>

                  {/* Channel Selection */}
                  <div className="pt-2">
                    <label className="block text-xs font-semibold text-slate-300 mb-2">
                      Moyen utilisé pour le transfert :
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-2.5">
                      {[
                        { id: "wave", label: "Wave", desc: "0% frais" },
                        { id: "orange_money", label: "Orange Money", desc: "Sénégal / UEMOA" },
                        { id: "whatsapp", label: "Autre / Diaspora", desc: "Western Union / Virement" },
                      ].map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setFormData({ ...formData, paymentMethod: p.id as "wave" | "orange_money" | "whatsapp" })}
                          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                            formData.paymentMethod === p.id
                              ? "bg-[#0B3C8A]/40 border-[#D4AF37] text-white"
                              : "bg-white/[0.02] border-white/10 text-slate-400 hover:border-white/20"
                          }`}
                        >
                          <div className="font-bold text-xs sm:text-sm">{p.label}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">{p.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Input for transaction ref or sender number */}
                  <div className="pt-2">
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Numéro expéditeur ou Référence de votre transfert (Optionnel mais recommandé) :
                    </label>
                    <input
                      type="text"
                      value={formData.paymentReference}
                      onChange={(e) =>
                        setFormData({ ...formData, paymentReference: e.target.value })
                      }
                      placeholder="Ex: 77 123 45 67 ou Réf. Wave SN-2026-..."
                      className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/15 text-white placeholder-slate-500 focus:outline-none focus:border-[#D4AF37] text-base sm:text-xs font-mono"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Cette information permet à l&apos;administrateur de valider instantanément votre versement de 5 000 FCFA dans le back-office.
                    </p>
                  </div>
                </div>

                <div className="pt-6 border-t border-white/10 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Retour à la photo</span>
                  </button>

                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleProcessPayment}
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-[#060d1d] bg-gradient-to-r from-[#D4AF37] via-[#F3DE8A] to-[#D4AF37] hover:brightness-105 transition-all shadow-lg shadow-[#D4AF37]/20 text-sm disabled:opacity-50 cursor-pointer text-center"
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#060d1d]" />
                    <span>
                      {loading ? "Enregistrement en cours..." : "J'ai envoyé mes 5 000 FCFA • Valider mon Inscription"}
                    </span>
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 4: SUCCESS & ATTESTATION D'ENREGISTREMENT */}
            {currentStep === 4 && createdMember && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6 text-center"
              >
                <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-500/40 mx-auto flex items-center justify-center text-amber-400">
                  <Clock className="w-8 h-8" />
                </div>

                <div>
                  <span className="text-xs uppercase tracking-wider font-bold text-[#D4AF37]">
                    Dossier Enregistré • En Attente de Validation du Paiement
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
                    Merci pour votre adhésion, {createdMember.first_name} !
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-lg mx-auto">
                    Votre demande a été transmise au Secrétariat Général. Dès réception de votre transfert de <strong>5 000 FCFA</strong> sur le <strong>+221 78 542 53 45</strong>, votre carte officielle de membre au format PDF vous sera envoyée.
                  </p>
                </div>

                {/* Recap Box */}
                <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 max-w-lg mx-auto text-left text-xs space-y-2.5">
                  <div className="flex justify-between items-center pb-2 border-b border-white/10">
                    <span className="text-slate-400">Matricule Officiel Attribué :</span>
                    <span className="font-mono font-bold text-[#D4AF37] text-sm">
                      {createdMember.membership_id}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Statut du Dossier :</span>
                    <span className="text-amber-400 font-bold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                      EN ATTENTE DE CONFIRMATION (5 000 FCFA)
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Compte Récepteur :</span>
                    <span className="text-white font-mono font-medium">+221 78 542 53 45 (EEA)</span>
                  </div>
                  {createdMember.payment_reference && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Référence Transmise :</span>
                      <span className="text-sky-300 font-mono font-medium">{createdMember.payment_reference}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Email de Réception :</span>
                    <span className="text-white font-semibold">{createdMember.email}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Format de Délivrance :</span>
                    <span className="text-[#D4AF37] font-semibold">Carte PDF Officielle envoyée par Email ou WhatsApp</span>
                  </div>
                </div>

                {/* WhatsApp Direct Confirmation Button */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <a
                    href={`https://wa.me/221785425345?text=${encodeURIComponent(
                      `Bonjour Secrétariat EEA, je viens d'enregistrer mon adhésion sur la plateforme :\n\n- Nom : ${createdMember.last_name} ${createdMember.first_name}\n- Matricule : ${createdMember.membership_id}\n- Téléphone : ${createdMember.phone}\n- Université : ${createdMember.university}\n- Référence Transfert (5 000 FCFA) : ${createdMember.payment_reference || "Transfert effectué vers 78 542 53 45"}\n\nMerci de valider mon paiement et de m'envoyer ma carte officielle de membre au format PDF.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-white bg-[#25D366] hover:bg-[#20bd5a] transition-all text-xs shadow-lg shadow-[#25D366]/20"
                  >
                    <WhatsAppIcon className="w-4 h-4" />
                    <span>Notifier le Secrétariat sur WhatsApp (+221 78 542 53 45)</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => {
                      setCurrentStep(1);
                      setCreatedMember(null);
                    }}
                    className="px-4 py-3.5 rounded-xl text-xs text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 cursor-pointer"
                  >
                    Nouvelle inscription
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
