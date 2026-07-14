import Pusher from "pusher";

const appId = process.env.PUSHER_APP_ID || "";
const key = process.env.PUSHER_KEY || "";
const secret = process.env.PUSHER_SECRET || "";
const cluster = process.env.PUSHER_CLUSTER || "mt1";

declare global {
  var pusherInstance: Pusher | undefined;
}

export const pusherServer =
  globalThis.pusherInstance ||
  new Pusher({
    appId,
    key,
    secret,
    cluster,
    useTLS: true,
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.pusherInstance = pusherServer;
}

export async function triggerRealtimeNotification(userId: string, eventName: string, data: any) {
  try {
    if (!appId || !key || !secret) {
      console.warn(`[Pusher WebSocket Server] Missing credentials. Simulating event ${eventName}...`);
      return;
    }
    await pusherServer.trigger(`private-user-${userId}`, eventName, data);
  } catch (err: any) {
    console.error("[Pusher WebSocket Server] Error triggering event:", err.message);
  }
}
