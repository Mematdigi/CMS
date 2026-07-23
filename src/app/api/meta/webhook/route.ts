import { NextResponse } from "next/server";
import crypto from "crypto";
import { getPrisma } from "@/lib/prisma";
import { evaluateSmartAssignment } from "@/lib/smart-assignment";

export const runtime = "nodejs";

interface MetaFieldData {
  name?: string;
  values?: string[];
}

interface MetaLeadData {
  id: string;
  created_time?: string;
  field_data?: MetaFieldData[];
  platform?: string;
}

// Helper for conditional debug logging
function logDebug(message: string, data?: unknown) {
  if (process.env.META_DEBUG === "true" || process.env.NODE_ENV === "development") {
    console.log(
      `[META_WEBHOOK_DEBUG] ${message}`,
      data ? JSON.stringify(data, null, 2) : ""
    );
  }
}

/**
 * GET Handler - Webhook Verification
 * Called by Meta to verify the endpoint configuration.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("hub.mode");
    const token = searchParams.get("hub.verify_token");
    const challenge = searchParams.get("hub.challenge");

    // Handle health checks / browser access without query parameters
    if (!mode && !token && !challenge) {
      logDebug("GET Webhook status check (Health check)");
      return new Response("Meta Lead Ads Webhook endpoint is active.", {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      });
    }

    logDebug("GET Webhook verification requested", { mode, token, challenge });

    const verifyToken = process.env.META_VERIFY_TOKEN;

    if (!verifyToken) {
      console.error("[META_WEBHOOK] META_VERIFY_TOKEN environment variable is not defined.");
      return new Response("Internal Server Error: Missing verification config", { status: 500 });
    }

    if (mode === "subscribe" && token === verifyToken) {
      logDebug("Webhook verified successfully.");
      return new Response(challenge, {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      });
    }

    console.warn("[META_WEBHOOK] Verification failed. Tokens do not match.");
    return new Response("Forbidden", { status: 403 });
  } catch (error) {
    console.error("[META_WEBHOOK] Error verifying webhook GET:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

/**
 * Helper to process a lead from either source (Meta or Make.com)
 */
