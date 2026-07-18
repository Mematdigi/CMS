import "./env-clean";
import { PrismaClient } from "@prisma/client";

declare global {
  var prismaClient: PrismaClient | undefined;
}

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
}

export function getPrisma(): PrismaClient {
  if (typeof window !== "undefined") {
    throw new Error("Prisma cannot be used in the browser.");
  }

  if (!globalThis.prismaClient) {
    globalThis.prismaClient = createPrismaClient();
  }

  return globalThis.prismaClient;
}
