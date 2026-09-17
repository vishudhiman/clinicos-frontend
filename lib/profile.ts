export interface ProfileData {
  name: string;
  email: string | null;
  phoneNumber: string | null;
  memberSince: string | null;
}

export async function getProfile(): Promise<ProfileData> {
  const res = await fetch("/api/profile");
  if (!res.ok) throw new Error("Failed to load profile");
  return res.json();
}

export async function updateProfile(input: { name: string; phoneNumber?: string }): Promise<ProfileData> {
  const res = await fetch("/api/profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(typeof body.error === "string" ? body.error : "Failed to update profile");
  }
  return res.json();
}
