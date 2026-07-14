import { getPrisma } from "@/lib/prisma";

export const runtime = "nodejs";

/**
 * TwiML Voice URL — Twilio calls this endpoint when the browser SDK places a call.
 * It tells Twilio what to do: dial the lead's phone number.
 * The `To` param is passed by the browser SDK when it places the call.
 */
export async function POST(request: Request) {
  try {
    let rawTo = "";
    let leadId = "";
    if (request.method === "POST") {
      const body = await request.text();
      console.log(`[TwiML Webhook] POST body: ${body}`);
      const params = new URLSearchParams(body);
      rawTo = params.get("To") || "";
      if (rawTo.startsWith("AP") || rawTo.startsWith("client:")) {
        const customTo = params.get("params[To]");
        if (customTo) rawTo = customTo;
      }
      leadId = params.get("leadId") || params.get("params[leadId]") || "";
    } else {
      const { searchParams } = new URL(request.url);
      console.log(`[TwiML Webhook] GET query: ${searchParams.toString()}`);
      rawTo = searchParams.get("To") || "";
      if (rawTo.startsWith("AP") || rawTo.startsWith("client:")) {
        const customTo = searchParams.get("params[To]");
        if (customTo) rawTo = customTo;
      }
      leadId = searchParams.get("leadId") || searchParams.get("params[leadId]") || "";
    }

    // Resolve unmasked number from database if leadId is provided
    if (leadId && leadId !== "manual-call" && !leadId.startsWith("incoming")) {
      try {
        const prisma = getPrisma();
        const lead = await prisma.lead.findUnique({
          where: { id: leadId },
          select: { phone: true },
        });
        if (lead && lead.phone) {
          console.log(`[TwiML Webhook] Resolved leadId ${leadId} to unmasked number: ${lead.phone}`);
          rawTo = lead.phone;
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[TwiML Webhook] Failed to resolve leadId ${leadId}:`, message);
      }
    }

    // Clean and normalize phone number / client identity
    const cleanTo = rawTo.trim();
    const isClient = cleanTo.startsWith("client:") || cleanTo.startsWith("client_");

    let destination = cleanTo;
    if (isClient) {
      destination = cleanTo.replace(/^client[\:_]/i, "");
    } else {
      // Strip spaces, parentheses, hyphens, and dots
      const cleanNum = cleanTo.replace(/[\s\(\)\-\.]/g, "");
      destination = cleanNum.startsWith("+") ? cleanNum : (cleanNum.startsWith("91") ? `+${cleanNum}` : `+91${cleanNum}`);
    }

    console.log(`[TwiML Webhook] cleanTo: "${cleanTo}", isClient: ${isClient}, destination: "${destination}"`);

    if (!destination || destination === "+91") {
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response><Say>No destination number provided.</Say></Response>`;
      return new Response(twiml, {
        headers: { "Content-Type": "text/xml" },
      });
    }

    const host = request.headers.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") || host.includes("127.0.0.1") ? "http" : "https";
    const absoluteRecordingCallback = `${protocol}://${host}/api/calls/recording`;

    // TwiML: Dial the destination directly
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice" language="en-IN">Connecting your call. Please wait.</Say>
  <Dial callerId="${process.env.TWILIO_PHONE_NUMBER || "+16592132589"}" 
        timeout="30" 
        record="record-from-answer"
        recordingStatusCallback="${absoluteRecordingCallback}">
    ${isClient ? `<Client>${destination}</Client>` : `<Number>${destination}</Number>`}
  </Dial>
  <Say voice="alice">The call has ended. Goodbye.</Say>
</Response>`;

    return new Response(twiml, {
      headers: { "Content-Type": "text/xml" },
    });
  } catch {
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response><Say>An error occurred. Please try again.</Say></Response>`;
    return new Response(twiml, { headers: { "Content-Type": "text/xml" } });
  }
}

// GET also needed for some Twilio webhook validation scenarios
export async function GET(request: Request) {
  return POST(request);
}
