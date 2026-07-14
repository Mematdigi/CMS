import PusherClient from "pusher-js";

const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY || "9368e187249ead24a777";
const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "ap2";

export const pusherClient = new PusherClient(pusherKey, {
  cluster: pusherCluster,
  forceTLS: true,
});
