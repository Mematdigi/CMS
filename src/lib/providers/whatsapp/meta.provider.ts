import axios from "axios";

export interface MetaWhatsappTemplatePayload {
  to: string;
  templateName: string;
  languageCode: string;
  components?: Record<string, unknown>[];
}

export class MetaWhatsappClient {
  private accessToken: string;
  private phoneNumberId: string;
  private graphUrl: string;

  constructor() {
    this.accessToken = process.env.META_WA_ACCESS_TOKEN || "";
    this.phoneNumberId = process.env.META_WA_PHONE_NUMBER_ID || "";
    this.graphUrl = `https://graph.facebook.com/v19.0/${this.phoneNumberId}/messages`;
  }

  async sendTemplate(payload: MetaWhatsappTemplatePayload): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.accessToken || !this.phoneNumberId) {
      console.warn("[Meta WhatsApp Client] Missing Meta access variables. Simulating template dispatch...");
      return {
        success: true,
        messageId: `wamid.mock-${Date.now()}`,
      };
    }

    try {
      const response = await axios.post(
        this.graphUrl,
        {
          messaging_product: "whatsapp",
          to: payload.to,
          type: "template",
          template: {
            name: payload.templateName,
            language: {
              code: payload.languageCode,
            },
            components: payload.components || [],
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 200 && response.data?.messages?.length > 0) {
        return {
          success: true,
          messageId: response.data.messages[0].id,
        };
      }

      return {
        success: false,
        error: "Failed to dispatch WhatsApp template.",
      };
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error("[Meta WhatsApp Client] Error dispatching template:", errMsg);
      return {
        success: false,
        error: (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message || errMsg,
      };
    }
  }

  async sendFreeText(to: string, text: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.accessToken || !this.phoneNumberId) {
      console.warn("[Meta WhatsApp Client] Missing Meta access variables. Simulating free-text dispatch...");
      return {
        success: true,
        messageId: `wamid.mock-text-${Date.now()}`,
      };
    }

    try {
      const response = await axios.post(
        this.graphUrl,
        {
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to,
          type: "text",
          text: {
            preview_url: false,
            body: text,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 200 && response.data?.messages?.length > 0) {
        return {
          success: true,
          messageId: response.data.messages[0].id,
        };
      }

      return {
        success: false,
        error: "Failed to send free-text message.",
      };
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error("[Meta WhatsApp Client] Error sending free-text:", errMsg);
      return {
        success: false,
        error: (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message || errMsg,
      };
    }
  }
}
export const metaWhatsappClient = new MetaWhatsappClient();
