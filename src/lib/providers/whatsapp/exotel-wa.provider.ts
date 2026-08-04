
export class ExotelWhatsappClient {
  private accountSid: string;
  private apiKey: string;
  private apiToken: string;
  private exophone: string;
  private subdomain: string;
  private messagingType: string;

  constructor() {
    this.accountSid = process.env.EXOTEL_ACCOUNT_SID || "";
    this.apiKey = process.env.EXOTEL_API_KEY || "";
    this.apiToken = process.env.EXOTEL_API_TOKEN || "";
    this.exophone = process.env.EXOTEL_EXOPHONE || "";
    this.subdomain = process.env.EXOTEL_SUBDOMAIN || "api.exotel.com";
    this.messagingType = process.env.EXOTEL_MESSAGING_TYPE || "whatsapp";
  }

  async sendWhatsapp(
    to: string,
    message: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    // If credentials are placeholders or missing, perform simulation
    if (
      !this.accountSid ||
      !this.apiKey ||
      !this.apiToken ||
      this.apiToken.includes("your_exotel_api_token_here") ||
      !this.exophone
    ) {
      console.warn(`[Exotel Messaging Client] Missing credentials. Simulating ${this.messagingType.toUpperCase()} dispatch.`);
      return {
        success: true,
        messageId: `exotel-mock-msg-${Date.now()}`,
      };
    }

    // Normalize number format for recipient (E.164 without special characters)
    const cleanPhone = to.replace(/\s+/g, "").replace(/[\(\)\-]/g, "");
    const recipientNumber = cleanPhone.startsWith("+") ? cleanPhone : `+91${cleanPhone}`;

    const authHeader = Buffer.from(`${this.apiKey}:${this.apiToken}`).toString("base64");

    try {
      if (this.messagingType.toLowerCase() === "sms") {
        // --- Exotel SMS Send API (v1) ---
        console.log(`[Exotel SMS Client] Dispatching SMS to ${recipientNumber}...`);
        
        const url = `https://${this.subdomain}/v1/Accounts/${this.accountSid}/Sms/send.json`;
        const params = new URLSearchParams();
        params.append("From", this.exophone);
        params.append("To", recipientNumber);
        params.append("Body", message);

        const response = await fetch(url, {
          method: "POST",
          headers: {
            Authorization: `Basic ${authHeader}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: params.toString(),
        });

        const data = await response.json();

        if (!response.ok) {
          console.error("[Exotel SMS Client] API Error:", data);
          return {
            success: false,
            error: data?.RestException?.Message || "Failed to send Exotel SMS.",
          };
        }

        const smsSid = data?.SMSMessage?.Sid;
        if (smsSid) {
          console.log(`[Exotel SMS Client] SMS sent successfully. SID: ${smsSid}`);
          return {
            success: true,
            messageId: smsSid,
          };
        }

        return {
          success: false,
          error: "No SMS SID returned from Exotel SMS API.",
        };
      } else {
        // --- Exotel WhatsApp API (v2) ---
        // The messages endpoint is channel-agnostic (SMS/WhatsApp/etc share it), so the
        // payload must be wrapped under a "whatsapp" -> "messages" array — a bare
        // {from,to,content} body 400s with "at least one channel is mandatory". Confirmed
        // against the real API 2026-08-04; see project memory.
        console.log(`[Exotel WhatsApp Client] Dispatching WhatsApp message to ${recipientNumber}...`);

        const url = `https://${this.subdomain}/v2/accounts/${this.accountSid}/messages`;
        const payload = {
          whatsapp: {
            messages: [
              {
                from: this.exophone,
                to: recipientNumber,
                content: {
                  type: "text",
                  text: {
                    body: message,
                  },
                },
              },
            ],
          },
        };

        const response = await fetch(url, {
          method: "POST",
          headers: {
            Authorization: `Basic ${authHeader}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        // Response/error is nested under response.whatsapp.messages[0], not top-level
        // (confirmed against the real API 2026-08-04) — e.g.
        // { response: { whatsapp: { messages: [{ code, status, error_data, data }] } } }
        const data = await response.json();
        const messageResult = data?.response?.whatsapp?.messages?.[0];

        if (!response.ok || messageResult?.status !== "success") {
          console.error("[Exotel WhatsApp Client] API Error:", JSON.stringify(data));
          return {
            success: false,
            error:
              messageResult?.error_data?.message ||
              messageResult?.error_data?.description ||
              data?.error?.message ||
              data?.message ||
              "Failed to send Exotel WhatsApp message.",
          };
        }

        const messageId = messageResult?.data?.sid;
        console.log(`[Exotel WhatsApp Client] WhatsApp message sent successfully. SID: ${messageId}`);
        return {
          success: true,
          messageId: messageId || `exotel-wa-success-${Date.now()}`,
        };
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error("[Exotel Messaging Client] Error dispatching message:", err);
      return {
        success: false,
        error: errMsg,
      };
    }
  }
}

export const exotelWhatsappClient = new ExotelWhatsappClient();
