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

    const user = session.user as { tenantId?: string; role?: string };
    const tenantId = user.tenantId || "tenant-1";
    const role = user.role || "SALES_EXECUTIVE";

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
      assignedToId: role === "SALES_EXECUTIVE" ? (session.user as { id: string }).id : undefined,
    });

    const maskedData = maskLeadsArray(result.data, role).map((lead) => ({
      ...lead,
      assignedToName: (lead as { assignedTo?: { name: string } | null }).assignedTo?.name || "Unassigned",
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
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { success: false, error: message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as { tenantId?: string; id?: string } | undefined;
    const tenantId = user ? (user.tenantId || "tenant-1") : "tenant-1";
    const userId = user ? (user.id || "user-current") : "user-admin";

    const body = await request.json();
    const { name, phone, email, company, industry, productId, productName, budget, leadSource, campaign, state, city, country, language, notes } = body;

    if (!name || !phone || !email) {
      return NextResponse.json(
        { success: false, error: "Name, phone, and email are required fields." },
        { status: 400, headers: corsHeaders }
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

    return NextResponse.json({ success: true, data: newLead }, { status: 201, headers: corsHeaders });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { success: false, error: message || "Internal Server Error" },
      { status: 500, headers: corsHeaders }
    );
  }
}
