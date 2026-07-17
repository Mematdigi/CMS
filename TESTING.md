# Testing & Verification Guide: Meta Lead Ads Webhook Integration

This document outlines how to test and verify the Facebook & Instagram Lead Ads integration, both offline locally and using Meta's official tools, without needing to run active paid ads.

---

## 1. Local Offline Testing (Recommended First Step)

The project includes a custom webhook event simulator script that calculates valid HMAC signatures and checks the database upsert logic.

### Steps
1. **Ensure the Dev Server is Running**:
   Start the Next.js development server:
   ```bash
   npm run dev
   ```
   *Make sure the server starts on `http://localhost:3000` (or update `CRM_URL` in `test-meta-webhook.js` if it binds to a different port).*

2. **Configure Local Environment variables** in your `.env` file:
   ```env
   META_VERIFY_TOKEN="my_secure_verify_token_123"
   META_APP_SECRET="my_fb_app_secret_abc"
   META_PAGE_ACCESS_TOKEN="mock_page_access_token_xyz"
   META_DEBUG="true"
   ```

3. **Run the Webhook Test Script**:
   ```bash
   node test-meta-webhook.js
   ```

4. **Verify the Debug Logs** in your Next.js dev server terminal:
   - **Webhook received**: `[META_WEBHOOK_DEBUG] Webhook received raw body...`
   - **Signature verified**: `[META_WEBHOOK_DEBUG] Signature verified successfully.`
   - **Graph API request mock sent**: `[META_WEBHOOK_DEBUG] Graph API request sent (MOCKED offline mode) for leadgen_id: lead_test_999`
   - **Graph API response mock received**: `[META_WEBHOOK_DEBUG] Graph API response received (MOCKED offline mode)`
   - **Lead parsed correctly**: `[META_WEBHOOK_DEBUG] Lead parsed correctly into field object...`
   - **Lead saved in MongoDB**: `[META_WEBHOOK_DEBUG] Lead saved in MongoDB (CREATED)` (or `(UPDATED)` if run repeatedly)
   - **Lead appears in CRM**: `[META_WEBHOOK_DEBUG] Lead appears in the CRM dashboard...`

5. **Verify in the Dashboard UI**:
   - Log into the CRM Dashboard (e.g. `http://localhost:3000/dashboard/leads` or `http://localhost:3001/dashboard/leads`).
   - You should see the lead **"Test Meta Lead"** with email **"test-lead@example.com"** and source **"Facebook Ads"** in the Leads table.

---

## 2. Testing End-to-End with Meta Lead Ads Testing Tool

You can test with Meta's official testing suite without running real ads.

### Prerequisites
- A Facebook Developer Account.
- A Facebook App configured in the App Dashboard.
- A Facebook Page where you have admin permissions.

### Setup Webhook with Meta:
1. Go to the [Meta App Dashboard](https://developers.facebook.com/).
2. Add the **Webhooks** product to your App.
3. Select **Page** from the dropdown menu and click **Subscribe to this object**.
4. Configure your callback parameters:
   - **Callback URL**: `https://<your-public-domain>/api/meta/webhook` 
     *(Use a tool like `ngrok` or `localtunnel` to expose your local Next.js server, e.g., `ngrok http 3000`)*
   - **Verify Token**: Must match the value in your `META_VERIFY_TOKEN` (e.g., `my_secure_verify_token_123`).
5. Click **Verify and Save**. Meta will send a GET request which will be verified automatically.
6. Once subscribed, find the field **leadgen** in the Page subscription list and click **Subscribe**.

### Using the Lead Ads Testing Tool:
1. Navigate to the [Meta Lead Ads Testing Tool](https://developers.facebook.com/tools/lead-ads-testing).
2. Select your **Page** and the **Form** you want to test.
3. Click **Create Lead**. This will generate a test lead and automatically fire the webhook payload to your endpoint.
4. Verify the logs in your terminal. Since you are using a real access token (`META_PAGE_ACCESS_TOKEN`), your endpoint will query the live Meta Graph API, retrieve the test fields, assign the lead via rules, and save it to MongoDB.
5. Click **Track Status** in the Testing Tool to verify that Meta received a successful `200 OK` response from your server.

---

## 3. Temporary Debug Logs & Production Removal

### Enabling Debug Logs
Verbose debug logs are controlled via the `META_DEBUG` environment variable in your `.env` file:
```env
META_DEBUG="true"
```
When `META_DEBUG` is set to `"true"` (or when `NODE_ENV` is `"development"`), debug messages prefixed with `[META_WEBHOOK_DEBUG]` are output to console.

### Disabling or Removing Logs for Production
To disable verbose debug logging, update your production environment variables:
- Set `META_DEBUG="false"` or omit the variable.
- Ensure `NODE_ENV` is set to `"production"`.

To permanently clean/remove the debug print calls from the codebase before pushing to Git, open [route.ts](file:///c:/Users/Lenovo/Desktop/lms/src/app/api/meta/webhook/route.ts) and:
1. Delete the `logDebug` helper function.
2. Remove any lines invoking `logDebug(...)`.
