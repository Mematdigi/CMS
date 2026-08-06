import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { LeadRepository } from "@/lib/repositories/crm.repository";

export const runtime = "nodejs";

/**
 * Returns the lead's real, unmasked phone number for the sole purpose of placing a call
 * through the browser softphone. SALES_EXECUTIVE/VIEWER roles get a masked (fake-looking,
 * non-Indian-formatted) phone number everywhere else in the UI via maskLead() — dialing
 * that masked string directly gets rejected by Exotel as an international/ISD call, since
 * it's not a real number. This endpoint is never rendered in the UI; it only feeds MakeCall().
 */
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

    if (!lead.phone) {
      return NextResponse.json({ success: false, error: "Lead does not have a phone number." }, { status: 400 });
    }

    return NextResponse.json({ success: true, phone: lead.phone });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
