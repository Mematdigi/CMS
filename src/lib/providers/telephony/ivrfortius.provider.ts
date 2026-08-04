// DISABLED (2026-08-04): Exotel confirmed the account is live with test credits added, so
// browser calling has switched back to Exotel WebRTC (see exotel-webrtc.provider.ts /
// exotel-webrtc-client.ts). Kept here, commented out, in case ivrfortius.com is revisited.
//
// // ivrfortius.com Click-to-Call integration — replaces the Exotel browser-WebRTC calling
// // setup (see exotel-webrtc.provider.ts / exotel-webrtc-client.ts, now disabled).
// //
// // The vendor's ClickToCall API is a simple GET trigger: it rings the configured agent
// // number first, and once answered, bridges the call to the lead's number. There's no
// // browser SDK, live in-call audio, or (as far as we've confirmed) pickup webhook — the
// // CRM just fires the request and marks the call "connected" once the trigger succeeds.
// //
// // Confirmed response shape (tested against the real endpoint 2026-08-03):
// //   { "ErrorCode": "000", "ErrorMessage": "Success#<call-id>" }
// //
// // NOTE: ivrfortius has no public API docs. Param mapping (`caller` = lead's number,
// // `agent` = our fixed agent number) is our best-effort reading of the example call the
// // vendor sent us — confirm with their support if calls come out bridged backwards.
// //
// // ivrfortius support instructed both `caller` and `agent` be sent with a leading "0"
// // (e.g. 09136797555) — the API itself accepts numbers with or without it, but their
// // internal call routing apparently expects the 0-prefixed form.
//
// const CLICK_TO_CALL_URL = "http://ivrfortius.com/api/ClickToCall";
//
// interface ClickToCallResult {
//   success: boolean;
//   callId?: string;
//   error?: string;
// }
//
// function normalizeIndianNumber(phone: string): string {
//   const digits = phone.replace(/\D/g, "");
//   const tenDigit = digits.length > 10 ? digits.slice(-10) : digits;
//   return tenDigit ? `0${tenDigit}` : "";
// }
//
// export async function triggerClickToCall(leadPhone: string): Promise<ClickToCallResult> {
//   const apiKey = process.env.IVRFORTIUS_API_KEY || "";
//   const agentNumber = process.env.IVRFORTIUS_AGENT_NUMBER || "";
//
//   if (!apiKey || !agentNumber) {
//     return {
//       success: false,
//       error: "ivrfortius Click-to-Call is not configured (IVRFORTIUS_API_KEY / IVRFORTIUS_AGENT_NUMBER missing).",
//     };
//   }
//
//   const caller = normalizeIndianNumber(leadPhone);
//   if (!caller) {
//     return { success: false, error: "Invalid lead phone number." };
//   }
//
//   const agent = normalizeIndianNumber(agentNumber);
//
//   const url = `${CLICK_TO_CALL_URL}?apiKey=${encodeURIComponent(apiKey)}&caller=${encodeURIComponent(caller)}&agent=${encodeURIComponent(agent)}`;
//
//   try {
//     const res = await fetch(url);
//     const data = await res.json().catch(() => null) as { ErrorCode?: string; ErrorMessage?: string } | null;
//
//     if (!res.ok || !data || data.ErrorCode !== "000") {
//       return {
//         success: false,
//         error: data?.ErrorMessage || `ivrfortius Click-to-Call failed (HTTP ${res.status}).`,
//       };
//     }
//
//     const callId = (data.ErrorMessage || "").split("#")[1];
//     return { success: true, callId };
//   } catch (err) {
//     const message = err instanceof Error ? err.message : String(err);
//     return { success: false, error: message };
//   }
// }
