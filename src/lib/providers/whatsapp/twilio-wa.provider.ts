import twilio from "twilio";

export class TwilioWhatsappClient {
  private accountSid: string;
  private authToken: string;
  private fromNumber: string;
  private statusCallbackUrl: string;

  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID || "";
    this.authToken = process.env.TWILIO_AUTH_TOKEN || "";
    this.fromNumber = process.env.TWILIO_WA_FROM || "whatsapp:+14155238886";
    this.statusCallbackUrl = process.env.TWILIO_WA_STATUS_CALLBACK_URL || "";
  }

  async sendWhatsapp(to: string, message: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.accountSid || !this.authToken) {
      console.warn("[Twilio WhatsApp Client] Missing credentials.");
      return {
        success: false,
        error: "Twilio credentials (account SID or auth token) are not configured.",
      };
    }

    try {
      // Clean whitespace and special characters
      const cleanPhone = to.replace(/\s+/g, "").replace(/[\(\)\-]/g, "");
      
      // Basic check for E.164-like numeric content
      const numericPart = cleanPhone.replace(/^\+/, "");
      if (!/^\d+$/.test(numericPart) || numericPart.length < 7 || numericPart.length > 15) {
        return {
          success: false,
          error: `Invalid phone number format: "${to}". Number must be numeric and between 7 to 15 digits.`,
        };
      }
      
      const recipientNumber = cleanPhone.startsWith("+") ? cleanPhone : `+91${cleanPhone}`; // Fallback to Indian country code

      // Initialize Twilio client using official Node SDK
      const client = twilio(this.accountSid, this.authToken);

      const params = {
        from: this.fromNumber,
        to: `whatsapp:${recipientNumber}`,
        body: message,
        statusCallback: this.statusCallbackUrl || undefined,
      };

      console.log(`[Twilio WhatsApp Client] Dispatching message to ${recipientNumber} via Twilio SDK...`);
      const response = await client.messages.create(params);

      if (response && response.sid) {
        console.log(`[Twilio WhatsApp Client] WhatsApp message sent successfully. SID: ${response.sid}`);
        return {
          success: true,
          messageId: response.sid,
        };
      }

      return {
        success: false,
        error: "Failed to dispatch WhatsApp message. No Message SID returned from Twilio.",
      };
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error("[Twilio WhatsApp Client] Error dispatching message:", err);
      return {
        success: false,
        error: errMsg,
      };
    }
  }
}

export const twilioWhatsappClient = new TwilioWhatsappClient();
