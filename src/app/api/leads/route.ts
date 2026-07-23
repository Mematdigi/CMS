import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { LeadRepository } from "@/lib/repositories/crm.repository";
import { evaluateSmartAssignment } from "@/lib/smart-assignment";
import { maskLeadsArray } from "@/lib/utils/masking";
import { getPrisma } from "@/lib/prisma";
import { LeadStatus } from "@prisma/client";

// Orders/leads the webhook couldn't attach a real email to fall back to this
// value — never use it to match/merge, or every anonymous order would merge
// into one lead.
const PLACEHOLDER_EMAIL = "no-email@shopify-order.com";

// A lead already won, lost, or closed is a finished deal — a new storefront
// touch from the same contact starts a fresh lead instead of reopening it.
const TERMINAL_STATUSES: LeadStatus[] = ["WON", "LOST", "CLOSED"];

// Shopify may send phone as "07007316576" or "+917007316576" etc. Stripping
// down to the last 10 digits keeps matching/storage consistent regardless of
// leading zero or country code.
function normalizePhone(raw: string): string {
  const digits = (raw || "").replace(/\D/g, "");
  return digits.length > 10 ? digits.slice(-10) : digits;
}

// Storefront events describe themselves in the first line of `notes` (e.g.
// "Action: Add to Cart"). Use that to advance the pipeline stage so a WON
// lead really does mean an order came through, not just a cart click.
function deriveStage(currentStatus: LeadStatus, notes: string | undefined): LeadStatus {
  const actionLine = (notes || "").split("\n")[0]?.toLowerCase() || "";
  if (actionLine.includes("order placed") || actionLine.includes("order paid") || actionLine.includes("payment")) {
    return "WON";
  }
  if (actionLine.includes("buy now")) {
    return "NEGOTIATION";
  }
  if (actionLine.includes("add to cart")) {
    return "INTERESTED";
  }
  return currentStatus;
}

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
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-CRM-Source-Key",
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

    // Unauthenticated (browser/storefront) callers must present the shared
    // source key once it's configured. Session-authenticated dashboard
    // requests are already trusted and skip this check. If LEADS_SOURCE_KEY
    // isn't set in the environment yet, the check is skipped entirely so
    // existing integrations don't break until it's rolled out.
    const sourceKey = process.env.LEADS_SOURCE_KEY;
    if (!user && sourceKey) {
      const providedKey = request.headers.get("x-crm-source-key");
      if (providedKey !== sourceKey) {
        return NextResponse.json(
          { success: false, error: "Unauthorized" },
          { status: 401, headers: corsHeaders }
        );
      }
    }

    const body = await request.json();
    const { name, phone, email, company, industry, productId, productName, budget, leadSource, campaign, state, city, country, language, notes } = body;

    if (!name || !phone || !email) {
      return NextResponse.json(
        { success: false, error: "Name, phone, and email are required fields." },
        { status: 400, headers: corsHeaders }
      );
    }

    const normalizedPhone = normalizePhone(phone);
    const normalizedEmail = String(email).trim().toLowerCase();
    const isPlaceholderEmail = normalizedEmail === PLACEHOLDER_EMAIL;

    // Storefront upsert: unauthenticated (Shopify) submissions merge into an
    // active lead already tied to this phone/email instead of creating a
    // duplicate row, so add-to-cart -> buy-now -> order shows up as one
    // lead's timeline. Session-authenticated (dashboard) requests always
    // insert a fresh lead — manual CRM workflows stay unaffected.
    const existingLead = !user
      ? await getPrisma().lead.findFirst({
          where: {
            tenantId,
            isDeleted: false,
            status: { notIn: TERMINAL_STATUSES },
            OR: [
              { phone: normalizedPhone },
              ...(isPlaceholderEmail ? [] : [{ email: normalizedEmail }]),
            ],
          },
          orderBy: { createdAt: "desc" },
        })
      : null;

    if (existingLead) {
      const mergedNotes = notes
        ? `${existingLead.notes ? existingLead.notes + "\n\n" : ""}${notes}`
        : existingLead.notes;
      const nextStatus = deriveStage(existingLead.status, notes);
      const parsedBudget = budget ? parseFloat(budget) : 0;

      const updatedLead = await getPrisma().lead.update({
        where: { id: existingLead.id },
        data: {
          name: !existingLead.name || existingLead.name === "Store Customer" ? name || existingLead.name : existingLead.name,
          phone: normalizedPhone,
          email: isPlaceholderEmail ? existingLead.email : normalizedEmail,
          company: existingLead.company || company || existingLead.company,
          industry: existingLead.industry || industry || existingLead.industry,
          state: existingLead.state || state || existingLead.state,
          city: existingLead.city || city || existingLead.city,
          country: existingLead.country || country || existingLead.country,
          language: existingLead.language || language || existingLead.language,
          budget: parsedBudget > 0 ? parsedBudget : existingLead.budget,
          notes: mergedNotes,
          status: nextStatus,
          updatedAt: new Date(),
        },
      });
      return NextResponse.json(
        { success: true, data: updatedLead, merged: true },
        { status: 200, headers: corsHeaders }
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
      phone: normalizedPhone,
      altPhone: body.altPhone || "",
      email: isPlaceholderEmail ? email : normalizedEmail,
      company: company || "",
      industry: industry || "",
      productId: productId || undefined,
      budget: budget ? parseFloat(budget) : 0,
      leadSource: leadSource || "Google Search",
      campaignId: body.campaignId || undefined,
      status: deriveStage("NEW" as LeadStatus, notes),
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
