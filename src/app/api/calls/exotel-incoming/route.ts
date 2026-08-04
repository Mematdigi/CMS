// RE-ENABLED (2026-08-04): Exotel confirmed the account is live with test credits added,
// so voice calling is back on Exotel. Configure this in Exotel Dashboard -> App Bazaar /
// Exophone Settings: https://<your-domain-or-ngrok>/api/calls/exotel-incoming
// The ivrfortius.com stub that replaced this is commented out below, kept in case
// ivrfortius is revisited (it has no known incoming-call webhook of its own).

import { getPrisma } from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";

const prisma = getPrisma();

export const runtime = "nodejs";

function normPhone(phone: string): string {
  const clean = phone.replace(/\s+/g, "").replace(/[\(\)\-]/g, "");
  return clean.startsWith("+") ? clean : `+91${clean}`;
}

/**
 * Exotel Webhook for incoming voice calls.
 * Configure this in Exotel Dashboard -> App Bazaar / Exophone Settings:
 * https://<your-domain-or-ngrok>/api/calls/exotel-incoming
 */
export async function POST(request: Request) {
  try {
    let From = "";
    let To = "";
    let CallSid = "";

    const method = request.method;
    if (method === "POST") {
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

    console.log(`[Exotel Incoming Call Webhook] Received call from: ${From} to ExoPhone number: ${To} (SID: ${CallSid})`);

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

    // 2. Fetch agent details to forward the physical call
    const agentPhone = normPhone(process.env.EXOTEL_AGENT_PHONE || "");

    console.log(`[Exotel Incoming Call Webhook] Forwarding call to agent physical number: ${agentPhone}`);

    // ExoML response to connect the call to the agent
    const exoml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice" language="en-IN">Please wait while we connect your call to our representative.</Say>
  <Dial>
    <Number>${agentPhone}</Number>
  </Dial>
</Response>`;

    return new Response(exoml, {
      headers: { "Content-Type": "text/xml" },
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[Exotel Incoming Call Webhook] Error:", errorMessage);

    const fallbackExoml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice" language="en-IN">An error occurred. Connecting you directly.</Say>
  <Dial>
    <Number>${process.env.EXOTEL_AGENT_PHONE || ""}</Number>
  </Dial>
</Response>`;
    return new Response(fallbackExoml, {
      headers: { "Content-Type": "text/xml" },
    });
  } finally {
    await prisma.$disconnect();
  }
}

export async function GET(request: Request) {
  return POST(request);
}

// DISABLED (2026-08-04): ivrfortius.com Click-to-Call replacement stub. Kept, commented
// out, in case ivrfortius is revisited.
//
// export async function POST() {
//   return new Response("Exotel calling is disabled.", { status: 410 });
// }
//
// export async function GET() {
//   return new Response("Exotel calling is disabled.", { status: 410 });
// }
