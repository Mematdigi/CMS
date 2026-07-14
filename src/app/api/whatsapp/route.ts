import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { WhatsappRepository, LeadRepository } from "@/lib/repositories/crm.repository";
import { twilioWhatsappClient } from "@/lib/providers/whatsapp/twilio-wa.provider";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const leadId = searchParams.get("leadId");

    if (!leadId) {
      return NextResponse.json({ success: false, error: "leadId query parameter is required." }, { status: 400 });
    }

    const messages = await WhatsappRepository.findMany(leadId);
    return NextResponse.json({ success: true, data: messages });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 401 });
    }

    const currentUserId = (session.user as any).id;
    const body = await request.json();
    const { leadId, messageBody, mediaUrl, templateName } = body;

    if (!leadId || !messageBody) {
      return NextResponse.json(
        { success: false, error: "leadId and messageBody are required." },
        { status: 400 }
      );
    }

    // Save message record to DB first
    const message = await WhatsappRepository.create({
      leadId,
      userId: currentUserId,
      messageBody,
      mediaUrl: mediaUrl || undefined,
      direction: "OUTBOUND",
      status: "SENT",
      templateName: templateName || undefined,
    });

    // Fetch the lead to get the REAL phone number (bypasses any masking)
    const lead = await LeadRepository.findById(leadId);
    if (lead?.phone) {
      console.log(`[WhatsApp] Dispatching Twilio WhatsApp to ${lead.phone}: "${messageBody}"`);
      const waResult = await twilioWhatsappClient.sendWhatsapp(lead.phone, messageBody);
      if (!waResult.success) {
        // Log warning but don't fail – message is already stored in DB
        console.warn(`[WhatsApp] Twilio dispatch failed: ${waResult.error}. Message saved to DB only.`);
      } else {
        console.log(`[WhatsApp] Twilio dispatch succeeded. SID: ${waResult.messageId}`);
      }
    }

    return NextResponse.json({ success: true, data: message }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
