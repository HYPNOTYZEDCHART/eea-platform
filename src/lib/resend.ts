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
  const currentApiKey = process.env.RESEND_API_KEY;

  // 1. Si aucune clé Resend n'est configurée, simuler l'envoi proprement sans crasher
  if (!currentApiKey || currentApiKey.startsWith("placeholder")) {
    console.info(
      `[Resend Simulation] Email simulé pour ${to} : "${subject}". Ajoutez RESEND_API_KEY dans .env.local pour l'envoi réel.`
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
