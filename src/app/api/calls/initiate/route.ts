import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { LeadRepository } from "@/lib/repositories/crm.repository";

export const runtime = "nodejs";

// Twilio trial restriction error codes
const TRIAL_CODES = [21210, 21219, 21612, 10002];

function normPhone(phone: string): string {
  const clean = phone.replace(/\s+/g, "").replace(/[\(\)\-]/g, "");
  return clean.startsWith("+") ? clean : `+91${clean}`;
}

/**
 * Conference Bridge Click-to-Call:
 * 1. Creates a unique Twilio conference room for this call
 * 2. Dials the AGENT's phone → they hear hold music → join conference
 * 3. Dials the LEAD's phone → they hear a greeting → join same conference
 * 4. Both are live in the same room → real two-way conversation, no loopback
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { leadId } = body;

    if (!leadId) {
      return NextResponse.json({ success: false, error: "leadId is required" }, { status: 400 });
    }

    // Get the REAL unmasked lead phone from DB
    const lead = await LeadRepository.findById(leadId);
    if (!lead) {
      return NextResponse.json({ success: false, error: "Lead not found" }, { status: 404 });
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID!;
    const authToken = process.env.TWILIO_AUTH_TOKEN!;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER || "+16592132589";
    const agentPhone = normPhone(process.env.TWILIO_AGENT_PHONE || "+917007316576");
    const leadPhone = normPhone(lead.phone);

    const authHeader = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

    // Direct TwiML with voice instructions for the agent so they aren't left in silent hold
    const callTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice" language="en-IN">Connecting you to the lead. Their phone is now ringing. Please wait.</Say>
  <Dial callerId="${fromNumber}" timeout="25" record="record-from-answer">
    <Number>${leadPhone}</Number>
  </Dial>
  <Say voice="alice" language="en-IN">The lead did not answer the call. Goodbye.</Say>
</Response>`;

    console.log(`[Direct Dial Call] Agent: ${agentPhone} | Lead: ${leadPhone}`);

    // Call the AGENT first
    const agentParams = new URLSearchParams();
    agentParams.append("To", agentPhone);
    agentParams.append("From", fromNumber);
    agentParams.append("Twiml", callTwiml);

    const agentCallRes = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${authHeader}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: agentParams.toString(),
      }
    );

    const agentCall = await agentCallRes.json();
    if (!agentCallRes.ok) {
      const code = agentCall.code;
      if (TRIAL_CODES.includes(code)) {
        return NextResponse.json({
          success: true,
          simulated: true,
          message: "Simulated (trial restriction on agent number). Upgrade Twilio to enable live calls.",
        });
      }
      return NextResponse.json({ success: false, error: agentCall.message }, { status: 500 });
    }

    console.log(`[Direct Dial Call] ✅ Agent call placed: ${agentCall.sid}`);

    return NextResponse.json({
      success: true,
      simulated: false,
      agentCallSid: agentCall.sid,
      message: `Live call initiated. Your phone is ringing first.`,
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[Direct Dial Call] Error:", message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
