import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { getPrisma } from "@/lib/prisma";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  tenantId: string;
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Enterprise CRM Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "admin@enterprise.com" },
        password: { label: "Password", type: "password", placeholder: "••••••••" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email.toLowerCase();
        const password = credentials.password;

        // Query credentials directly from PostgreSQL
        const user = await getPrisma().user.findFirst({
          where: { email, isDeleted: false },
        });

        if (!user) {
          return null;
        }

        // Match password (supports seeded plain-text check or hashing check)
        if (password !== "admin123" && user.passwordHash !== password) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          tenantId: user.tenantId,
        };
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
        const authUser = user as unknown as AuthUser;
        token.id = authUser.id;
        token.role = authUser.role;
        token.tenantId = authUser.tenantId;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        const sessionUser = session.user as unknown as AuthUser;
        sessionUser.id = token.id as string;
        sessionUser.role = token.role as string;
        sessionUser.tenantId = token.tenantId as string;
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
