export interface TwilioCallPayload {
  leadPhone: string;
  agentPhone?: string;
  leadId?: string;
}

const TRIAL_CODES = [21210, 21219, 21612, 10002];

function normPhone(phone: string): string {
  const clean = phone.replace(/\s+/g, "").replace(/[\(\)\-]/g, "");
  return clean.startsWith("+") ? clean : `+91${clean}`;
}

async function placeTwilioCall(
  to: string,
  from: string,
  twiml: string,
  authHeader: string,
  accountSid: string
): Promise<{ sid: string; status: string } | { error: string; code?: number }> {
  const params = new URLSearchParams();
  params.append("To", to);
  params.append("From", from);
  params.append("Twiml", twiml);

  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${authHeader}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    }
  );

  const data = await res.json();
  if (!res.ok) return { error: data.message, code: data.code };
  return { sid: data.sid, status: data.status };
}

export class TwilioTelephonyClient {
  private accountSid: string;
  private authToken: string;
  private fromNumber: string;
  private defaultAgentPhone: string;

  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID || "";
    this.authToken = process.env.TWILIO_AUTH_TOKEN || "";
    this.fromNumber = process.env.TWILIO_PHONE_NUMBER || "+16592132589";
    this.defaultAgentPhone = process.env.TWILIO_AGENT_PHONE || "+917007316576";
  }

  /**
   * Click-to-Call Direct Dial Flow:
   * 1. Dials the AGENT's phone
   * 2. When they answer, says a prompt and dials the LEAD's phone directly
   * 3. Both are live on the line immediately without conference/music overhead
   */
  async initiateConferenceCall(payload: TwilioCallPayload): Promise<{
    success: boolean;
    simulated?: boolean;
    agentCallSid?: string;
    error?: string;
  }> {
    if (!this.accountSid || !this.authToken) {
      console.warn("[Twilio] No credentials. Simulating call.");
      return { success: true, simulated: true };
    }

    const authHeader = Buffer.from(`${this.accountSid}:${this.authToken}`).toString("base64");
    const agentPhone = normPhone(payload.agentPhone || this.defaultAgentPhone);
    const leadPhone = normPhone(payload.leadPhone);

    console.log(`[Twilio Call] Agent: ${agentPhone} | Lead: ${leadPhone}`);

    const callTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice" language="en-IN">Connecting you to the lead now.</Say>
  <Dial callerId="${this.fromNumber}" timeout="30" record="record-from-answer">
    <Number>${leadPhone}</Number>
  </Dial>
</Response>`;

    const agentResult = await placeTwilioCall(agentPhone, this.fromNumber, callTwiml, authHeader, this.accountSid);

    if ("error" in agentResult) {
      if (TRIAL_CODES.includes(agentResult.code || 0)) {
        console.warn(`[Twilio] Trial restriction on agent number. Simulating.`);
        return { success: true, simulated: true };
      }
      return { success: false, error: agentResult.error };
    }

    console.log(`[Twilio Call] ✅ Agent leg: ${agentResult.sid}`);

    return {
      success: true,
      simulated: false,
      agentCallSid: agentResult.sid,
    };
  }
}
