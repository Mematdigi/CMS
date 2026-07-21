import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { WhatsappRepository, LeadRepository } from "@/lib/repositories/crm.repository";
import { twilioWhatsappClient } from "@/lib/providers/whatsapp/twilio-wa.provider";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 401 });
    }

    const currentUserId = (session.user as { id: string }).id;
    const body = await request.json();
    const { leadId, messageBody, templateName } = body;

    if (!leadId || !messageBody) {
      return NextResponse.json(
        { success: false, error: "leadId and messageBody are required." },
        { status: 400 }
      );
    }

    // Fetch the lead to get the unmasked phone number
    const lead = await LeadRepository.findById(leadId);
    if (!lead) {
      return NextResponse.json({ success: false, error: "Lead not found." }, { status: 404 });
    }

    if (!lead.phone) {
      return NextResponse.json({ success: false, error: "Lead does not have a phone number." }, { status: 400 });
    }

    // Dispatch message via Twilio provider
    console.log(`[API Send WhatsApp] Sending to lead ${leadId} (${lead.phone})`);
    const result = await twilioWhatsappClient.sendWhatsapp(lead.phone, messageBody);

    const fromNumber = process.env.TWILIO_WA_FROM || "whatsapp:+14155238886";
    // Normalize destination number
    const cleanPhone = lead.phone.replace(/\s+/g, "").replace(/[\(\)\-]/g, "");
    const recipientNumber = cleanPhone.startsWith("+") ? cleanPhone : `+91${cleanPhone}`;
    const toNumber = `whatsapp:${recipientNumber}`;

    // Store in DB
    const message = await WhatsappRepository.create({
      leadId,
      userId: currentUserId,
      messageBody,
      phone: lead.phone,
      from: fromNumber,
      to: toNumber,
      twilioSid: result.messageId || undefined,
      status: result.success ? "QUEUED" : "FAILED",
      direction: "OUTBOUND",
      error: result.error || undefined,
      templateName: templateName || undefined,
    });

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error || "Failed to send WhatsApp message.",
        data: message,
      }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: message }, { status: 201 });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("[API Send WhatsApp] Error:", errMsg);
    return NextResponse.json({ success: false, error: errMsg }, { status: 500 });
  }
}
