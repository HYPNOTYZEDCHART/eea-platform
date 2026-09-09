"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ShieldCheck,
  Users,
  Coins,
  TrendingUp,
  Building,
  Search,
  Download,
  CheckCircle,
  Clock,
  Lock,
  ArrowLeft,
  Eye,
  LogOut,
  RefreshCw,
  Mail,
  FileText,
  X,
  AlertTriangle,
  Ban,
  UserX,
  UserCheck,
  Trash2,
  Bell,
  RotateCw,
  EyeOff,
  KeyRound,
  ShieldAlert,
  CheckCircle2,
} from "lucide-react";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import {
  supabase,
  Member,
  MemberStatus,
  getEffectiveMemberStatus,
  getDaysUntilExpiry,
} from "@/lib/supabase";
import MemberCardBadge from "@/components/MemberCardBadge";

const INITIAL_MEMBERS_SEEDED: Member[] = [
  {
    id: "mem-1",
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
    created_at: "2026-02-15T10:30:00Z",
    expires_at: "2027-02-15T10:30:00Z",
  },
  {
    id: "mem-2",
    membership_id: "EEA-2026-CI-0129",
    first_name: "Amina",
    last_name: "DIALLO",
    email: "amina.diallo@inphb.ci",
    phone: "+225 07 11 22 33 44",
    country: "Côte d'Ivoire",
    university: "INP-HB Yamoussoukro",
    field_of_study: "Agronomie Tropicale & Filières Cacao",
    photo_url: null,
    qr_code_token: "eea_token_demo_0129",
    status: "active",
    created_at: "2025-01-10T14:20:00Z",
    expires_at: "2026-01-10T14:20:00Z", // Expired card for testing renewal flow
  },
  {
    id: "mem-3",
    membership_id: "EEA-2026-CM-0318",
    first_name: "Boris",
    last_name: "TCHOUA",
    email: "b.tchoua@univ-yaounde1.cm",
    phone: "+237 69 00 11 22",
    country: "Cameroun",
    university: "Université de Yaoundé I",
    field_of_study: "Intelligence Artificielle & Télécoms",
    photo_url: null,
    qr_code_token: "eea_token_demo_0318",
    status: "pending",
    payment_method: "Orange Money",
    payment_reference: "OM-237-9921",
    created_at: "2026-03-04T09:15:00Z",
    expires_at: "2027-03-04T09:15:00Z",
  },
  {
    id: "mem-4",
    membership_id: "EEA-2026-FR-0487",
    first_name: "Fatou",
    last_name: "NDIAYE",
    email: "fatou.ndiaye@polytechnique.edu",
    phone: "+33 6 12 34 56 78",
    country: "Diaspora - Europe (France)",
    university: "École Polytechnique (Paris)",
    field_of_study: "Finance & Investissement Agricole",
    photo_url: null,
    qr_code_token: "eea_token_demo_0487",
    status: "active",
    created_at: "2026-03-05T16:45:00Z",
    expires_at: "2027-03-05T16:45:00Z",
  },
];

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Authentification Haute Sécurité 2-Facteurs (2FA / OTP)
  const [loginStep, setLoginStep] = useState<"credentials" | "otp">("credentials");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [emailMasked, setEmailMasked] = useState("");
  const [otpTimer, setOtpTimer] = useState(300); // 5 minutes
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);
  const [resendingOtp, setResendingOtp] = useState(false);
  const [honeypot, setHoneypot] = useState("");

  const [members, setMembers] = useState<Member[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "pending" | "expired" | "revoked"
  >("all");
  const [loading, setLoading] = useState(false);
  const [authSubmitting, setAuthSubmitting] = useState(false);

  // Modals & Action States
  const [selectedMemberForBadge, setSelectedMemberForBadge] = useState<Member | null>(null);
  const [memberToEject, setMemberToEject] = useState<Member | null>(null);
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);
  const [renewalNoticeData, setRenewalNoticeData] = useState<{
    member: Member;
    preview: {
      subject: string;
      plainText: string;
      whatsappUrl: string;
    };
  } | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Secure logout with cookie invalidation
  const handleLogout = useCallback(async () => {
    try {
      await fetch("/api/admin/auth", { method: "DELETE" });
    } catch {
      // ignore
    }
    setIsAuthenticated(false);
    sessionStorage.removeItem("eea_admin_auth");
  }, []);

  // Helper pour générer l'URL exacte de vérification selon le domaine en direct
  const getVerifyUrl = (token: string) => {
    const origin =
      typeof window !== "undefined"
        ? window.location.origin
        : process.env.NEXT_PUBLIC_APP_URL || "https://eea-platform.vercel.app";
    return `${origin}/verify/${token}`;
  };

  // Compte à rebours du code OTP (5 minutes)
  useEffect(() => {
    if (loginStep !== "otp" || otpTimer <= 0) return;
    const interval = setInterval(() => {
      setOtpTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [loginStep, otpTimer]);

  // Déconnexion automatique après inactivité (15 minutes)
  useEffect(() => {
    if (!isAuthenticated) return;
    let timeoutId: NodeJS.Timeout;

    const resetInactivity = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        handleLogout();
        setToastMessage("Session fermée après 15 minutes d'inactivité par mesure de sécurité.");
      }, 15 * 60 * 1000);
    };

    const events = ["mousedown", "mousemove", "keydown", "scroll", "touchstart"];
    events.forEach((evt) => window.addEventListener(evt, resetInactivity));
    resetInactivity();

    return () => {
      clearTimeout(timeoutId);
      events.forEach((evt) => window.removeEventListener(evt, resetInactivity));
    };
  }, [isAuthenticated, handleLogout]);

  // Check saved session via secure server-side cookie
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/admin/auth");
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated) {
            setIsAuthenticated(true);
          }
        }
      } catch {
        // network or server error
      }
    };
    checkAuth();
  }, []);

  // Fetch members from Supabase (server route with service role + client fallback + local storage)
  const loadMembers = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    let loadedFromDb: Member[] | null = null;

    // 1. Primary: Server-side API route /api/admin/members (bypasses RLS, always up-to-date)
    try {
      const res = await fetch("/api/admin/members");
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.members)) {
          loadedFromDb = json.members as Member[];
        }
      }
    } catch {
      // fallback
    }

    // 2. Secondary fallback: direct client Supabase query
    if (!loadedFromDb) {
      try {
        const { data, error } = await supabase
          .from("members")
          .select("*")
          .order("created_at", { ascending: false });
        if (data && !error) {
          loadedFromDb = data as Member[];
        }
      } catch (err) {
        console.warn("Notice: Fallback local actif:", err);
      }
    }

    // 3. Merge database records with seeded demo members & local storage
    const map = new Map<string, Member>();

    // Add seeded demo members as base
    INITIAL_MEMBERS_SEEDED.forEach((m) => map.set(m.membership_id, m));

    // Override with localStorage edits if any
    try {
      const localStored = JSON.parse(localStorage.getItem("eea_members") || "[]");
      if (Array.isArray(localStored)) {
        localStored.forEach((lm: Member) => map.set(lm.membership_id, lm));
      }
    } catch {
      // ignore
    }

    // Override with real database records (highest priority)
    if (loadedFromDb && loadedFromDb.length > 0) {
      loadedFromDb.forEach((dbm) => map.set(dbm.membership_id, dbm));
    }

    const combinedList = Array.from(map.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    setMembers(combinedList);
    if (!isSilent) setLoading(false);
  }, []);

  // Initial load and automatic background polling every 10 seconds for real-time synchronization
  useEffect(() => {
    if (!isAuthenticated) return;
    void loadMembers(false);

    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        void loadMembers(true);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [isAuthenticated, loadMembers]);

  // Étape 1 : Vérification des identifiants (Email + Mot de passe)
  const handleStep1Login = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminEmail.trim() || !adminPassword.trim()) {
      setAuthError("Veuillez saisir votre email et votre mot de passe administrateur.");
      return;
    }

    setAuthSubmitting(true);
    setAuthError(null);

    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "login",
          email: adminEmail,
          password: adminPassword,
          website_url: honeypot, // Piège anti-bot honeypot
        }),
      });

      const data = await res.json();

      if (res.ok && data.success && data.step === "otp_required") {
        setLoginStep("otp");
        setEmailMasked(data.emailMasked || adminEmail);
        setDevOtpHint(data.devOtp || null);
        setOtpTimer(300);
        setAuthError(null);
      } else {
        setAuthError(data.error || "Email ou mot de passe administrateur incorrect.");
      }
    } catch {
      setAuthError("Erreur de connexion avec le serveur.");
    } finally {
      setAuthSubmitting(false);
    }
  };

  // Étape 2 : Validation du code OTP à 6 chiffres
  const handleStep2VerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim() || otpCode.length < 6) {
      setAuthError("Veuillez saisir le code complet à 6 chiffres reçu par email.");
      return;
    }

    setAuthSubmitting(true);
    setAuthError(null);

    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "verify_otp",
          otp: otpCode,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success && data.authenticated) {
        setIsAuthenticated(true);
        setLoginStep("credentials");
        setOtpCode("");
        setAdminPassword("");
        setAuthError(null);
        setToastMessage(data.message || "Authentification 2FA réussie. Bienvenue dans l'espace sécurisé !");
        setTimeout(() => setToastMessage(null), 6000);
      } else {
        setAuthError(data.error || "Code de sécurité à 6 chiffres incorrect ou expiré.");
      }
    } catch {
      setAuthError("Erreur de validation du code avec le serveur.");
    } finally {
      setAuthSubmitting(false);
    }
  };

  // Renvoi d'un nouveau code OTP
  const handleResendOtp = async () => {
    setResendingOtp(true);
    setAuthError(null);
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "resend_otp" }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setOtpTimer(300);
        setDevOtpHint(data.devOtp || null);
        setToastMessage(`Nouveau code 2FA transmis à ${emailMasked} !`);
        setTimeout(() => setToastMessage(null), 6000);
      } else {
        setAuthError(data.error || "Impossible de renvoyer le code.");
      }
    } catch {
      setAuthError("Erreur réseau lors du renvoi.");
    } finally {
      setResendingOtp(false);
    }
  };

  // Helper de sécurisation contre l'injection de formules Excel/Calc (OWASP CSV Formula Injection)
  const sanitizeCSVCell = (value: unknown): string => {
    if (value === null || value === undefined) return '""';
    let str = String(value).trim();
    if (/^[=+\-@\t\r]/.test(str)) {
      str = "'" + str;
    }
    return `"${str.replace(/"/g, '""')}"`;
  };

  // Export members list as CSV (Secured)
  const handleExportCSV = () => {
    const headers = [
      "Matricule",
      "Nom",
      "Prénom",
      "Email",
      "Téléphone",
      "Pays",
      "Université",
      "Filière",
      "Statut_Brut",
      "Statut_Effectif",
      "Date_Adhésion",
      "Date_Expiration",
      "Jours_Restants",
    ];

    const rows = members.map((m) => {
      const effStatus = getEffectiveMemberStatus(m);
      const days = getDaysUntilExpiry(m.expires_at);
      return [
        sanitizeCSVCell(m.membership_id),
        sanitizeCSVCell(m.last_name),
        sanitizeCSVCell(m.first_name),
        sanitizeCSVCell(m.email),
        sanitizeCSVCell(m.phone),
        sanitizeCSVCell(m.country),
        sanitizeCSVCell(m.university),
        sanitizeCSVCell(m.field_of_study),
        sanitizeCSVCell(m.status),
        sanitizeCSVCell(effStatus),
        sanitizeCSVCell(new Date(m.created_at).toLocaleDateString("fr-FR")),
        sanitizeCSVCell(new Date(m.expires_at).toLocaleDateString("fr-FR")),
        sanitizeCSVCell(days),
      ];
    });

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(";"), ...rows.map((e) => e.join(";"))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `EEA_Membres_Officiels_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Email dispatch helper for active member PDF badge (via Resend API with fallback)
  const handleSendEmail = async (member: Member) => {
    try {
      const res = await fetch("/api/admin/send-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          membership_id: member.membership_id,
          first_name: member.first_name,
          last_name: member.last_name,
          email: member.email,
          university: member.university,
          field_of_study: member.field_of_study,
          qr_code_token: member.qr_code_token,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setToastMessage(data.message || `Carte officielle transmise à ${member.email} !`);
        if (data.emailSimulated) {
          const subject = encodeURIComponent(
            `Votre Carte Officielle de Membre EEA (${member.membership_id})`
          );
          const body = encodeURIComponent(
            `Bonjour ${member.first_name} ${member.last_name},\n\nLe Secrétariat Général de l'EEA a le plaisir de vous transmettre votre carte officielle de membre au format PDF.\n\n- Matricule Officiel : ${member.membership_id}\n- Université : ${member.university}\n- Filière : ${member.field_of_study}\n- Vérification en ligne de votre QR Code : ${getVerifyUrl(member.qr_code_token)}\n\nFélicitations pour votre engagement dans la souveraineté économique et entrepreneuriale de l'Afrique.\n\nSecrétariat Général EEA\nBibliothèque Centrale UCAD, Dakar, Sénégal\nWhatsApp : +221 78 542 53 45`
          );
          window.open(`mailto:${member.email}?subject=${subject}&body=${body}`, "_blank");
        }
      } else {
        throw new Error(data.error || "Erreur");
      }
    } catch {
      const subject = encodeURIComponent(
        `Votre Carte Officielle de Membre EEA (${member.membership_id}) - Format PDF`
      );
      const body = encodeURIComponent(
        `Bonjour ${member.first_name} ${member.last_name},\n\nLe Secrétariat Général de l'Étudiant Entrepreneuriat Afrique (EEA) a le plaisir de vous transmettre votre carte officielle de membre au format PDF.\n\n- Matricule Officiel : ${member.membership_id}\n- Université : ${member.university}\n- Filière : ${member.field_of_study}\n- Vérification en ligne de votre QR Code : ${getVerifyUrl(member.qr_code_token)}\n\nFélicitations pour votre engagement dans la souveraineté économique et entrepreneuriale de l'Afrique.\n\nSecrétariat Général EEA\nBibliothèque Centrale UCAD, Dakar, Sénégal\nWhatsApp : +221 78 542 53 45`
      );
      window.open(`mailto:${member.email}?subject=${subject}&body=${body}`, "_blank");
      setToastMessage(`Carte officielle préparée et transmise par email à ${member.email} !`);
    }

    setTimeout(() => setToastMessage(null), 6000);
  };

  // 1. Validate pending payment (5,000 FCFA) and activate member
  const handleValidatePayment = async (member: Member) => {
    const updatedList = members.map((m) =>
      m.membership_id === member.membership_id ? { ...m, status: "active" as const } : m
    );
    setMembers(updatedList);

    try {
      localStorage.setItem("eea_members", JSON.stringify(updatedList));
      const currentStored = localStorage.getItem("eea_current_member");
      if (currentStored) {
        const parsed = JSON.parse(currentStored);
        if (parsed.membership_id === member.membership_id) {
          parsed.status = "active";
          localStorage.setItem("eea_current_member", JSON.stringify(parsed));
        }
      }
    } catch {
      // ignore
    }

    try {
      await fetch("/api/admin/members/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          membership_id: member.membership_id,
          status: "active",
        }),
      });
    } catch {
      try {
        await supabase
          .from("members")
          .update({ status: "active" })
          .eq("membership_id", member.membership_id);
      } catch (err) {
        console.warn("Mise à jour locale réussie:", err);
      }
    }

    setToastMessage(
      `Paiement de 5 000 FCFA validé pour ${member.last_name.toUpperCase()} ${member.first_name} ! La carte officielle est active.`
    );
    setTimeout(() => setToastMessage(null), 6000);
  };

  // 2. Renouvellement Annuel (+1 an) d'un membre expiré ou proche d'échéance
  const handleRenewMembership = async (member: Member) => {
    const currentExpiryTime = new Date(member.expires_at).getTime();
    const baseTime = currentExpiryTime > Date.now() ? currentExpiryTime : Date.now();
    const newExpiresAt = new Date(baseTime + 365 * 24 * 60 * 60 * 1000).toISOString();

    const updatedList = members.map((m) =>
      m.membership_id === member.membership_id
        ? { ...m, status: "active" as const, expires_at: newExpiresAt }
        : m
    );
    setMembers(updatedList);

    try {
      localStorage.setItem("eea_members", JSON.stringify(updatedList));
    } catch {
      // ignore
    }

    try {
      await fetch("/api/admin/members/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          membership_id: member.membership_id,
          status: "active",
          expires_at: newExpiresAt,
        }),
      });
    } catch {
      try {
        await supabase
          .from("members")
          .update({ status: "active", expires_at: newExpiresAt })
          .eq("membership_id", member.membership_id);
      } catch (err) {
        console.warn("Mise à jour locale réussie:", err);
      }
    }

    setToastMessage(
      `Cotisation annuelle validée pour ${member.last_name.toUpperCase()} ${member.first_name} ! Carte renouvelée jusqu'au ${new Date(
        newExpiresAt
      ).toLocaleDateString("fr-FR")}.`
    );
    setTimeout(() => setToastMessage(null), 7000);
  };

  // 3. Éjection / Révocation de membre
  const handleConfirmEject = async () => {
    if (!memberToEject) return;
    const target = memberToEject;

    const updatedList = members.map((m) =>
      m.membership_id === target.membership_id ? { ...m, status: "revoked" as const } : m
    );
    setMembers(updatedList);

    try {
      localStorage.setItem("eea_members", JSON.stringify(updatedList));
      const currentStored = localStorage.getItem("eea_current_member");
      if (currentStored) {
        const parsed = JSON.parse(currentStored);
        if (parsed.membership_id === target.membership_id) {
          parsed.status = "revoked";
          localStorage.setItem("eea_current_member", JSON.stringify(parsed));
        }
      }
    } catch {
      // ignore
    }

    try {
      await fetch("/api/admin/members/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          membership_id: target.membership_id,
          status: "revoked",
        }),
      });
    } catch {
      try {
        await supabase
          .from("members")
          .update({ status: "revoked" })
          .eq("membership_id", target.membership_id);
      } catch (err) {
        console.warn("Mise à jour locale réussie:", err);
      }
    }

    setMemberToEject(null);
    setToastMessage(
      `⚠️ Le membre ${target.last_name.toUpperCase()} ${target.first_name} (${target.membership_id}) a été révoqué / éjecté. Sa carte et son QR code sont immédiatement invalidés.`
    );
    setTimeout(() => setToastMessage(null), 7000);
  };

  // 4. Réintégration d'un membre révoqué
  const handleReintegrateMember = async (member: Member) => {
    const updatedList = members.map((m) =>
      m.membership_id === member.membership_id ? { ...m, status: "active" as const } : m
    );
    setMembers(updatedList);

    try {
      localStorage.setItem("eea_members", JSON.stringify(updatedList));
    } catch {
      // ignore
    }

    try {
      await fetch("/api/admin/members/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          membership_id: member.membership_id,
          status: "active",
        }),
      });
    } catch {
      try {
        await supabase
          .from("members")
          .update({ status: "active" })
          .eq("membership_id", member.membership_id);
      } catch (err) {
        console.warn("Mise à jour locale réussie:", err);
      }
    }

    setToastMessage(
      `Le membre ${member.last_name.toUpperCase()} ${member.first_name} a été réintégré avec succès.`
    );
    setTimeout(() => setToastMessage(null), 6000);
  };

  // 5. Suppression définitive du membre
  const handleConfirmDelete = async () => {
    if (!memberToDelete) return;
    const target = memberToDelete;

    const updatedList = members.filter((m) => m.membership_id !== target.membership_id);
    setMembers(updatedList);

    try {
      localStorage.setItem("eea_members", JSON.stringify(updatedList));
      const currentStored = localStorage.getItem("eea_current_member");
      if (currentStored) {
        const parsed = JSON.parse(currentStored);
        if (parsed.membership_id === target.membership_id) {
          localStorage.removeItem("eea_current_member");
        }
      }
    } catch {
      // ignore
    }

    try {
      await supabase.from("members").delete().eq("membership_id", target.membership_id);
    } catch (err) {
      console.warn("Suppression locale réussie:", err);
    }

    setMemberToDelete(null);
    setToastMessage(
      `Le membre ${target.last_name.toUpperCase()} ${target.first_name} a été supprimé définitivement du registre.`
    );
    setTimeout(() => setToastMessage(null), 6000);
  };

  // 6. Envoi de notification de rappel de renouvellement (Email + WhatsApp)
  const handleNotifyRenewal = async (member: Member) => {
    try {
      const res = await fetch("/api/admin/notify-renewal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          membership_id: member.membership_id,
          first_name: member.first_name,
          last_name: member.last_name,
          email: member.email,
          phone: member.phone,
          expires_at: member.expires_at,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setRenewalNoticeData({
          member,
          preview: data.notification,
        });
      } else {
        // Fallback email client
        const expiryFormatted = new Date(member.expires_at).toLocaleDateString("fr-FR");
        const subject = encodeURIComponent(
          `⚠️ [EEA] Renouvellement Obligatoire de votre Carte de Membre Annuelle - ${member.membership_id}`
        );
        const body = encodeURIComponent(
          `Bonjour ${member.first_name} ${member.last_name},\n\nLa validité statutaire de votre carte de membre arrive à son terme (ou est échue le ${expiryFormatted}).\n\nPour conserver vos droits et la validité de votre carte officielle et QR Code, merci de renouveler votre cotisation annuelle de 5 000 FCFA vers le compte trésorier officiel Wave / Orange Money : +221 78 542 53 45.\n\nSecrétariat Général EEA — UCAD Dakar`
        );
        window.open(`mailto:${member.email}?subject=${subject}&body=${body}`, "_blank");
        setToastMessage(`Avis officiel de renouvellement préparé pour ${member.email} !`);
        setTimeout(() => setToastMessage(null), 6000);
      }
    } catch {
      const subject = encodeURIComponent(
        `⚠️ [EEA] Renouvellement Obligatoire de votre Carte - ${member.membership_id}`
      );
      window.open(`mailto:${member.email}?subject=${subject}`, "_blank");
    }
  };

  // Metrics calculation
  const totalMembers = members.length;
  const activeMembers = members.filter((m) => getEffectiveMemberStatus(m) === "active").length;
  const expiredMembers = members.filter((m) => getEffectiveMemberStatus(m) === "expired").length;
  const pendingMembers = members.filter((m) => m.status === "pending").length;
  const revokedMembers = members.filter((m) => m.status === "revoked").length;
  const expiringSoonMembers = members.filter(
    (m) => getEffectiveMemberStatus(m) === "active" && getDaysUntilExpiry(m.expires_at) <= 30
  ).length;

  const totalFundsCollected = activeMembers * 5000;

  // Filtered members list
  const filteredMembers = members.filter((m) => {
    const matchesSearch =
      m.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.membership_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.university.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.country.toLowerCase().includes(searchQuery.toLowerCase());

    const effStatus = getEffectiveMemberStatus(m);

    let matchesStatus = true;
    if (statusFilter === "active") matchesStatus = effStatus === "active";
    else if (statusFilter === "pending") matchesStatus = m.status === "pending";
    else if (statusFilter === "expired") matchesStatus = effStatus === "expired";
    else if (statusFilter === "revoked") matchesStatus = m.status === "revoked";

    return matchesSearch && matchesStatus;
  });

  // SCREEN 1: LOGIN (Haute Sécurité 2FA / OTP)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#060d1d] flex items-center justify-center p-4 relative overflow-hidden text-white">
        {/* Background Ambient Glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[320px] bg-[#0B3C8A]/20 rounded-full blur-[140px] pointer-events-none" />

        <div className="w-full max-w-md p-7 sm:p-8 rounded-2xl bg-[#091733] border border-[#D4AF37]/40 shadow-2xl space-y-6 relative z-10">
          {/* Header Brand */}
          <div className="text-center space-y-2">
            <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-[#D4AF37] mx-auto mb-2 shadow-lg shadow-[#D4AF37]/20">
              <Image src="/logo-eea.jpg" alt="Logo EEA" fill className="object-cover" />
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0F224A] border border-[#D4AF37]/40 text-[10px] font-bold text-[#D4AF37] uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Accès Haute Sécurité 2FA</span>
            </div>
            <h2 className="text-xl font-black tracking-tight text-white">
              Secrétariat Général EEA
            </h2>
            <p className="text-xs text-slate-400">
              Espace réservé à la Direction de l&apos;Organisation
            </p>
          </div>

          {/* ===================================================================
              ÉTAPE 1 : IDENTIFIANTS (Email + Mot de Passe)
             =================================================================== */}
          {loginStep === "credentials" ? (
            <form onSubmit={handleStep1Login} className="space-y-4">
              {/* Piège Honeypot Anti-Robot (Inaudible et invisible pour les humains) */}
              <input
                type="text"
                name="website_url"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                style={{
                  opacity: 0,
                  position: "absolute",
                  top: 0,
                  left: 0,
                  height: 0,
                  width: 0,
                  zIndex: -1,
                  pointerEvents: "none",
                }}
              />

              {/* Champ Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Identifiant Administrateur
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="Identifiant sécurisé (email)"
                    required
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    data-lpignore="true"
                    data-1p-ignore="true"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.04] border border-white/15 text-white placeholder-slate-500 focus:outline-none focus:border-[#D4AF37] text-xs font-medium"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                </div>
              </div>

              {/* Champ Mot de Passe */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Mot de Passe Sécurisé
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="••••••••••••••••"
                    required
                    autoComplete="new-password"
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    data-lpignore="true"
                    data-1p-ignore="true"
                    className="w-full pl-10 pr-10 py-3 rounded-xl bg-white/[0.04] border border-white/15 text-white placeholder-slate-500 focus:outline-none focus:border-[#D4AF37] text-xs font-medium"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-white cursor-pointer"
                    tabIndex={-1}
                    aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Alerte d'erreur */}
              {authError && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{authError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={authSubmitting}
                className="w-full py-3.5 rounded-xl font-bold text-[#060d1d] bg-gradient-to-r from-[#D4AF37] via-[#F3DE8A] to-[#D4AF37] hover:brightness-105 transition-all text-xs uppercase tracking-wider shadow-lg shadow-[#D4AF37]/20 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                <KeyRound className="w-4 h-4" />
                <span>
                  {authSubmitting ? "Chiffrement & Vérification 2FA..." : "Continuer vers l'Étape 2 (Code 2FA)"}
                </span>
              </button>

              <p className="text-[11px] text-slate-400 text-center leading-relaxed">
                Un code à 6 chiffres sera expédié par voie sécurisée à l&apos;adresse de la direction enregistrée.
              </p>
            </form>
          ) : (
            /* ===================================================================
                ÉTAPE 2 : DOUBLE AUTHENTIFICATION OTP (Code à 6 chiffres)
               =================================================================== */
            <form onSubmit={handleStep2VerifyOtp} className="space-y-4">
              <div className="p-3 rounded-xl bg-[#0F224A]/80 border border-[#D4AF37]/30 text-xs text-slate-200 space-y-1">
                <div className="flex items-center justify-between font-semibold">
                  <span className="flex items-center gap-1.5 text-[#D4AF37]">
                    <Lock className="w-3.5 h-3.5" />
                    Code envoyé à votre adresse
                  </span>
                  <span className="font-mono text-amber-300 text-[11px]">
                    {Math.floor(otpTimer / 60)}:{(otpTimer % 60).toString().padStart(2, "0")}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Consultez la boîte mail de <strong className="text-white">{emailMasked}</strong> et saisissez les 6 chiffres.
                </p>
              </div>

              {/* Champ OTP */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 text-center">
                  Code de Sécurité à 6 chiffres
                </label>
                <input
                  type="text"
                  maxLength={6}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="• • • • • •"
                  required
                  autoFocus
                  autoComplete="one-time-code"
                  className="w-full py-3.5 text-center rounded-xl bg-white/[0.04] border-2 border-[#D4AF37] text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 font-mono text-2xl font-black tracking-[0.4em]"
                />
              </div>

              {/* Alerte d'assistance Développeur Local */}
              {process.env.NODE_ENV === "development" && devOtpHint && (
                <div className="p-2.5 rounded-lg bg-sky-950/60 border border-sky-500/40 text-[11px] text-sky-200 text-center">
                  💡 <strong>Mode Test Local :</strong> Code 2FA généré ={" "}
                  <span className="font-mono font-bold text-[#D4AF37] underline">{devOtpHint}</span>
                </div>
              )}

              {/* Alerte d'erreur */}
              {authError && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{authError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={authSubmitting || otpCode.length < 6}
                className="w-full py-3.5 rounded-xl font-bold text-[#060d1d] bg-gradient-to-r from-[#D4AF37] via-[#F3DE8A] to-[#D4AF37] hover:brightness-105 transition-all text-xs uppercase tracking-wider shadow-lg shadow-[#D4AF37]/20 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>
                  {authSubmitting ? "Validation du code..." : "Valider & Déverrouiller le Registre"}
                </span>
              </button>

              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setLoginStep("credentials");
                    setAuthError(null);
                  }}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  ← Modifier l&apos;email
                </button>

                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendingOtp || otpTimer > 240}
                  className="text-[#D4AF37] hover:underline disabled:opacity-40 cursor-pointer font-semibold"
                >
                  {resendingOtp ? "Renvoi..." : "Renvoyer le code"}
                </button>
              </div>
            </form>
          )}

          {/* Cyber-Security Defense Badge */}
          <div className="pt-4 border-t border-white/10 space-y-3">
            <div className="p-3 rounded-xl bg-[#061024]/90 border border-[#D4AF37]/20 text-[10px] text-slate-400 space-y-1.5 leading-relaxed">
              <div className="flex items-center gap-1.5 font-bold text-[#D4AF37] uppercase tracking-wider">
                <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                <span>Protection Anti-Intrusion & Anti-Brute Force</span>
              </div>
              <ul className="list-disc list-inside text-slate-400 space-y-0.5">
                <li>Verrouillage automatique après 5 tentatives erronées.</li>
                <li>Destruction immédiate du code 2FA après 3 échecs.</li>
                <li>Empreinte matérielle et adresse IP journalisées.</li>
              </ul>
            </div>

            <div className="text-center">
              <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Retourner au site public</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );

  }

  // SCREEN 2: ADMIN DASHBOARD
  return (
    <div className="min-h-screen bg-[#060d1d] text-slate-200 pt-28 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-[#D4AF37]">
              <Image src="/logo-eea.jpg" alt="Logo EEA" fill className="object-cover" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-white tracking-tight">
                  Dashboard Administrateur EEA
                </h1>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                  En ligne
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Gestion des Membres, Révocations, Expirations & Renouvellements Annuels (5 000 FCFA)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-[11px] text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Synchro Cloud Directe (10s)</span>
            </div>

            <button
              onClick={() => void loadMembers(false)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Actualiser</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0B3C8A]/60 hover:bg-[#0B3C8A] border border-[#D4AF37]/40 text-xs font-bold text-[#D4AF37] cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exporter en Excel / CSV</span>
            </button>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-rose-500/20 text-xs font-semibold text-slate-400 hover:text-rose-300 transition-colors cursor-pointer"
              title="Déconnexion"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Global Alert for Expired / Expiring Cards */}
        {(expiredMembers > 0 || expiringSoonMembers > 0) && (
          <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-black text-amber-300 uppercase tracking-wide">
                  Attention : Cartes de membre nécessitant un renouvellement
                </h4>
                <p className="text-xs text-slate-300">
                  {expiredMembers > 0 && (
                    <strong className="text-rose-400">
                      {expiredMembers} carte(s) expirée(s) (caduques sans renouvellement).{" "}
                    </strong>
                  )}
                  {expiringSoonMembers > 0 && (
                    <span>{expiringSoonMembers} carte(s) arrivent à échéance sous 30 jours.</span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setStatusFilter("expired")}
                className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-[#060d1d] font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>Afficher les cartes expirées</span>
              </button>
            </div>
          </div>
        )}

        {/* Top 4 KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Total Membres */}
          <div className="p-5 rounded-2xl bg-[#091733] border border-white/10 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs uppercase font-bold tracking-wider">Membres Enregistrés</span>
              <Users className="w-5 h-5 text-[#D4AF37]" />
            </div>
            <div className="text-3xl font-extrabold text-white">{totalMembers}</div>
            <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              <span>{activeMembers} Cartes actives valides</span>
            </p>
          </div>

          {/* Card 2: Fonds Collectés */}
          <div className="p-5 rounded-2xl bg-[#091733] border border-white/10 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs uppercase font-bold tracking-wider">Cotisations Collectées</span>
              <Coins className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="text-3xl font-extrabold text-white">
              {totalFundsCollected.toLocaleString("fr-FR")} FCFA
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Base : 5 000 FCFA / adhésion & renouvellement
            </p>
          </div>

          {/* Card 3: Expirations & Révocations */}
          <div className="p-5 rounded-2xl bg-[#091733] border border-white/10 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs uppercase font-bold tracking-wider">Expirés / Révoqués</span>
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            </div>
            <div className="text-3xl font-extrabold text-amber-300">{expiredMembers}</div>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
              <UserX className="w-3 h-3 text-rose-400" />
              <span>{revokedMembers} révoqué(s) • {pendingMembers} en attente</span>
            </p>
          </div>

          {/* Card 4: Réseau Continental */}
          <div className="p-5 rounded-2xl bg-[#091733] border border-white/10 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs uppercase font-bold tracking-wider">Territoires Actifs</span>
              <TrendingUp className="w-5 h-5 text-indigo-400" />
            </div>
            <div className="text-3xl font-extrabold text-white">18+ Pays</div>
            <p className="text-xs text-[#D4AF37] mt-1">
              Berceau UCAD Dakar (2008) • 2026
            </p>
          </div>
        </div>

        {/* Member Table Section */}
        <div className="rounded-2xl bg-[#091733] border border-white/10 p-6 shadow-xl space-y-6">
          {/* Table Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher par nom, matricule, université, pays..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/15 text-white placeholder-slate-400 focus:outline-none focus:border-[#D4AF37] text-xs"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Filtrer :</span>
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(
                    e.target.value as "all" | "active" | "pending" | "expired" | "revoked"
                  )
                }
                className="px-3 py-2 rounded-xl bg-[#060d1d] border border-white/15 text-white text-xs focus:outline-none focus:border-[#D4AF37]"
              >
                <option value="all">Tous les statuts ({totalMembers})</option>
                <option value="active">Actifs ({activeMembers})</option>
                <option value="pending">En attente ({pendingMembers})</option>
                <option value="expired">Expirés / À renouveler ({expiredMembers})</option>
                <option value="revoked">Révoqués / Éjectés ({revokedMembers})</option>
              </select>
            </div>
          </div>

          {/* Data Table with Mobile Horizontal Scroll Assurance */}
          <div className="space-y-2">
            <div className="flex sm:hidden items-center justify-between text-[11px] text-slate-400 px-1">
              <span>Faites défiler le tableau vers la droite ➔</span>
              <span className="font-mono text-[10px] text-[#D4AF37]">{filteredMembers.length} membres</span>
            </div>
            <div className="overflow-x-auto rounded-xl border border-white/5 pb-2">
              <table className="w-full text-left text-xs min-w-[880px]">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400 uppercase font-bold tracking-wider">
                  <th className="pb-3 px-3">Étudiant</th>
                  <th className="pb-3 px-3">Matricule Officiel</th>
                  <th className="pb-3 px-3">Université & Pays</th>
                  <th className="pb-3 px-3">Filière</th>
                  <th className="pb-3 px-3">Statut & Validité</th>
                  <th className="pb-3 px-3">Échéance Carte</th>
                  <th className="pb-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredMembers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      Aucun membre trouvé correspondant à la recherche ou au filtre.
                    </td>
                  </tr>
                ) : (
                  filteredMembers.map((m) => {
                    const effStatus = getEffectiveMemberStatus(m);
                    const daysRemaining = getDaysUntilExpiry(m.expires_at);

                    return (
                      <tr key={m.id} className="hover:bg-white/[0.02] transition-colors">
                        {/* Member Photo & Name */}
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-3">
                            <div className="relative w-9 h-9 rounded-full overflow-hidden border border-[#D4AF37]/50 bg-slate-800 shrink-0">
                              {m.photo_url ? (
                                <Image src={m.photo_url} alt={m.first_name} fill unoptimized className="object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center font-bold text-[10px] text-white bg-[#0B3C8A]/40">
                                  {m.first_name[0]}
                                  {m.last_name[0]}
                                </div>
                              )}
                            </div>
                            <div>
                              <span className="font-bold text-white block">
                                {m.last_name.toUpperCase()} {m.first_name}
                              </span>
                              <span className="text-[11px] text-slate-400">{m.email}</span>
                            </div>
                          </div>
                        </td>

                        {/* Matricule */}
                        <td className="py-3.5 px-3 font-mono font-bold text-[#D4AF37]">
                          {m.membership_id}
                        </td>

                        {/* University & Country + Payment Ref */}
                        <td className="py-3.5 px-3">
                          <span className="text-slate-200 font-medium block truncate max-w-xs">
                            {m.university}
                          </span>
                          <span className="text-[10px] text-slate-400">{m.country}</span>
                          {m.payment_reference && (
                            <span className="block text-[10px] text-amber-300 font-mono mt-0.5 font-semibold">
                              Réf : {m.payment_reference}
                            </span>
                          )}
                        </td>

                        {/* Field */}
                        <td className="py-3.5 px-3 text-[#38BDF8] truncate max-w-xs font-medium">
                          {m.field_of_study}
                        </td>

                        {/* Status & Validity Badge */}
                        <td className="py-3.5 px-3">
                          {effStatus === "revoked" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/40 uppercase">
                              <Ban className="w-3 h-3 text-rose-400" />
                              <span>Révoqué / Éjecté</span>
                            </span>
                          ) : effStatus === "expired" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase">
                              <AlertTriangle className="w-3 h-3 text-amber-400" />
                              <span>Expiré (Échu)</span>
                            </span>
                          ) : m.status === "pending" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 uppercase">
                              <Clock className="w-3 h-3 text-amber-400" />
                              <span>En attente 5 000 F</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
                              <CheckCircle className="w-3 h-3 text-emerald-400" />
                              <span>
                                Actif ({daysRemaining > 0 ? `${daysRemaining}j` : "1j"})
                              </span>
                            </span>
                          )}
                        </td>

                        {/* Expiry Date */}
                        <td className="py-3.5 px-3 text-slate-300">
                          <span
                            className={
                              effStatus === "expired"
                                ? "text-amber-400 font-bold underline"
                                : effStatus === "revoked"
                                ? "text-rose-400 line-through"
                                : "text-slate-300"
                            }
                          >
                            {new Date(m.expires_at).toLocaleDateString("fr-FR")}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            {/* Validate Payment Button (if Pending) */}
                            {m.status === "pending" && (
                              <button
                                type="button"
                                onClick={() => handleValidatePayment(m)}
                                className="px-2.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-[#060d1d] font-bold text-[11px] flex items-center gap-1 shadow-sm transition-all cursor-pointer"
                                title="Valider le transfert de 5 000 FCFA"
                              >
                                <CheckCircle className="w-3.5 h-3.5 text-[#060d1d]" />
                                <span>Valider 5 000 F</span>
                              </button>
                            )}

                            {/* Renewal Button (+1 year) */}
                            {(effStatus === "expired" || (effStatus === "active" && daysRemaining <= 60)) && (
                              <button
                                type="button"
                                onClick={() => handleRenewMembership(m)}
                                className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-[#D4AF37] to-[#F3DE8A] hover:brightness-110 text-[#060d1d] font-extrabold text-[11px] flex items-center gap-1 shadow-sm transition-all cursor-pointer"
                                title="Enregistrer le renouvellement de la cotisation annuelle (+1 an)"
                              >
                                <RotateCw className="w-3.5 h-3.5" />
                                <span>Renouveler (1 an)</span>
                              </button>
                            )}

                            {/* Renewal Notification Reminder (Email & WhatsApp) */}
                            {(effStatus === "expired" || daysRemaining <= 30) && (
                              <button
                                type="button"
                                onClick={() => handleNotifyRenewal(m)}
                                className="p-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 border border-amber-500/40 transition-colors flex items-center gap-1 text-[11px] font-bold cursor-pointer"
                                title="Envoyer une notification officielle de rappel de renouvellement"
                              >
                                <Bell className="w-3.5 h-3.5" />
                                <span className="hidden xl:inline">Rappel</span>
                              </button>
                            )}

                            {/* PDF Badge Modal Preview */}
                            <button
                              type="button"
                              onClick={() => setSelectedMemberForBadge(m)}
                              className="p-1.5 rounded-lg bg-[#0B3C8A]/40 hover:bg-[#0B3C8A] text-[#D4AF37] border border-[#D4AF37]/30 transition-colors flex items-center gap-1 text-[11px] font-semibold cursor-pointer"
                              title="Générer & Prévisualiser le Badge PDF"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span className="hidden xl:inline">Badge PDF</span>
                            </button>

                            {/* Email Card Button */}
                            <button
                              type="button"
                              onClick={() => handleSendEmail(m)}
                              className="p-1.5 rounded-lg bg-sky-950/50 hover:bg-sky-900/60 text-sky-300 border border-sky-500/30 transition-colors flex items-center gap-1 text-[11px] font-semibold cursor-pointer"
                              title="Envoyer la Carte PDF par Email"
                            >
                              <Mail className="w-3.5 h-3.5" />
                            </button>

                            {/* WhatsApp Direct */}
                            <a
                              href={`https://wa.me/${m.phone.replace(/[^0-9]/g, "") || "221785425345"}?text=${encodeURIComponent(
                                effStatus === "expired"
                                  ? `Bonjour ${m.first_name} ${m.last_name},\n\nVotre carte annuelle EEA (Matricule : ${m.membership_id}) est arrivée à échéance. Merci de procéder au renouvellement de votre cotisation statutaire (5 000 FCFA) par Wave/Orange Money vers le +221 78 542 53 45 pour maintenir vos accès et votre carte active.\n\nSecrétariat Général EEA`
                                  : effStatus === "active"
                                  ? `Bonjour ${m.first_name} ${m.last_name},\n\nFélicitations ! Votre adhésion à l'Étudiant Entrepreneuriat Afrique (EEA) a bien été validée par le Secrétariat Général.\n\n- Matricule Officiel : ${m.membership_id}\n- Statut : MEMBRE ACTIF VALIDE\n- Vérification en ligne de votre QR Code : ${getVerifyUrl(m.qr_code_token)}\n\nVotre carte officielle de membre au format PDF est prête et disponible.\n\nSecrétariat Général EEA\nBibliothèque Centrale UCAD, Dakar, Sénégal\nWhatsApp : +221 78 542 53 45`
                                  : `Bonjour ${m.first_name} ${m.last_name},\n\nNous avons bien reçu votre demande d'adhésion EEA (Matricule : ${m.membership_id}). Merci de nous confirmer votre transfert de 5 000 FCFA vers le +221 78 542 53 45 pour que nous puissions activer votre statut et vous transmettre votre carte officielle au format PDF.\n\nSecrétariat Général EEA`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg bg-[#25D366]/15 hover:bg-[#25D366]/30 text-[#25D366] transition-colors cursor-pointer"
                              title="Envoyer message officiel sur WhatsApp"
                            >
                              <WhatsAppIcon className="w-3.5 h-3.5" />
                            </a>

                            {/* Public Verify URL */}
                            <Link
                              href={`/verify/${m.qr_code_token}`}
                              target="_blank"
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition-colors"
                              title="Vérifier le QR code en ligne"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </Link>

                            {/* Reintegrate Button (if Revoked) */}
                            {m.status === "revoked" ? (
                              <button
                                type="button"
                                onClick={() => handleReintegrateMember(m)}
                                className="p-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-300 border border-emerald-500/30 transition-colors cursor-pointer"
                                title="Réintégrer ce membre révoqué"
                              >
                                <UserCheck className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              /* Eject / Revoke Button */
                              <button
                                type="button"
                                onClick={() => setMemberToEject(m)}
                                className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/30 text-rose-400 border border-rose-500/20 transition-colors cursor-pointer"
                                title="Éjecter / Révoquer le membre (Invalide la carte et le QR code)"
                              >
                                <Ban className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Permanent Delete Button */}
                            <button
                              type="button"
                              onClick={() => setMemberToDelete(m)}
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-600/30 text-slate-400 hover:text-rose-300 transition-colors cursor-pointer"
                              title="Supprimer définitivement la fiche membre"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-6 left-6 z-50 p-4 rounded-xl bg-[#091733] border border-[#D4AF37] text-white text-xs font-semibold shadow-2xl flex items-center gap-2.5">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* MODAL 1: CONFIRMATION ÉJECTION / RÉVOCATION */}
      {memberToEject && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#091733] border-2 border-rose-500/60 rounded-2xl p-6 sm:p-8 max-w-md w-full space-y-5 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-12 h-12 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center shrink-0">
                <Ban className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-white uppercase tracking-tight">
                  Confirmer l&apos;Éjection du Membre
                </h3>
                <p className="text-xs text-rose-300">Révocation statutaire immédiate</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-2 text-xs">
              <div>
                Membre : <strong className="text-white">{memberToEject.last_name.toUpperCase()} {memberToEject.first_name}</strong>
              </div>
              <div>
                Matricule : <strong className="text-[#D4AF37] font-mono">{memberToEject.membership_id}</strong>
              </div>
              <div>
                Université : <span className="text-slate-300">{memberToEject.university}</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              ⚠️ <strong>Conséquences immédiates :</strong>
              <br />
              • La carte physique et virtuelle est révoquée.
              <br />
              • Lors du scan du QR Code, la page affichera solennellement : <strong>« CARTE RÉVOQUÉE — MEMBRE ÉJECTÉ DU RÉSEAU »</strong>.
              <br />
              • Tous les accès aux programmes et financements EEA sont immédiatement résiliés.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setMemberToEject(null)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-slate-300 cursor-pointer"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={handleConfirmEject}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>Confirmer l&apos;Éjection</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: CONFIRMATION SUPPRESSION DÉFINITIVE */}
      {memberToDelete && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#091733] border border-white/20 rounded-2xl p-6 sm:p-8 max-w-md w-full space-y-5 shadow-2xl">
            <div className="flex items-center gap-3 text-slate-200">
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center shrink-0 text-rose-400">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">Supprimer Définitivement</h3>
                <p className="text-xs text-slate-400">Nettoyage du registre</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Êtes-vous sûr de vouloir supprimer définitivement la fiche de{" "}
              <strong className="text-white">
                {memberToDelete.last_name.toUpperCase()} {memberToDelete.first_name}
              </strong>{" "}
              ({memberToDelete.membership_id}) ? Cette action est irréversible.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setMemberToDelete(null)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-slate-300 cursor-pointer"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Supprimer la Fiche</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: NOTIFICATION OFFICIELLE DE RENOUVELLEMENT */}
      {renewalNoticeData && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#091733] border-2 border-[#D4AF37]/60 rounded-2xl p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2 text-[#D4AF37]">
                <Bell className="w-5 h-5" />
                <h3 className="text-base font-black text-white uppercase tracking-tight">
                  Notification de Renouvellement Annuel EEA
                </h3>
              </div>
              <button
                onClick={() => setRenewalNoticeData(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200">
              Destinataire : <strong className="text-white">{renewalNoticeData.member.first_name} {renewalNoticeData.member.last_name}</strong> • Email : <span className="underline">{renewalNoticeData.member.email}</span> • Téléphone : <span className="font-mono">{renewalNoticeData.member.phone}</span>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Message Officiel Préparé par le Secrétariat
              </label>
              <textarea
                readOnly
                value={renewalNoticeData.preview.plainText}
                rows={12}
                className="w-full p-4 rounded-xl bg-[#040914] border border-white/15 text-slate-300 text-xs font-mono leading-relaxed focus:outline-none select-all"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <a
                href={renewalNoticeData.preview.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-[#25D366] hover:bg-[#20bd5a] shadow-md transition-all cursor-pointer"
              >
                <WhatsAppIcon className="w-4 h-4" />
                <span>Envoyer sur WhatsApp ({renewalNoticeData.member.phone})</span>
              </a>

              <button
                type="button"
                onClick={() => {
                  const subject = encodeURIComponent(renewalNoticeData.preview.subject);
                  const body = encodeURIComponent(renewalNoticeData.preview.plainText);
                  window.open(
                    `mailto:${renewalNoticeData.member.email}?subject=${subject}&body=${body}`,
                    "_blank"
                  );
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-[#060d1d] bg-[#D4AF37] hover:brightness-110 shadow-md transition-all cursor-pointer"
              >
                <Mail className="w-4 h-4" />
                <span>Envoyer par Email ({renewalNoticeData.member.email})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: ADMIN BADGE VIEWER & EXPORT */}
      {selectedMemberForBadge && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#091733] border-2 border-[#D4AF37]/50 rounded-2xl p-5 sm:p-7 max-w-3xl w-full max-h-[92vh] overflow-y-auto space-y-5 relative shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#D4AF37]" />
                <h3 className="font-bold text-white text-base sm:text-lg">
                  Visualisation & Exportation du Badge Officiel
                </h3>
              </div>
              <button
                onClick={() => setSelectedMemberForBadge(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-white/5 border border-white/10 text-xs">
              <div className="text-slate-300">
                Membre : <strong className="text-white">{selectedMemberForBadge.last_name.toUpperCase()} {selectedMemberForBadge.first_name}</strong>
                <span className="mx-2 text-slate-500">•</span>
                Matricule : <strong className="text-[#D4AF37] font-mono">{selectedMemberForBadge.membership_id}</strong>
              </div>

              <div className="flex items-center gap-2">
                {selectedMemberForBadge.status === "pending" && (
                  <button
                    type="button"
                    onClick={() => {
                      handleValidatePayment(selectedMemberForBadge);
                      setSelectedMemberForBadge({
                        ...selectedMemberForBadge,
                        status: "active",
                      });
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs text-[#060d1d] bg-emerald-400 hover:bg-emerald-300 shadow-sm transition-all cursor-pointer"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Valider Paiement (5 000 F)</span>
                  </button>
                )}

                {getEffectiveMemberStatus(selectedMemberForBadge) === "expired" && (
                  <button
                    type="button"
                    onClick={() => {
                      handleRenewMembership(selectedMemberForBadge);
                      setSelectedMemberForBadge({
                        ...selectedMemberForBadge,
                        status: "active",
                        expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
                      });
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs text-[#060d1d] bg-gradient-to-r from-[#D4AF37] to-[#F3DE8A] hover:brightness-110 shadow-sm transition-all cursor-pointer"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>Renouveler (1 an)</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleSendEmail(selectedMemberForBadge)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-xs text-[#060d1d] bg-[#D4AF37] hover:brightness-110 shadow-sm transition-all cursor-pointer"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Email</span>
                </button>

                <a
                  href={`https://wa.me/${selectedMemberForBadge.phone.replace(/[^0-9]/g, "") || "221785425345"}?text=${encodeURIComponent(
                    `Bonjour ${selectedMemberForBadge.first_name} ${selectedMemberForBadge.last_name},\n\nVotre adhésion à l'Étudiant Entrepreneuriat Afrique (EEA) a bien été validée par le Secrétariat Général.\n\n- Matricule Officiel : ${selectedMemberForBadge.membership_id}\n- Vérification en ligne de votre QR Code : ${getVerifyUrl(selectedMemberForBadge.qr_code_token)}\n\nVotre carte officielle de membre au format PDF est prête et attachée ci-joint.\n\nSecrétariat Général EEA - UCAD Dakar`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-xs text-white bg-[#25D366] hover:bg-[#20bd5a] shadow-sm transition-all cursor-pointer"
                >
                  <WhatsAppIcon className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>

            <MemberCardBadge member={selectedMemberForBadge} compact={true} />
          </div>
        </div>
      )}
    </div>
  );
}
