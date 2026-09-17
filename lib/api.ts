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

export interface DoctorSchedule {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotMinutes: number;
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  bio: string | null;
  schedules: DoctorSchedule[];
}

export interface NewDoctorInput {
  name: string;
  specialty: string;
  bio?: string;
  schedules: { dayOfWeek: number; startTime: string; endTime: string; slotMinutes: number }[];
}

export interface Appointment {
  id: string;
  startTime: string;
  endTime: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED" | "NO_SHOW";
  notes: string | null;
  createdAt: string;
  doctor: { id: string; name: string; specialty: string };
  patient: { id: string; name: string; phoneNumber: string | null };
}

export interface Slot {
  startTime: string;
  endTime: string;
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

export function listDoctors(): Promise<Doctor[]> {
  return apiFetch<Doctor[]>("/doctors");
}

export function createDoctor(input: NewDoctorInput): Promise<Doctor> {
  return apiFetch<Doctor>("/doctors", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateDoctor(
  id: string,
  input: Partial<Omit<NewDoctorInput, "schedules">> & { schedules?: NewDoctorInput["schedules"] }
): Promise<Doctor> {
  return apiFetch<Doctor>(`/doctors/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function listAppointments(): Promise<Appointment[]> {
  return apiFetch<Appointment[]>("/appointments");
}

export function getDoctorAvailability(doctorId: string, date: Date): Promise<{ slots: Slot[] }> {
  const isoDate = date.toISOString().slice(0, 10);
  return apiFetch<{ slots: Slot[] }>(`/doctors/${doctorId}/availability?date=${isoDate}`);
}

export function bookAppointment(input: {
  doctorId: string;
  patientId: string;
  startTime: string;
  endTime: string;
}): Promise<Appointment> {
  return apiFetch<Appointment>("/appointments", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function cancelAppointment(id: string): Promise<Appointment> {
  return apiFetch<Appointment>(`/appointments/${id}/cancel`, { method: "POST" });
}

export function rescheduleAppointment(
  id: string,
  newStartTime: string,
  newEndTime: string
): Promise<Appointment> {
  return apiFetch<Appointment>(`/appointments/${id}/reschedule`, {
    method: "POST",
    body: JSON.stringify({ newStartTime, newEndTime }),
  });
}