async function processLead({
  leadgen_id,
  form_id,
  page_id,
  created_time,
  source,
}: {
  leadgen_id: string;
  form_id: string;
  page_id: string;
  created_time: string | number;
  source: "Meta" | "Make.com";
}) {
  const prisma = getPrisma();
  const pageAccessToken = process.env.META_PAGE_ACCESS_TOKEN;
  if (!pageAccessToken) {
    console.error(`[WEBHOOK] [${source}] META_PAGE_ACCESS_TOKEN is not configured.`);
    throw new Error("META_PAGE_ACCESS_TOKEN is not configured.");
  }

  let leadData: MetaLeadData;

  // 3. Fetch lead details from the Meta Graph API (or use Mock if configured or test lead ID)
  if (pageAccessToken === "mock_page_access_token_xyz" || leadgen_id.startsWith("lead_test_")) {
    logDebug(`[${source}] Graph API request sent (MOCKED offline mode) for leadgen_id: ${leadgen_id}`);
    leadData = {
      id: leadgen_id,
      created_time: typeof created_time === "number" ? new Date(created_time * 1000).toISOString() : String(created_time) || new Date().toISOString(),
      platform: leadgen_id.includes("instagram") ? "ig" : "fb",
      field_data: [
        { name: "email", values: ["test-lead@example.com"] },
        { name: "full_name", values: ["Test Meta Lead"] },
        { name: "phone_number", values: ["+15559876543"] },
        { name: "company_name", values: ["Test Company Inc"] },
        { name: "city", values: ["London"] }
      ]
    };
    logDebug(`[${source}] Graph API response received (MOCKED offline mode)`, leadData);
  } else {
    logDebug(`[${source}] Graph API request sent for leadgen_id: ${leadgen_id}`);
    const graphUrl = `https://graph.facebook.com/v20.0/${leadgen_id}?fields=id,created_time,field_data,platform&access_token=${encodeURIComponent(
      pageAccessToken
    )}`;

    const graphResponse = await fetch(graphUrl);
    if (!graphResponse.ok) {
      const errorText = await graphResponse.text();
      console.error(`[WEBHOOK] [${source}] Meta Graph API error for lead ${leadgen_id}: Status ${graphResponse.status}`, errorText);
      throw new Error(`Meta Graph API error: Status ${graphResponse.status} - ${errorText}`);
    }

    leadData = (await graphResponse.json()) as MetaLeadData;
    logDebug(`[${source}] Graph API response received`, leadData);
  }

  // 4. Parse field_data to a clean object
  const fields: Record<string, string> = {};
  if (Array.isArray(leadData.field_data)) {
    for (const field of leadData.field_data) {
      if (field.name && Array.isArray(field.values) && field.values.length > 0) {
        fields[field.name.toLowerCase()] = field.values[0];
      }
    }
  }
  logDebug(`[${source}] Lead parsed correctly into field object`, fields);

  // Normalize lead variables
  const email = fields.email || fields.email_address || fields["email-address"] || "no-email@meta-lead.com";
  const name = fields.full_name || fields.name || `${fields.first_name || ""} ${fields.last_name || ""}`.trim() || "Meta Lead";
  const phone = fields.phone_number || fields.phone || fields["phone-number"] || "+0000000000";
  const company = fields.company_name || fields.company || "";
  const city = fields.city || "";
  const state = fields.state || "";
  const country = fields.country || "";

  // 5. Query for existing lead with metaLeadId to prevent duplicates
  const existingLead = await prisma.lead.findFirst({
    where: {
      metaLeadId: leadgen_id,
      isDeleted: false,
    },
  });

  if (existingLead) {
    logDebug(`[${source}] Duplicate lead detected. Updating existing Lead with ID: ${existingLead.id}`);
    const updatedLead = await prisma.lead.update({
      where: { id: existingLead.id },
      data: {
        name,
        phone,
        email,
        company: company || existingLead.company,
        city: city || existingLead.city,
        state: state || existingLead.state,
        country: country || existingLead.country,
        updatedAt: new Date(),
      },
    });
    logDebug(`[${source}] Lead saved in MongoDB (UPDATED).`, updatedLead);
    logDebug(`[${source}] Lead appears in the CRM dashboard.`);
  } else {
    logDebug(`[${source}] New lead detected. Running smart assignment...`);

    // Normalize lead source dynamically based on the platform from Meta
    let leadSource = "Facebook Ads"; // Default fallback
    if (leadData.platform === "ig") {
      leadSource = "Instagram Ads";
    } else if (leadData.platform === "messenger") {
      leadSource = "Messenger Ads";
    } else if (leadData.platform === "wa") {
      leadSource = "WhatsApp Ads";
    } else if (leadData.platform === "fb") {
      leadSource = "Facebook Ads";
    }

    // Evaluate smart assignment for new lead
    const assignedUser = await evaluateSmartAssignment({
      name,
      phone,
      email,
      company,
      city,
      state,
      country,
      leadSource,
    });

    logDebug(`[${source}] Smart assignment determined recipient: ${assignedUser.userName} (ID: ${assignedUser.userId})`);

    // Create new lead record
    const newLead = await prisma.lead.create({
      data: {
        tenantId: "tenant-1", // Default tenant ID matching system seeds
        workspaceId: "workspace-1", // Default workspace ID matching system seeds
        name,
        phone,
        email,
        company,
        city,
        state,
        country,
        leadSource,
        metaLeadId: leadgen_id,
        status: "NEW",
        priority: "MEDIUM",
        createdById: "user-admin", // Created by system admin profile
        assignedToId: assignedUser.userId,
        notes: `${leadSource.replace(" Ads", "")} Lead captured automatically via ${source}.\nLeadgen ID: ${leadgen_id}\nForm ID: ${form_id}\nPage ID: ${page_id}\nCreated Time: ${created_time}\nForm Fields: ${JSON.stringify(
          fields
        )}`,
      },
    });

    logDebug(`[${source}] Lead saved in MongoDB (CREATED).`, newLead);
    logDebug(`[${source}] Lead appears in the CRM dashboard under ${leadSource} source.`);
  }
}

/**
 * POST Handler - Processes webhook event payload from Facebook or Make.com
 */
