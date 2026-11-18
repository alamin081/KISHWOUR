import NextAuth, { CredentialsSignin, type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";

import { db } from "@/lib/db";

import { verifyPassword } from "./password";
import { isStaffRole, type StaffRole } from "./permissions";

declare module "next-auth" {
  interface Session {
    user: { id: string; role: StaffRole } & DefaultSession["user"];
  }
  interface User {
    role?: StaffRole;
  }
}

const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: z.string().min(1).max(200),
});

class InvalidLogin extends CredentialsSignin {
  override code = "invalid_credentials";
}

// A real scrypt hash of a random string, used to keep response time constant when the
// email does not exist (prevents account enumeration by timing).
const DUMMY_HASH =
  "scrypt$131072$8$1$AAAAAAAAAAAAAAAAAAAAAA==$9JqzQn1sG2w4l6pY0b1q9lq8eV0c8f0m3o2YQ7g5d0Y1QeG8tW0E7sXvZfYl3i5cJ6mR0yH2kN4pL8uA1bC3dQ==";

/**
 * Auth.js (v5) — staff sign-in with email + password, JWT sessions (no session table writes,
 * so it also works with the HTTPS database driver). Authorization is re-checked against the
 * database on every admin request (see ./session.ts).
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  pages: { signIn: "/admin/login" },
  trustHost: true,
  providers: [
    Credentials({
      credentials: { email: { type: "email" }, password: { type: "password" } },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) throw new InvalidLogin();
        const { email, password } = parsed.data;

        const user = await db.user.findUnique({
          where: { email },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
            passwordHash: true,
          },
        });

        const ok = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);
        if (!user || !ok || !user.isActive || !isStaffRole(user.role))
          throw new InvalidLogin();

        return { id: user.id, name: user.name, email: user.email, role: user.role };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user?.id) {
        token.sub = user.id;
        token["role"] = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      const role = token["role"];
      if (isStaffRole(role)) session.user.role = role;
      return session;
    },
  },
});
