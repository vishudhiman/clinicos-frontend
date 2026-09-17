import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4002";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.user.role === "PATIENT" && session.user.patientId) {
    const res = await fetch(`${API_URL}/auth/profile?patientId=${session.user.patientId}`, {
      headers: { Authorization: `Bearer ${session.accessToken}` },
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  }

  return NextResponse.json({
    name: session.user.name,
    email: session.user.email,
    phoneNumber: null,
    memberSince: null,
  });
}

const updateSchema = z.object({
  name: z.string().min(1),
  phoneNumber: z.string().optional(),
});

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.user.role !== "PATIENT" || !session.user.patientId) {
    return NextResponse.json({ error: "Only patient profiles can be edited here." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const res = await fetch(`${API_URL}/auth/profile`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.accessToken}`,
    },
    body: JSON.stringify({ patientId: session.user.patientId, ...parsed.data }),
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
