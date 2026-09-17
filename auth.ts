import NextAuth, { type DefaultSession } from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import type { Provider } from "next-auth/providers";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4002";

export type Role = "ADMIN" | "DOCTOR" | "PATIENT";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      doctorId: string | null;
      patientId: string | null;
    } & DefaultSession["user"];
  }
}

interface AppToken {
  id: string;
  role: Role;
  doctorId: string | null;
  patientId: string | null;
}

interface BackendUser {
  id: string;
  name: string | null;
  email: string | null;
  role: Role;
  doctorId: string | null;
  patientId: string | null;
}

const providers: Provider[] = [
  Credentials({
    name: "Email and password",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    authorize: async (credentials) => {
      const email = credentials?.email as string | undefined;
      const password = credentials?.password as string | undefined;
      if (!email || !password) return null;

      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) return null;

      return (await res.json()) as BackendUser;
    },
  }),
];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
}

// Every account (Credentials or Google) lives entirely in the backend's database.
// The frontend never touches Postgres directly — it only ever talks to the backend API.
async function upsertOAuthUser(email: string, name?: string | null): Promise<BackendUser | null> {
  const res = await fetch(`${API_URL}/auth/oauth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, name: name ?? undefined }),
  });
  if (!res.ok) return null;
  return (await res.json()) as BackendUser;
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers,
  callbacks: {
    async jwt({ token, user, account }) {
      const t = token as typeof token & Partial<AppToken>;

      if (account?.provider === "google" && user?.email) {
        const dbUser = await upsertOAuthUser(user.email, user.name);
        if (dbUser) {
          t.id = dbUser.id;
          t.role = dbUser.role;
          t.doctorId = dbUser.doctorId;
          t.patientId = dbUser.patientId;
        }
        return t;
      }

      if (user) {
        const u = user as BackendUser;
        t.id = u.id;
        t.role = u.role;
        t.doctorId = u.doctorId;
        t.patientId = u.patientId;
      }
      return t;
    },
    async session({ session, token }) {
      const t = token as typeof token & AppToken;
      session.user.id = t.id;
      session.user.role = t.role;
      session.user.doctorId = t.doctorId;
      session.user.patientId = t.patientId;
      return session;
    },
  },
});

export const isGoogleAuthEnabled = Boolean(
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
);
