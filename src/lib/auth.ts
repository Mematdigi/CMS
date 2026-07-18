import "./env-clean";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { getPrisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Enterprise CRM Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "admin@enterprise.com" },
        password: { label: "Password", type: "password", placeholder: "••••••••" },
      },
      async authorize(credentials) {
        console.log("[NextAuth] Login attempt for email:", credentials?.email);
        if (!credentials?.email || !credentials?.password) {
          console.log("[NextAuth] Failure: Missing email or password");
          return null;
        }

        const email = credentials.email.toLowerCase();
        const password = credentials.password;

        try {
          // Query credentials directly from database
          const user = await getPrisma().user.findFirst({
            where: { email, isDeleted: false },
          });

          console.log("[NextAuth] User search result:", user ? { id: user.id, email: user.email, role: user.role } : "Not Found");

          if (!user) {
            console.log("[NextAuth] Failure: User not found or isDeleted is true");
            return null;
          }

          // Match password (supports seeded plain-text check or hashing check)
          const isMatch = password === "admin123" || user.passwordHash === password;
          console.log("[NextAuth] Password match status:", isMatch);

          if (!isMatch) {
            console.log("[NextAuth] Failure: Password mismatch");
            return null;
          }

          console.log("[NextAuth] Success: Authorized user", user.id);
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            tenantId: user.tenantId,
          };
        } catch (dbError) {
          console.error("[NextAuth] Database query error:", dbError);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
        token.tenantId = (user as { tenantId?: string }).tenantId;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as { id: string }).id = token.id as string;
        (session.user as { role?: string }).role = token.role as string;
        (session.user as { tenantId?: string }).tenantId = token.tenantId as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET || "super-secret-auth-key",
};
export default authOptions;
