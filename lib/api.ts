const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4002";

export interface Patient {
  id: string;
  name: string;
  phoneNumber: string;
}

export interface ChatResponse {
  conversationId: string;
  reply: string;
  intent: string;
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ? JSON.stringify(body.error) : `Request failed: ${res.status}`);
  }
  return res.json();
}

export function getOrCreatePatient(name: string, phoneNumber: string): Promise<Patient> {
  return apiFetch<Patient>("/patients", {
    method: "POST",
    body: JSON.stringify({ name, phoneNumber }),
  });
}

export function sendChatMessage(params: {
  patientId: string;
  message: string;
  conversationId?: string;
}): Promise<ChatResponse> {
  return apiFetch<ChatResponse>("/chat", {
    method: "POST",
    body: JSON.stringify(params),
  });
}
