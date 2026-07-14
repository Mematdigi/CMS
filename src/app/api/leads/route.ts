import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { LeadRepository } from "@/lib/repositories/crm.repository";
import { evaluateSmartAssignment } from "@/lib/smart-assignment";
import { maskLeadsArray } from "@/lib/utils/masking";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 401 });
    }

    const tenantId = (session.user as any).tenantId || "tenant-1";
    const role = (session.user as any).role || "SALES_EXECUTIVE";

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = (searchParams.get("sortOrder") || "desc") as "asc" | "desc";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const result = await LeadRepository.findMany({
      search,
      status,
      sortBy,
      sortOrder,
      page,
      limit,
      tenantId,
      assignedToId: role === "SALES_EXECUTIVE" ? (session.user as any).id : undefined,
    });

    const maskedData = maskLeadsArray(result.data, role).map((lead: any) => ({
      ...lead,
      assignedToName: lead.assignedTo?.name || "Unassigned",
    }));

    return NextResponse.json({
      success: true,
      data: maskedData,
      meta: {
        pagination: {
          page: result.page,
          limit: result.limit,
          totalCount: result.totalCount,
          totalPages: result.totalPages,
        },
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const tenantId = session?.user ? ((session.user as any).tenantId || "tenant-1") : "tenant-1";
    const userId = session?.user ? ((session.user as any).id || "user-current") : "user-admin";

    const body = await request.json();
    const { name, phone, email, company, industry, productId, productName, budget, leadSource, campaign, state, city, country, language, notes } = body;

    if (!name || !phone || !email) {
      return NextResponse.json(
        { success: false, error: "Name, phone, and email are required fields." },
        { status: 400 }
      );
    }

    // Evaluate smart assignment rules
    const assignedUser = await evaluateSmartAssignment({
      name,
      phone,
      email,
      company: company || "",
      industry: industry || "",
      productId: productId || "",
      productName: productName || "",
      budget: budget ? parseFloat(budget) : 0,
      leadSource: leadSource || "",
      campaign: campaign || "",
      state: state || "",
      city: city || "",
      country: country || "",
      language: language || "English",
      notes: notes || "",
    });

    const newLead = await LeadRepository.create({
      tenantId,
      workspaceId: "workspace-1", // scoped default
      name,
      phone,
      altPhone: body.altPhone || "",
      email,
      company: company || "",
      industry: industry || "",
      productId: productId || undefined,
      budget: budget ? parseFloat(budget) : 0,
      leadSource: leadSource || "Google Search",
      campaignId: body.campaignId || undefined,
      status: "NEW",
      priority: body.priority || "MEDIUM",
      createdById: userId,
      assignedToId: body.assignedToId || assignedUser.userId,
      state: state || "",
      city: city || "",
      country: country || "",
      language: language || "English",
      notes: notes || "",
    });

    return NextResponse.json({ success: true, data: newLead }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
