import axios from "axios";

export interface FortiusCallPayload {
  agentPhone: string;
  customerPhone: string;
  callId?: string;
  customId?: string;
}

export class FortiusTelephonyClient {
  private apiKey: string;
  private endpoint: string;

  constructor() {
    this.apiKey = process.env.FORTIUS_API_KEY || "";
    this.endpoint = process.env.FORTIUS_ENDPOINT || "https://api.fortiusinfocom.com/v1/calls";
  }

  async initiateOutboundCall(payload: FortiusCallPayload): Promise<{ success: boolean; callId?: string; error?: string }> {
    if (!this.apiKey) {
      console.warn("[Fortius VoIP Client] Missing FORTIUS_API_KEY. Simulating outbound bridge connection...");
      return {
        success: true,
        callId: `fortius-mock-${Date.now()}`,
      };
    }

    try {
      const response = await axios.post(
        `${this.endpoint}/click-to-call`,
        {
          agent_number: payload.agentPhone,
          customer_number: payload.customerPhone,
          custom_id: payload.customId,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 200 && response.data?.success) {
        return {
          success: true,
          callId: response.data.call_id,
        };
      }

      return {
        success: false,
        error: response.data?.message || "Failed to trigger click-to-call bridge.",
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("[Fortius VoIP Client] Error calling click-to-call API:", message);
      return {
        success: false,
        error: message,
      };
    }
  }

  async fetchRecordingUrl(callId: string): Promise<string | null> {
    if (!this.apiKey || callId.startsWith("fortius-mock")) {
      return "https://assets.mixkit.co/active-storage/sfx/123.mp3"; // Fallback demo file
    }

    try {
      const response = await axios.get(`${this.endpoint}/recordings/${callId}`, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      });

      if (response.status === 200 && response.data?.recording_url) {
        return response.data.recording_url;
      }
      return null;
    } catch {
      return null;
    }
  }
}
