import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getWebrtcAccessTokenForAgent } from "@/lib/providers/telephony/exotel-webrtc.provider";

export const runtime = "nodejs";

// RE-ENABLED (2026-08-04): Exotel confirmed the account is live with test credits added.
// See the ivrfortius.com Click-to-Call fallback commented out below and in
// /api/calls/click-to-call, kept in case we need to switch back.

/**
 * Issues an Exotel WebRTC SDK access token for the logged-in agent's browser softphone.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const email = session.user.email;
    if (!email) {
      return NextResponse.json({ success: false, error: "Agent email is required for Exotel WebRTC calling." }, { status: 400 });
    }

    const { accessToken, userId } = await getWebrtcAccessTokenForAgent(email, session.user.name || email);

    return NextResponse.json({ success: true, accessToken, userId });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[Exotel WebRTC Token] Error:", message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// DISABLED (2026-08-04): ivrfortius.com Click-to-Call doesn't use a browser SDK token, so
// this route was previously stubbed out entirely while Exotel calling was disabled. Kept
// here, commented out, in case ivrfortius is revisited.
//
// export async function GET() {
//   return NextResponse.json(
//     { success: false, error: "Exotel WebRTC calling is disabled. Use /api/calls/click-to-call instead." },
//     { status: 410 }
//   );
// }
