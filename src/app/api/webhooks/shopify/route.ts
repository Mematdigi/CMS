import { NextResponse } from "next/server";
import crypto from "crypto";
import { getPrisma } from "@/lib/prisma";
import { evaluateSmartAssignment } from "@/lib/smart-assignment";

export const runtime = "nodejs";

interface ShopifyLineItemProperty {
  name: string;
  value: string;
}

interface ShopifyLineItem {
  title: string;
  quantity: number;
  price: string;
  variant_id: number | string | null;
  product_id: number | string | null;
  properties?: ShopifyLineItemProperty[];
}

interface ShopifyAddress {
  name?: string;
  phone?: string;
}

interface ShopifyCustomer {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
}

interface ShopifyOrder {
  id: number | string;
  order_number?: number | string;
  name?: string;
  email?: string;
  phone?: string;
  financial_status?: string;
  currency?: string;
  total_price?: string;
  customer?: ShopifyCustomer;
  shipping_address?: ShopifyAddress;
  line_items?: ShopifyLineItem[];
}

function logDebug(message: string, data?: unknown) {
  if (process.env.SHOPIFY_DEBUG === "true" || process.env.NODE_ENV === "development") {
    console.log(`[SHOPIFY_WEBHOOK_DEBUG] ${message}`, data ? JSON.stringify(data, null, 2) : "");
  }
}

/**
 * GET Handler - Simple health check for the Shopify webhook endpoint.
 * Shopify does not call GET for verification (unlike Meta); this is just
 * useful for confirming the route is deployed and reachable.
 */
export async function GET() {
  return new Response("Shopify Orders Webhook endpoint is active.", {
    status: 200,
    headers: { "Content-Type": "text/plain" },
  });
}

function buildLineItemNote(order: ShopifyOrder, item: ShopifyLineItem, shopDomain: string) {
  const lines: string[] = [];
  lines.push(`Action: Order ${order.financial_status || "placed"}`);
  lines.push(`Order Number: ${order.name || order.order_number || order.id}`);
  if (shopDomain && item.product_id) {
    lines.push(`Product URL: https://${shopDomain}/admin/products/${item.product_id}`);
  }
  lines.push(`Product: ${item.title}`);
  if (item.variant_id) lines.push(`Variant ID: ${item.variant_id}`);
  lines.push(`Quantity: ${item.quantity}`);
  lines.push(`Price: ${item.price}`);

  if (item.properties && item.properties.length > 0) {
    lines.push(`--- Customizations ---`);
    for (const prop of item.properties) {
      if (prop.name && prop.value) lines.push(`${prop.name}: ${prop.value}`);
    }
  }

  return lines.join("\n");
}

/**
 * POST Handler - Processes Shopify `orders/create` (and `orders/paid`) webhook events.
 */
export async function POST(request: Request) {
  const prisma = getPrisma();
  let rawBody = "";

  try {
    rawBody = await request.text();
    logDebug("Webhook received raw body", rawBody);

    // 1. Signature verification using the Shopify webhook shared secret
    const webhookSecret = process.env.SHOPIFY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("[SHOPIFY_WEBHOOK] SHOPIFY_WEBHOOK_SECRET is not configured.");
      return NextResponse.json({ success: false, error: "Configuration error" }, { status: 500 });
    }

    const hmacHeader = request.headers.get("x-shopify-hmac-sha256");
    if (!hmacHeader) {
      console.warn("[SHOPIFY_WEBHOOK] Missing X-Shopify-Hmac-Sha256 header.");
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const expectedDigest = crypto.createHmac("sha256", webhookSecret).update(rawBody, "utf8").digest("base64");

    const providedBuffer = Buffer.from(hmacHeader, "base64");
    const expectedBuffer = Buffer.from(expectedDigest, "base64");

    if (
      providedBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(providedBuffer, expectedBuffer)
    ) {
      console.warn("[SHOPIFY_WEBHOOK] Signature verification failed.");
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    logDebug("Signature verified successfully.");

    // 2. Parse payload
    const order = JSON.parse(rawBody) as ShopifyOrder;
    const shopDomain = request.headers.get("x-shopify-shop-domain") || process.env.SHOPIFY_STORE_DOMAIN || "";
    const orderId = String(order.id);

    if (!orderId) {
      return NextResponse.json({ success: false, error: "Missing order id" }, { status: 400 });
    }

    // 3. Normalize customer fields
    const customer = order.customer;
    const name =
      `${customer?.first_name || ""} ${customer?.last_name || ""}`.trim() ||
      order.shipping_address?.name ||
      "Shopify Customer";
    const email = order.email || customer?.email || "no-email@shopify-order.com";
    const phone = order.phone || customer?.phone || order.shipping_address?.phone || "0000000000";

    const lineItems = order.line_items || [];
    const notes = lineItems.length
      ? lineItems.map((item) => buildLineItemNote(order, item, shopDomain)).join("\n\n")
      : `Action: Order ${order.financial_status || "placed"}\nOrder Number: ${order.name || order.order_number || order.id}`;

    const productName = lineItems[0]?.title || "";
    const budget = order.total_price ? parseFloat(order.total_price) : 0;

    // 4. Dedupe on shopifyOrderId — update if we've already recorded this order
    const existingLead = await prisma.lead.findFirst({
      where: { shopifyOrderId: orderId, isDeleted: false },
    });

    if (existingLead) {
      logDebug(`Existing lead found for Shopify order ${orderId}. Updating Lead ID: ${existingLead.id}`);
      const updatedLead = await prisma.lead.update({
        where: { id: existingLead.id },
        data: {
          name,
          phone,
          email,
          notes,
          budget,
          updatedAt: new Date(),
        },
      });
      logDebug("Lead updated from Shopify order webhook.", updatedLead);
      return NextResponse.json({ success: true, message: "Lead updated" });
    }

    logDebug("New Shopify order detected. Running smart assignment...");
    const assignedUser = await evaluateSmartAssignment({
      name,
      phone,
      email,
      productName,
      budget,
      leadSource: "Shopify Store",
      notes,
    });

    const newLead = await prisma.lead.create({
      data: {
        tenantId: "tenant-1",
        workspaceId: "workspace-1",
        name,
        phone,
        email,
        budget,
        leadSource: "Shopify Store",
        shopifyOrderId: orderId,
        status: "NEW",
        priority: "HIGH",
        createdById: "user-admin",
        assignedToId: assignedUser.userId,
        notes,
      },
    });

    logDebug("Lead created from Shopify order webhook.", newLead);
    return NextResponse.json({ success: true, message: "Lead created" }, { status: 201 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[SHOPIFY_WEBHOOK] Error processing webhook POST:", error);
    return NextResponse.json({ success: false, error: errorMessage || "Internal Server Error" }, { status: 500 });
  }
}
