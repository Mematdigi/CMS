import { getPrisma } from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";

const prisma = getPrisma();

export const runtime = "nodejs";

function normPhone(phone: string): string {
  const clean = phone.replace(/\s+/g, "").replace(/[\(\)\-]/g, "");
  return clean.startsWith("+") ? clean : `+91${clean}`;
}

/**
 * Twilio Webhook for incoming voice calls.
 * Configure this in Twilio Console -> Active Numbers -> Voice Webhook URL:
 * https://<your-domain-or-ngrok>/api/calls/incoming
 */
export async function POST(request: Request) {
  try {
    let From = "";
    let To = "";
    let CallSid = "";

    if (request.method === "POST") {
      const body = await request.text();
      const params = new URLSearchParams(body);
      From = params.get("From") || "";
      To = params.get("To") || "";
      CallSid = params.get("CallSid") || "";
    } else {
      const { searchParams } = new URL(request.url);
      From = searchParams.get("From") || "";
      To = searchParams.get("To") || "";
      CallSid = searchParams.get("CallSid") || "";
    }

    console.log(`[Incoming Call Webhook] Received call from: ${From} to Twilio number: ${To} (SID: ${CallSid})`);

    const cleanFrom = From.replace(/\D/g, "");
    const last10 = cleanFrom.slice(-10);

    let matchedLead = null;
    if (last10) {
      const allLeads = await prisma.lead.findMany();
      matchedLead = allLeads.find((l) => {
        const cleanLeadPhone = l.phone.replace(/\D/g, "");
        return cleanLeadPhone.endsWith(last10);
      });
    }

    const leadName = matchedLead ? matchedLead.name : "Incoming Lead";
    const leadId = matchedLead ? matchedLead.id : "new-lead";

    // 1. Notify all logged-in users via Pusher WebSockets so the CRM popup appears on the screen
    const users = await prisma.user.findMany({ select: { id: true } });
    for (const u of users) {
      try {
        await pusherServer.trigger(`user-${u.id}`, "call:incoming", {
          leadId,
          leadName,
          phone: From,
        });
      } catch {
        console.warn(`[Incoming Call] Failed to trigger WebSocket for user ${u.id}`);
      }
    }

    // 2. Fetch Twilio account details to verify if it is a Trial account (trial accounts must use Twilio number as callerId)
    const accountSid = process.env.TWILIO_ACCOUNT_SID || "";
    const authToken = process.env.TWILIO_AUTH_TOKEN || "";
    const agentPhone = normPhone(process.env.TWILIO_AGENT_PHONE || "");
    const twilioNumber = process.env.TWILIO_PHONE_NUMBER || "";

    const authHeader = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
    
    let isTrial = true;
    try {
      const accountRes = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}.json`,
        {
          headers: { Authorization: `Basic ${authHeader}` },
        }
      );
      if (accountRes.ok) {
        const accountData = await accountRes.json();
        isTrial = accountData.type === "Trial";
      }
    } catch {
      console.warn("[Incoming Call] Failed to check Twilio account type, defaulting to Trial rules.");
    }

    // Trial accounts must present the verified Twilio phone number as the callerId
    const callerId = isTrial ? twilioNumber : From;

    // 3. Dial the agent's WebRTC browser client AND physical cell phone simultaneously
    const adminUser = await prisma.user.findFirst({
      where: { email: "admin@enterprise.com" }
    });
    const defaultAgentId = adminUser ? adminUser.id : "admin";
    const assignedAgentId = matchedLead?.assignedToId || defaultAgentId;

    console.log(`[Incoming Call Webhook] Forwarding call to agent Client: ${assignedAgentId} and Number: ${agentPhone} (CallerID: ${callerId})`);

    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice" language="en-IN">Please wait while we connect your call to our representative.</Say>
  <Dial callerId="${callerId}" timeout="25">
    <Client>${assignedAgentId}</Client>
    <Number>${agentPhone}</Number>
  </Dial>
</Response>`;

    return new Response(twiml, {
      headers: { "Content-Type": "text/xml" },
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[Incoming Call Webhook] Error:", errorMessage);
    const fallbackTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice" language="en-IN">An error occurred. Connecting you directly.</Say>
  <Dial>
    <Number>${process.env.TWILIO_AGENT_PHONE || ""}</Number>
  </Dial>
</Response>`;
    return new Response(fallbackTwiml, {
      headers: { "Content-Type": "text/xml" },
    });
  } finally {
    await prisma.$disconnect();
  }
}

export async function GET(request: Request) {
  return POST(request);
}
