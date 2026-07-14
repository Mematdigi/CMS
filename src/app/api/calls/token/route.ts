import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";

/**
 * Generates a Twilio Access Token with Voice grant.
 * The browser Twilio Voice SDK uses this to authenticate and place outbound calls.
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const twimlAppSid = process.env.TWILIO_TWIML_APP_SID;
    const apiKeySid = process.env.TWILIO_API_KEY_SID;
    const apiKeySecret = process.env.TWILIO_API_KEY_SECRET;

    if (!accountSid || !authToken) {
      return NextResponse.json(
        { success: false, error: "Twilio not configured" },
        { status: 500 }
      );
    }

    // Dynamically import Twilio to avoid build issues
    const twilio = await import("twilio");
    const AccessToken = twilio.default.jwt.AccessToken;
    const VoiceGrant = AccessToken.VoiceGrant;

    const identity = (session.user as any).id || "crm-agent";

    const voiceGrant = new VoiceGrant({
      outgoingApplicationSid: twimlAppSid,
      incomingAllow: true,
    });

    const token = new AccessToken(
      accountSid,
      apiKeySid || accountSid,       // fallback to accountSid if no API key
      apiKeySecret || authToken,     // fallback to authToken if no API secret
      { identity, ttl: 3600 }
    );

    token.addGrant(voiceGrant);

    return NextResponse.json({
      success: true,
      token: token.toJwt(),
      identity,
    });
  } catch (error: any) {
    console.error("[Calls Token] Error generating token:", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
