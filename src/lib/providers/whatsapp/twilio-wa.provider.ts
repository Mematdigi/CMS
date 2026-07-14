import axios from "axios";

export class TwilioWhatsappClient {
  private accountSid: string;
  private authToken: string;
  private fromNumber: string;

  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID || "";
    this.authToken = process.env.TWILIO_AUTH_TOKEN || "";
    this.fromNumber = process.env.TWILIO_WA_FROM || "whatsapp:+14155238886";
  }

  async sendWhatsapp(to: string, message: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.accountSid || !this.authToken) {
      console.warn("[Twilio WhatsApp Client] Missing credentials. Simulating dispatch...");
      return {
        success: true,
        messageId: `tw-wa-mock-${Date.now()}`,
      };
    }

    try {
      const authHeader = Buffer.from(`${this.accountSid}:${this.authToken}`).toString("base64");
      
      const cleanPhone = to.replace(/\s+/g, "").replace(/[\(\)\-]/g, "");
      const recipientNumber = cleanPhone.startsWith("+") ? cleanPhone : `+91${cleanPhone}`; // Fallback to Indian country code

      const params = new URLSearchParams();
      params.append("To", `whatsapp:${recipientNumber}`);
      params.append("From", this.fromNumber);
      params.append("Body", message);

      console.log(`[Twilio WhatsApp Client] Dispatching message to ${recipientNumber}...`);
      const response = await axios.post(
        `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`,
        params,
        {
          headers: {
            Authorization: `Basic ${authHeader}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      if (response.status === 201 && response.data?.sid) {
        console.log(`[Twilio WhatsApp Client] WhatsApp message sent successfully. SID: ${response.data.sid}`);
        return {
          success: true,
          messageId: response.data.sid,
        };
      }

      return {
        success: false,
        error: response.data?.message || "Failed to dispatch WhatsApp message.",
      };
    } catch (err) {
      const error = err as { message: string; response?: { data?: { message?: string } } };
      const errMsg = error.response?.data?.message || error.message;
      console.error("[Twilio WhatsApp Client] Error dispatching message:", error.response?.data || error.message);
      return {
        success: false,
        error: errMsg,
      };
    }
  }
}

export const twilioWhatsappClient = new TwilioWhatsappClient();
