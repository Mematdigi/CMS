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
 * POST Handler - Processes webhook event payload from Facebook
 */
export async function POST(request: Request) {
  const prisma = getPrisma();
  let rawBody = "";

  try {
    rawBody = await request.text();
    logDebug("Webhook received raw body", rawBody);

    // 1. Signature Verification using App Secret
    const appSecret = process.env.META_APP_SECRET;
    if (!appSecret) {
      console.error("[META_WEBHOOK] META_APP_SECRET is not configured.");
      return NextResponse.json({ success: false, error: "Configuration error" }, { status: 500 });
    }

    const signatureHeader = request.headers.get("x-hub-signature-256");
    if (!signatureHeader) {
      console.warn("[META_WEBHOOK] Missing x-hub-signature-256 header.");
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const parts = signatureHeader.split("=");
    const algorithm = parts[0];
    const signature = parts[1];

    if (algorithm !== "sha256" || !signature) {
      console.warn("[META_WEBHOOK] Invalid x-hub-signature-256 format.");
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
      console.warn("[META_WEBHOOK] Signature verification failed.");
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    logDebug("Signature verified successfully.");

    // 2. Parse payload
    const payload = JSON.parse(rawBody);

    // Filter only Facebook Page leadgen events
    if (payload.object !== "page") {
      logDebug("Skipping event. Payload object is not 'page'", payload.object);
      return NextResponse.json({ success: true, message: "Ignored non-page object event" });
    }

    const pageAccessToken = process.env.META_PAGE_ACCESS_TOKEN;
    if (!pageAccessToken) {
      console.error("[META_WEBHOOK] META_PAGE_ACCESS_TOKEN is not configured.");
      return NextResponse.json({ success: false, error: "Configuration error" }, { status: 500 });
    }

    const entries = payload.entry || [];
    for (const entry of entries) {
      const changes = entry.changes || [];
      for (const change of changes) {
        if (change.field !== "leadgen") {
          logDebug("Skipping event. Change field is not 'leadgen'", change.field);
          continue;
        }

        const value = change.value;
        if (!value) continue;

        const { leadgen_id, page_id, form_id } = value;
        logDebug("Extracted Event metadata", { leadgen_id, page_id, form_id });

        if (!leadgen_id) {
          console.warn("[META_WEBHOOK] Missing leadgen_id in event value.");
          continue;
        }

        let leadData: MetaLeadData;

        // 3. Fetch lead details from the Meta Graph API (or use Mock if configured or test lead ID)
        if (pageAccessToken === "mock_page_access_token_xyz" || leadgen_id.startsWith("lead_test_")) {
          logDebug("Graph API request sent (MOCKED offline mode) for leadgen_id: " + leadgen_id);
          leadData = {
            id: leadgen_id,
            created_time: new Date().toISOString(),
            platform: leadgen_id.includes("instagram") ? "ig" : "fb",
            field_data: [
              { name: "email", values: ["test-lead@example.com"] },
              { name: "full_name", values: ["Test Meta Lead"] },
              { name: "phone_number", values: ["+15559876543"] },
              { name: "company_name", values: ["Test Company Inc"] },
              { name: "city", values: ["London"] }
            ]
          };
          logDebug("Graph API response received (MOCKED offline mode)", leadData);
        } else {
          logDebug(`Graph API request sent for leadgen_id: ${leadgen_id}`);
          const graphUrl = `https://graph.facebook.com/v20.0/${leadgen_id}?fields=id,created_time,field_data,platform&access_token=${encodeURIComponent(
            pageAccessToken
          )}`;

          const graphResponse = await fetch(graphUrl);
          if (!graphResponse.ok) {
            const errorText = await graphResponse.text();
            console.error(`[META_WEBHOOK] Meta Graph API error for lead ${leadgen_id}: Status ${graphResponse.status}`, errorText);
            continue; // Move to next leadgen change event
          }

          leadData = (await graphResponse.json()) as MetaLeadData;
          logDebug("Graph API response received", leadData);
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
        logDebug("Lead parsed correctly into field object", fields);

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
          logDebug(`Duplicate lead detected. Updating existing Lead with ID: ${existingLead.id}`);
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
          logDebug("Lead saved in MongoDB (UPDATED).", updatedLead);
          logDebug("Lead appears in the CRM dashboard.");
        } else {
          logDebug("New lead detected. Running smart assignment...");

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

          logDebug(`Smart assignment determined recipient: ${assignedUser.userName} (ID: ${assignedUser.userId})`);

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
              notes: `${leadSource.replace(" Ads", "")} Lead captured automatically.\nLeadgen ID: ${leadgen_id}\nForm ID: ${form_id}\nPage ID: ${page_id}\nForm Fields: ${JSON.stringify(
                fields
              )}`,
            },
          });

          logDebug("Lead saved in MongoDB (CREATED).", newLead);
          logDebug(`Lead appears in the CRM dashboard under ${leadSource} source.`);
        }
      }
    }

    return NextResponse.json({ success: true, message: "Webhook processed successfully" });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[META_WEBHOOK] Error processing webhook POST:", error);
    return NextResponse.json(
      { success: false, error: errorMessage || "Internal Server Error" },
      { status: 500 }
    );
  }
}
