import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { LeadRepository } from "@/lib/repositories/crm.repository";
import { maskLead } from "@/lib/utils/masking";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 401 });
    }

    const user = session.user as { role?: string; id?: string };
    const role = user.role || "SALES_EXECUTIVE";
    const currentUserId = user.id;
    const { id } = await params;
    const lead = await LeadRepository.findById(id);

    if (!lead) {
      return NextResponse.json({ success: false, error: "Lead not found" }, { status: 404 });
    }

    if (role === "SALES_EXECUTIVE" && lead.assignedToId !== currentUserId) {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 403 });
    }

    const maskedLead = {
      ...maskLead(lead, role),
      assignedToName: (lead as { assignedTo?: { name: string } | null }).assignedTo?.name || "Unassigned",
    };
    return NextResponse.json({ success: true, data: maskedLead });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 401 });
    }

    const user = session.user as { role?: string; id?: string };
    const role = user.role || "SALES_EXECUTIVE";
    const currentUserId = user.id;
    const { id } = await params;
    const body = await request.json();

    const lead = await LeadRepository.findById(id);
    if (!lead) {
      return NextResponse.json({ success: false, error: "Lead not found" }, { status: 404 });
    }

    if (role === "SALES_EXECUTIVE" && lead.assignedToId !== currentUserId) {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 403 });
    }

    const updateData = { ...body };
    // Sales Executive or Viewer should not modify contact details
    if (role === "SALES_EXECUTIVE" || role === "VIEWER") {
      delete updateData.phone;
      delete updateData.altPhone;
      delete updateData.email;
      delete updateData.state;
      delete updateData.city;
      delete updateData.country;
      delete updateData.assignedToId;
    }

    const updatedLead = await LeadRepository.update(id, updateData);
    const maskedUpdatedLead = {
      ...maskLead(updatedLead, role),
      assignedToName: (updatedLead as { assignedTo?: { name: string } | null }).assignedTo?.name || "Unassigned",
    };
    return NextResponse.json({ success: true, data: maskedUpdatedLead });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 401 });
    }

    const role = (session.user as { role?: string }).role || "SALES_EXECUTIVE";
    if (role === "SALES_EXECUTIVE" || role === "VIEWER") {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 403 });
    }

    const { id } = await params;
    const lead = await LeadRepository.findById(id);
    if (!lead) {
      return NextResponse.json({ success: false, error: "Lead not found" }, { status: 404 });
    }

    await LeadRepository.delete(id);
    return NextResponse.json({ success: true, data: { id } });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
