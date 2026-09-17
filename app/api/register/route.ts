import { NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4002";

// Thin proxy — the frontend never touches Postgres directly, the backend owns
// account creation (hashing, Patient/Doctor linkage) entirely.
export async function POST(request: Request) {
  const body = await request.text();

  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
