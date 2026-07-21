import { NextResponse } from "next/server";
import { WhatsappRepository } from "@/lib/repositories/crm.repository";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || "";
    let messageSid = "";
    let messageStatus = "";
    let errorCode = "";
    let errorMessage = "";

    if (contentType.includes("application/x-www-form-urlencoded")) {
      const bodyText = await request.text();
      console.log(`[Twilio Webhook] Received body: ${bodyText}`);
      const params = new URLSearchParams(bodyText);
      messageSid = params.get("MessageSid") || "";
      messageStatus = params.get("MessageStatus") || "";
      errorCode = params.get("ErrorCode") || "";
      errorMessage = params.get("ErrorMessage") || "";
    } else {
      // Fallback to JSON if any simulation or custom request triggers it
      const body = await request.json().catch(() => ({}));
      console.log(`[Twilio Webhook] Received JSON body:`, body);
      messageSid = body.MessageSid || body.messageSid || "";
      messageStatus = body.MessageStatus || body.messageStatus || "";
      errorCode = body.ErrorCode || body.errorCode || "";
      errorMessage = body.ErrorMessage || body.errorMessage || "";
    }

    if (!messageSid) {
      console.warn("[Twilio Webhook] Missing MessageSid parameter.");
      return NextResponse.json({ success: false, error: "Missing MessageSid" }, { status: 400 });
    }

    // Map Twilio message status to CRM standard status
    let mappedStatus = "SENT";
    const statusLower = messageStatus.toLowerCase();
    
    if (statusLower === "queued") {
      mappedStatus = "QUEUED";
    } else if (statusLower === "sent") {
      mappedStatus = "SENT";
    } else if (statusLower === "delivered") {
      mappedStatus = "DELIVERED";
    } else if (statusLower === "read") {
      mappedStatus = "READ";
    } else if (statusLower === "failed" || statusLower === "undelivered") {
      mappedStatus = "FAILED";
    }

    let errorDetails = null;
    if (errorCode || errorMessage) {
      errorDetails = `Code ${errorCode}: ${errorMessage || "No description provided"}`;
    }

    console.log(`[Twilio Webhook] Updating status for SID ${messageSid} to ${mappedStatus} (Twilio Status: ${messageStatus})`);
    
    await WhatsappRepository.updateStatusBySid(messageSid, mappedStatus, errorDetails || undefined);

    // Return empty TwiML response to Twilio
    const twiml = `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`;
    return new Response(twiml, {
      status: 200,
      headers: {
        "Content-Type": "text/xml",
      },
    });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("[Twilio Webhook] Error:", errMsg);
    return NextResponse.json({ success: false, error: errMsg }, { status: 500 });
  }
}

// Support GET for initial Twilio webhook URL verification / debugging
export async function GET() {
  return NextResponse.json({ success: true, message: "Twilio Status Callback Webhook is Active" });
}
