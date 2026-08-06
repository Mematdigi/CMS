import { useCRMStore } from "@/lib/store/useCRMStore";


export async function dialLead(leadId: string, leadName: string): Promise<void> {
  try {
    const res = await fetch(`/api/leads/${leadId}/dial-phone`);
    const json = await res.json();
    if (!json.success || !json.phone) {
      // failCall() only updates an existing activeCall, so a lookup failure before any
      // call has started needs to set the failed state directly to actually show up in
      // the call widget instead of failing silently.
      useCRMStore.setState({
        activeCall: {
          leadId,
          leadName,
          phone: "",
          durationSec: 0,
          status: "failed",
          error: json.error || "Could not resolve a dialable phone number for this lead.",
        },
      });
      return;
    }
    useCRMStore.getState().startCall(leadId, leadName, json.phone);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    useCRMStore.setState({
      activeCall: { leadId, leadName, phone: "", durationSec: 0, status: "failed", error: message },
    });
  }
}
