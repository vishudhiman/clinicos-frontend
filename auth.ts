import NextAuth, { type DefaultSession } from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import type { Provider } from "next-auth/providers";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4002";
const INTERNAL_API_SECRET = process.env.INTERNAL_API_SECRET;

export type Role = "ADMIN" | "DOCTOR" | "PATIENT";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      doctorId: string | null;
      patientId: string | null;
    } & DefaultSession["user"];
    // The backend-issued JWT — every direct call to clinicos-backend must forward this.
    accessToken: string;
  }
}

interface AppToken {
  id: string;
  role: Role;
  doctorId: string | null;
  patientId: string | null;
  accessToken: string;
}

interface BackendUser {
  id: string;
  name: string | null;
  email: string | null;
  role: Role;
  doctorId: string | null;
  patientId: string | null;
}

interface BackendAuthResponse {
  user: BackendUser;
  token: string;
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

      const { user, token } = (await res.json()) as BackendAuthResponse;
      return { ...user, accessToken: token };
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
// This is a server-to-server call (no user token exists yet), gated by a shared secret.
async function upsertOAuthUser(
  email: string,
  name?: string | null
): Promise<BackendAuthResponse | null> {
  if (!INTERNAL_API_SECRET) {
    throw new Error("INTERNAL_API_SECRET environment variable is required for Google sign-in");
  }
  const res = await fetch(`${API_URL}/auth/oauth`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-internal-secret": INTERNAL_API_SECRET },
    body: JSON.stringify({ email, name: name ?? undefined }),
  });
  if (!res.ok) return null;
  return (await res.json()) as BackendAuthResponse;
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers,
  callbacks: {
    async jwt({ token, user, account }) {
      const t = token as typeof token & Partial<AppToken>;

      if (account?.provider === "google" && user?.email) {
        const result = await upsertOAuthUser(user.email, user.name);
        if (result) {
          t.id = result.user.id;
          t.role = result.user.role;
          t.doctorId = result.user.doctorId;
          t.patientId = result.user.patientId;
          t.accessToken = result.token;
        }
        return t;
      }

      if (user) {
        const u = user as BackendUser & { accessToken: string };
        t.id = u.id;
        t.role = u.role;
        t.doctorId = u.doctorId;
        t.patientId = u.patientId;
        t.accessToken = u.accessToken;
      }
      return t;
    },
    async session({ session, token }) {
      const t = token as typeof token & AppToken;
      session.user.id = t.id;
      session.user.role = t.role;
      session.user.doctorId = t.doctorId;
      session.user.patientId = t.patientId;
      session.accessToken = t.accessToken;
      return session;
    },
  },
});

export const isGoogleAuthEnabled = Boolean(
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
);
