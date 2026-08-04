import { NextResponse } from "next/server";

export const runtime = "nodejs";

// DISABLED (2026-08-04): Exotel confirmed the account is live with test credits added, so
// browser calling has switched back to Exotel WebRTC (see /api/calls/webrtc-token and
// src/app/dashboard/layout.tsx). This ivrfortius.com Click-to-Call route is no longer
// called by the dashboard layout, kept only so the implementation isn't lost.
export async function POST() {
  return NextResponse.json(
    { success: false, error: "ivrfortius Click-to-Call is disabled. Exotel browser calling is active instead." },
    { status: 410 }
  );
}

// import { getServerSession } from "next-auth/next";
// import { authOptions } from "@/lib/auth";
// import { triggerClickToCall } from "@/lib/providers/telephony/ivrfortius.provider";
//
// /**
//  * Triggers an ivrfortius.com Click-to-Call: rings the agent's configured number first,
//  * then bridges to the lead's phone once answered.
//  */
// export async function POST(request: Request) {
//   try {
//     const session = await getServerSession(authOptions);
//     if (!session || !session.user) {
//       return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
//     }
//
//     const { phone } = await request.json();
//     if (!phone) {
//       return NextResponse.json({ success: false, error: "phone is required" }, { status: 400 });
//     }
//
//     const result = await triggerClickToCall(phone);
//     if (!result.success) {
//       return NextResponse.json({ success: false, error: result.error }, { status: 502 });
//     }
//
//     return NextResponse.json({ success: true, callId: result.callId });
//   } catch (error) {
//     const message = error instanceof Error ? error.message : String(error);
//     console.error("[Click-to-Call] Error:", message);
//     return NextResponse.json({ success: false, error: message }, { status: 500 });
//   }
// }
