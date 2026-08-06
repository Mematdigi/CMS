// RE-ENABLED (2026-08-04): Exotel confirmed the account is live with test credits added,
// so browser-WebRTC calling is back in use — see src/app/dashboard/layout.tsx and
// src/app/api/calls/webrtc-token/route.ts. The ivrfortius.com Click-to-Call integration
// (src/lib/providers/telephony/ivrfortius.provider.ts) is commented out, not deleted, in
// case we need to fall back to it again.

const TOKEN_URL = "https://integrationscore.mum1.exotel.com/v2/integrations/token";
const USERMAPPING_URL = "https://integrationscore.mum1.exotel.com/v2/integrations/usermapping";
const APP_SETTING_URL = "https://integrationscore.mum1.exotel.com/v2/integrations/app_setting";

interface TokenResponse {
  Status: string;
  Code: number;
  Error?: string;
  Data: string;
}

async function requestToken(id: string, secret: string, entity: "customer" | "app"): Promise<string> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ Id: id, Secret: secret, Entity: entity }),
  });

  const data: TokenResponse = await res.json();
  if (!res.ok || data.Status !== "Success") {
    throw new Error(data.Error || `Failed to generate Exotel ${entity} token`);
  }
  return data.Data;
}

/** App-level token (90 day expiry). Required to register/manage users under the CRM WebRTC application. */
export async function getExotelAppToken(): Promise<string> {
  const appId = process.env.EXOTEL_WEBRTC_APP_ID || "";
  const appSecret = process.env.EXOTEL_WEBRTC_APP_SECRET || "";
  if (!appId || !appSecret) {
    throw new Error("Exotel WebRTC app is not configured (EXOTEL_WEBRTC_APP_ID / EXOTEL_WEBRTC_APP_SECRET missing).");
  }
  return requestToken(appId, appSecret, "app");
}

/**
 * Registers (or re-registers) a CRM agent as an Exotel WebRTC user so they can place/receive
 * SIP calls from the browser. Per Exotel's docs, the agent's email is used as the AppUserId.
 */
export async function registerExotelWebrtcUser(email: string, name: string): Promise<void> {
  const appToken = await getExotelAppToken();
  const accountSid = process.env.EXOTEL_ACCOUNT_SID || "";
  const virtualNumber = process.env.EXOTEL_EXOPHONE || "";

  const res = await fetch(USERMAPPING_URL, {
    method: "POST",
    headers: {
      Authorization: appToken,
      "Content-Type": "application/json",
    },
    body: JSON.stringify([
      {
        AppUserId: email,
        AppUsername: name,
        Email: email,
        ExotelAccountSid: accountSid,
        ExotelUserName: name,
        VirtualNumber: virtualNumber,
        AgentNumber: "",
      },
    ]),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.Error || data?.error || "Failed to register Exotel WebRTC user.");
  }
}

async function isUserRegistered(email: string): Promise<boolean> {
  const appToken = await getExotelAppToken();
  const res = await fetch(`${USERMAPPING_URL}?user_id=${encodeURIComponent(email)}`, {
    headers: { Authorization: appToken },
  });
  if (!res.ok) return false;
  const data = await res.json();
  return Boolean(data?.Data);
}

/** Configures a webhook URL / preference Exotel will call for inbound/outbound call lifecycle events. */
export async function setExotelAppSetting(key: string, value: string): Promise<void> {
  const appToken = await getExotelAppToken();
  const res = await fetch(APP_SETTING_URL, {
    method: "POST",
    headers: {
      Authorization: appToken,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ Key: key, Value: value }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.Error || data?.error || `Failed to set Exotel app setting "${key}".`);
  }
}

async function isAppSettingConfigured(): Promise<boolean> {
  const appToken = await getExotelAppToken();
  const res = await fetch(APP_SETTING_URL, {
    headers: { Authorization: appToken },
  });
  return res.status !== 404;
}

/**
 * ExotelCRMWebSDK.Initialize() does a GET on /v2/integrations/app_setting and fails with
 * "App setting not found" (404) if the app has never had a setting POSTed to it — this is
 * a one-time, app-level provisioning step separate from per-agent usermapping. Every time
 * Exotel has recreated our App (see project memory), this has needed redoing, so it's
 * checked/self-healed here instead of requiring a manual curl each time.
 * "record" enables call recording, which CallLog.recordingUrl expects.
 */
async function ensureAppSettingConfigured(): Promise<void> {
  const configured = await isAppSettingConfigured();
  if (!configured) {
    await setExotelAppSetting("record", "true");
  }
  await ensurePopupUrlConfigured();
}

/**
 * Registers our webhook as Exotel's "popup_url" — required for inbound PSTN calls to an
 * Exophone to route to a browser-registered agent (AppUserId) at all, per Exotel's
 * IP-PSTN Intermix WebRTC docs. Re-sent on every token fetch (cheap, idempotent) so it
 * self-heals the same way the "record" setting does whenever Exotel recreates our App.
 * Skipped when NEXTAUTH_URL is still localhost, since Exotel's servers can't reach that.
 */
async function ensurePopupUrlConfigured(): Promise<void> {
  const baseUrl = process.env.NEXTAUTH_URL || "";
  if (!baseUrl || baseUrl.includes("localhost")) {
    return;
  }
  await setExotelAppSetting("popup_url", `${baseUrl}/api/calls/exotel-webrtc-incoming`);
}

/**
 * Returns the access token + userId the browser SDK (ExotelCRMWebSDK) needs to initialize.
 * Lazily registers the agent as an Exotel WebRTC user and provisions the app_setting on
 * first call.
 */
export async function getWebrtcAccessTokenForAgent(email: string, name: string): Promise<{ accessToken: string; userId: string }> {
  await ensureAppSettingConfigured();

  const registered = await isUserRegistered(email);
  if (!registered) {
    await registerExotelWebrtcUser(email, name);
  }

  const accessToken = await getExotelAppToken();
  return { accessToken, userId: email };
}
