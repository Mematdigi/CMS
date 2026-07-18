import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";

const handler = NextAuth(authOptions);

async function authHandler(req: Request, ctx: any) {
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") || "https";
  
  if (host && !host.includes("localhost") && !host.includes("127.0.0.1")) {
    process.env.NEXTAUTH_URL = `${proto}://${host}`;
  }
  
  return handler(req, ctx);
}

export { authHandler as GET, authHandler as POST };

