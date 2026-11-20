import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;

// Instance Resend (active si une clé est fournie)
export const resend = apiKey ? new Resend(apiKey) : null;

// Expéditeur par défaut :
// - En phase de test Resend : "onboarding@resend.dev"
// - En production avec domaine vérifié : "contact@eea-afrique.org" ou "secretariat@eea-afrique.org"
export const DEFAULT_FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || "EEA Secrétariat <onboarding@resend.dev>";

export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
  }>;
}

/**
 * Envoie un email via Resend avec gestion sécurisée des environnements de développement
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
  from = DEFAULT_FROM_EMAIL,
  attachments,
}: SendEmailParams): Promise<{
  success: boolean;
  messageId?: string;
  simulated?: boolean;
  error?: string;
}> {
  const currentApiKey = process.env.RESEND_API_KEY?.trim();

  // 1. En développement uniquement : simuler l'envoi si aucune clé Resend n'est configurée
  // En production : refus strict pour éviter toute validation 2FA silencieusement simulée
  if (!currentApiKey || currentApiKey.startsWith("placeholder") || currentApiKey.includes("your_")) {
    if (process.env.NODE_ENV === "production") {
      console.error("[SÉCURITÉ CRITIQUE] RESEND_API_KEY manquante ou invalide en production.");
      return {
        success: false,
        error: "Service d'envoi d'emails non configuré en production.",
      };
    }
    console.info(
      `[Resend Simulation DEV] Email simulé pour ${to} : "${subject}". Ajoutez RESEND_API_KEY dans .env.local pour l'envoi réel.`
    );
    return {
      success: true,
      simulated: true,
      messageId: `simulated-${Date.now()}`,
    };
  }

  // 2. Envoi réel via l'API Resend
  try {
    const client = new Resend(currentApiKey);
    const { data, error } = await client.emails.send({
      from,
      to,
      subject,
      html,
      text,
      attachments,
    });

    if (error) {
      console.error("[Resend Error]:", error);
      if (error.name === "validation_error" && error.message?.includes("testing emails")) {
        console.warn(
          "⚠️ [Resend Guide]: Avec le domaine gratuit 'onboarding@resend.dev', Resend n'autorise l'envoi qu'à l'adresse du propriétaire du compte. Pour envoyer à d'autres destinataires, utilisez la clé API du compte ou vérifiez un domaine institutionnel sur resend.com/domains."
        );
      }
      return {
        success: false,
        error: error.message || "Erreur lors de l'envoi via Resend.",
      };
    }

    return {
      success: true,
      messageId: data?.id,
    };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Erreur inconnue";
    console.error("[Resend Exception]:", errorMessage);
    return {
      success: false,
      error: errorMessage,
    };
  }
}
