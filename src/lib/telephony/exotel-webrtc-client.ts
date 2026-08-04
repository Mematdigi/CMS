// RE-ENABLED (2026-08-04): Exotel confirmed the account is live with test credits added,
// so browser-WebRTC calling is back in use (see src/lib/providers/telephony/exotel-webrtc.provider.ts
// and src/app/api/calls/click-to-call/route.ts, now disabled/commented out).

// Thin browser-only wrapper around Exotel's CRM WebRTC SDK.
// Any failure here (token missing, user not yet provisioned on Exotel's side, etc.)
// should be treated as "softphone unavailable" by callers, who fall back to click-to-call.

export type WebrtcCallEvent = "incoming" | "connected" | "callEnded" | "holdtoggle" | "mutetoggle";

export interface WebrtcCallDetails {
  callId: string;
  remoteId: string;
  remoteDisplayName: string;
  callDirection: string;
  callState: string;
  callFromNumber?: string;
}

export interface ExotelWebPhone {
  RegisterDevice: () => void;
  UnRegisterDevice: () => void;
  AcceptCall: () => void;
  HangupCall: () => void;
  MakeCall: (number: string, callback: (status: "success" | "failed", data: unknown) => void) => Promise<void>;
}

export async function initExotelWebPhone(
  accessToken: string,
  userId: string,
  onCallEvent: (event: WebrtcCallEvent, details: WebrtcCallDetails) => void,
  onRegisterEvent?: (state: string) => void
): Promise<ExotelWebPhone | null> {
  const { default: ExotelCRMWebSDK } = await import("@exotel-npm-dev/exotel-ip-calling-crm-websdk");

  const sdk = new ExotelCRMWebSDK(accessToken, userId, true);
  // Must be called as sdk.Initialize(...), not extracted into a standalone function
  // reference first — the SDK class uses private (#) fields internally, so calling the
  // method detached from its `sdk` receiver throws "Cannot read private member from an
  // object whose class did not declare it".
  // The SDK's shipped .d.ts also mistypes softPhoneRegisterEventCallBack as `null`-only
  // even though the implementation accepts a callback; cast to work around that bug.
  const initialize = sdk.Initialize.bind(sdk) as (
    listener: typeof onCallEvent,
    registerCb: typeof onRegisterEvent | null
  ) => Promise<ExotelWebPhone | void>;
  const webPhone = await initialize(onCallEvent, onRegisterEvent || null);

  if (!webPhone) {
    return null;
  }
  return webPhone as unknown as ExotelWebPhone;
}
