import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { CallRepository } from "@/lib/repositories/crm.repository";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const calls = await CallRepository.findMany(
      (session.user as any).role === "SALES_EXECUTIVE" ? userId : undefined
    );

    const mappedCalls = calls.map((call: any) => ({
      id: call.id,
      leadId: call.leadId,
      leadName: call.lead?.name || "Unknown Lead",
      userId: call.userId,
      durationSec: call.durationSec,
      recordingUrl: call.recordingUrl || undefined,
      callType: call.callType,
      notes: call.notes || "",
      createdAt: call.createdAt,
    }));

    return NextResponse.json({ success: true, data: mappedCalls });
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
    const { leadId, durationSec, notes, callType, recordingUrl } = body;

    if (!leadId || durationSec === undefined || !callType) {
      return NextResponse.json(
        { success: false, error: "leadId, durationSec, and callType are required." },
        { status: 400 }
      );
    }

    const newCall = (await CallRepository.create({
      leadId,
      userId: currentUserId,
      durationSec: parseInt(durationSec, 10),
      callType,
      recordingUrl: recordingUrl || undefined,
      notes: notes || "",
    })) as any;

    const mappedNewCall = {
      id: newCall.id,
      leadId: newCall.leadId,
      leadName: newCall.lead?.name || "Unknown Lead",
      userId: newCall.userId,
      durationSec: newCall.durationSec,
      recordingUrl: newCall.recordingUrl || undefined,
      callType: newCall.callType,
      notes: newCall.notes || "",
      createdAt: newCall.createdAt,
    };

    return NextResponse.json({ success: true, data: mappedNewCall }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
