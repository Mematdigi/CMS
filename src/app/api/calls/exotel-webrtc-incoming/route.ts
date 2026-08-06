// Exotel WebRTC "popup_url" webhook — POSTed by Exotel when an inbound PSTN call to our
// Exophone is being routed to a browser-registered agent (AppUserId = agent email). The
// call's audio/signaling is delivered separately, straight to that agent's browser over
// SIP (handled by the "incoming" WebrtcCallEvent branch in src/app/dashboard/layout.tsx,
// which already shows an incoming-call banner and wires Accept/Reject). This webhook is
// only for enrichment: it looks up the matching CRM lead by phone and pushes a
// call:incoming Pusher event to that specific agent's channel, ahead of/alongside the
// SDK's own event, so the banner can show a real lead name instead of a raw SIP caller ID.
// Registered automatically via ensurePopupUrlConfigured() in exotel-webrtc.provider.ts.
import { getPrisma } from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";

const prisma = getPrisma();

export const runtime = "nodejs";

interface ExotelPopupPayload {
  from?: string;
  From?: string;
  user_id?: string;
  userId?: string;
  UserId?: string;
  call_sid?: string;
  CallSid?: string;
  caller_info?: { name?: string };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as ExotelPopupPayload;

    const from = body.from || body.From || "";
    const userId = body.user_id || body.userId || body.UserId || "";
    const callSid = body.call_sid || body.CallSid || "";

    console.log(`[Exotel WebRTC Incoming] From: ${from} Agent: ${userId} SID: ${callSid}`);

    const cleanFrom = from.replace(/\D/g, "");
    const last10 = cleanFrom.slice(-10);

    let matchedLead = null;
    if (last10) {
      const allLeads = await prisma.lead.findMany();
      matchedLead = allLeads.find((l) => l.phone.replace(/\D/g, "").endsWith(last10));
    }

    const leadName = matchedLead?.name || body.caller_info?.name || "Incoming Lead";
    const leadId = matchedLead?.id || "new-lead";

    if (userId) {
      const agent = await prisma.user.findUnique({ where: { email: userId }, select: { id: true } });
      if (agent) {
        await pusherServer.trigger(`user-${agent.id}`, "call:incoming", { leadId, leadName, phone: from });
      } else {
        console.warn(`[Exotel WebRTC Incoming] No CRM user found for Exotel AppUserId ${userId}`);
      }
    }

    // Always 200 — a non-200 makes Exotel retry this notification (5s/30s/5m), which is
    // pointless here since it's an enrichment-only webhook, not the actual call signaling.
    return Response.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[Exotel WebRTC Incoming] Error:", message);
    return Response.json({ success: false, error: message });
  } finally {
    await prisma.$disconnect();
  }
}
