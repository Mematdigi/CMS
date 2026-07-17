const crypto = require("crypto");

const CRM_URL = "http://localhost:3000/api/meta/webhook";
const VERIFY_TOKEN = "my_secure_verify_token_123";
const APP_SECRET = "my_fb_app_secret_abc";

// Helper to make requests in Node
async function makeRequest(url, method, headers, body) {
  const options = {
    method,
    headers: headers || {},
  };
  if (body) {
    options.body = typeof body === "string" ? body : JSON.stringify(body);
  }

  try {
    const res = await fetch(url, options);
    const text = await res.text();
    return {
      status: res.status,
      headers: Object.fromEntries(res.headers.entries()),
      body: text,
    };
  } catch (error) {
    return {
      status: 0,
      error: error.message,
    };
  }
}

async function runTests() {
  console.log("=== STARTING WEBHOOK INTEGRATION TESTS ===\n");
  console.log(`Target endpoint: ${CRM_URL}`);
  console.log(`Using VERIFY_TOKEN: ${VERIFY_TOKEN}`);
  console.log(`Using APP_SECRET: ${APP_SECRET}\n`);

  // Ensure env variables match what we are testing
  console.log("NOTE: Please make sure your .env has the following values configured before running:");
  console.log(`META_VERIFY_TOKEN="${VERIFY_TOKEN}"`);
  console.log(`META_APP_SECRET="${APP_SECRET}"`);
  console.log(`META_DEBUG="true"\n`);

  // ==========================================
  // TEST 1: GET Webhook Verification (Success)
  // ==========================================
  console.log("--- TEST 1: Webhook GET Verification (Correct Token) ---");
  const getSuccessUrl = `${CRM_URL}?hub.mode=subscribe&hub.verify_token=${VERIFY_TOKEN}&hub.challenge=challenge_12345`;
  const getSuccessResult = await makeRequest(getSuccessUrl, "GET");
  console.log(`Status: ${getSuccessResult.status}`);
  console.log(`Response body: "${getSuccessResult.body}"`);
  if (getSuccessResult.status === 200 && getSuccessResult.body === "challenge_12345") {
    console.log("✅ TEST 1 PASSED: Webhook verification successful!\n");
  } else {
    console.log("❌ TEST 1 FAILED: Could not verify webhook. Check if CRM dev server is running on port 3001.\n");
  }

  // ==========================================
  // TEST 2: GET Webhook Verification (Failure)
  // ==========================================
  console.log("--- TEST 2: Webhook GET Verification (Incorrect Token) ---");
  const getFailUrl = `${CRM_URL}?hub.mode=subscribe&hub.verify_token=wrong_token&hub.challenge=challenge_12345`;
  const getFailResult = await makeRequest(getFailUrl, "GET");
  console.log(`Status: ${getFailResult.status} (Expected: 403)`);
  if (getFailResult.status === 403) {
    console.log("✅ TEST 2 PASSED: Correctly blocked unauthorized token!\n");
  } else {
    console.log("❌ TEST 2 FAILED: Handled invalid verification token incorrectly.\n");
  }

  // ==========================================
  // TEST 3: POST Webhook Signature Verification (Failure)
  // ==========================================
  console.log("--- TEST 3: Webhook POST (Invalid Signature) ---");
  const postBody = {
    object: "page",
    entry: [
      {
        id: "page_123",
        time: Math.floor(Date.now() / 1000),
        changes: [
          {
            field: "leadgen",
            value: {
              ad_id: "ad_111",
              form_id: "form_222",
              leadgen_id: "lead_test_999",
              created_time: Math.floor(Date.now() / 1000),
              page_id: "page_123",
            },
          },
        ],
      },
    ],
  };

  const rawBodyString = JSON.stringify(postBody);
  const badHeaders = {
    "Content-Type": "application/json",
    "x-hub-signature-256": "sha256=invalidsignaturehere1234567890",
  };

  const postFailResult = await makeRequest(CRM_URL, "POST", badHeaders, rawBodyString);
  console.log(`Status: ${postFailResult.status} (Expected: 401)`);
  console.log(`Response body: ${postFailResult.body}`);
  if (postFailResult.status === 401) {
    console.log("✅ TEST 3 PASSED: Correctly rejected invalid request signature!\n");
  } else {
    console.log("❌ TEST 3 FAILED: Accepted request with invalid signature.\n");
  }

  // ==========================================
  // TEST 4: POST Webhook Lead Ingestion (Valid Signature)
  // ==========================================
  console.log("--- TEST 4: Webhook POST (Valid Signature) ---");
  const expectedSignature = crypto
    .createHmac("sha256", APP_SECRET)
    .update(rawBodyString)
    .digest("hex");

  const goodHeaders = {
    "Content-Type": "application/json",
    "x-hub-signature-256": `sha256=${expectedSignature}`,
  };

  console.log("Sending POST payload with valid signature...");
  const postSuccessResult = await makeRequest(CRM_URL, "POST", goodHeaders, rawBodyString);
  console.log(`Status: ${postSuccessResult.status}`);
  console.log(`Response body: ${postSuccessResult.body}`);

  console.log("\nNote on Lead Ingestion:");
  console.log("- If META_PAGE_ACCESS_TOKEN is not configured or is mock, the Graph API call will fail, which is expected during offline testing. You will see a Graph API error log in your Next.js console.");
  console.log("- Check your Next.js terminal logs to confirm 'Signature verified successfully' and 'Graph API request sent for leadgen_id: lead_test_999' was triggered.");
  console.log("\n=== TESTS COMPLETED ===");
}

runTests();