export async function POST(request: Request) {
  let source: "Meta" | "Make.com" | "Unknown" = "Unknown";

  try {
    const rawBody = await request.text();
    logDebug("Webhook received raw body", rawBody);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch (e) {
      console.error("[WEBHOOK] Error parsing raw body JSON:", e);
      return NextResponse.json({ success: false, error: "Invalid JSON payload" }, { status: 400 });
    }

    // 1. Detect source automatically
    if (payload && payload.object === "page") {
      source = "Meta";
    } else if (payload && payload.event === "leadgen") {
      source = "Make.com";
    }

    console.log(`[WEBHOOK] Source: ${source}`);

    if (source === "Unknown") {
      console.warn("[WEBHOOK] Ignored event: Payload object is not 'page' and event is not 'leadgen'", payload);
      return NextResponse.json({ success: true, message: "Ignored unknown webhook source event" });
    }

    // 2. Process webhook based on source
    if (source === "Meta") {
      const appSecret = process.env.META_APP_SECRET;
      if (!appSecret) {
        console.error("[WEBHOOK] [Meta] META_APP_SECRET is not configured.");
        return NextResponse.json({ success: false, error: "Configuration error" }, { status: 500 });
      }

      const signatureHeader = request.headers.get("x-hub-signature-256");
      if (!signatureHeader) {
        console.warn("[WEBHOOK] [Meta] Missing x-hub-signature-256 header. Signature verification: FAILED");
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
      }

      const parts = signatureHeader.split("=");
      const algorithm = parts[0];
      const signature = parts[1];

      if (algorithm !== "sha256" || !signature) {
        console.warn("[WEBHOOK] [Meta] Invalid x-hub-signature-256 format. Signature verification: FAILED");
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
      }

      const expectedSignature = crypto
        .createHmac("sha256", appSecret)
        .update(rawBody)
        .digest("hex");

      const signatureBuffer = Buffer.from(signature, "hex");
      const expectedSignatureBuffer = Buffer.from(expectedSignature, "hex");

      if (
        signatureBuffer.length !== expectedSignatureBuffer.length ||
        !crypto.timingSafeEqual(signatureBuffer, expectedSignatureBuffer)
      ) {
        console.warn("[WEBHOOK] [Meta] Signature verification: FAILED");
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
      }

      console.log("[WEBHOOK] [Meta] Signature verification: SUCCESS");

      const entries = payload.entry || [];
      for (const entry of entries) {
        const changes = entry.changes || [];
        for (const change of changes) {
          if (change.field !== "leadgen") {
            logDebug("[Meta] Skipping event. Change field is not 'leadgen'", change.field);
            continue;
          }

          const value = change.value;
          if (!value) continue;

          const { leadgen_id, page_id, form_id, created_time } = value;

          if (!leadgen_id) {
            console.warn("[WEBHOOK] [Meta] Missing leadgen_id in event value.");
            continue;
          }

          console.log(`[WEBHOOK] [Meta] Extracted Lead: leadgen_id=${leadgen_id}, form_id=${form_id}, page_id=${page_id}, created_time=${created_time}`);

          await processLead({
            leadgen_id,
            form_id: form_id || "",
            page_id: page_id || "",
            created_time: created_time !== undefined ? created_time : "",
            source,
          });
        }
      }
    } else if (source === "Make.com") {
      const { leadgen_id, form_id, page_id, created_time } = payload;

      if (!leadgen_id) {
        console.warn("[WEBHOOK] [Make.com] Missing leadgen_id in simplified payload.");
        return NextResponse.json({ success: false, error: "Missing leadgen_id" }, { status: 400 });
      }

      console.log(`[WEBHOOK] [Make.com] Extracted Lead: leadgen_id=${leadgen_id}, form_id=${form_id}, page_id=${page_id}, created_time=${created_time}`);

      await processLead({
        leadgen_id,
        form_id: form_id || "",
        page_id: page_id || "",
        created_time: created_time !== undefined ? created_time : "",
        source,
      });
    }

    return NextResponse.json({ success: true, message: "Webhook processed successfully" });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[WEBHOOK] [${source}] Error processing webhook POST:`, error);
    return NextResponse.json(
      { success: false, error: errorMessage || "Internal Server Error" },
      { status: 500 }
    );
  }
}
