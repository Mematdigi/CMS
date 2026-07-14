import Redis from "ioredis";

const redisHost = process.env.REDIS_HOST || "127.0.0.1";
const redisPort = parseInt(process.env.REDIS_PORT || "6379", 10);

declare global {
  var redisConnection: Redis | undefined;
}

export const redisConnection =
  globalThis.redisConnection ||
  new Redis({
    host: redisHost,
    port: redisPort,
    maxRetriesPerRequest: null, // Required by BullMQ
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.redisConnection = redisConnection;
}
