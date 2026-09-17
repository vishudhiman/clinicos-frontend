import type { Appointment } from "@/lib/api";

export type NotificationKind = "confirmed" | "reminder" | "cancelled" | "completed" | "no_show";

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  description: string;
  timestamp: string;
  appointmentId: string;
}

const READ_KEY = "clinicos.notifications.read";

/** Derives a notification feed from the patient's own appointments — there is no
 * dedicated notifications backend yet, so this reads signal directly out of real
 * appointment data (booking time, status, upcoming proximity) instead of mocking one. */
export function deriveNotifications(appointments: Appointment[]): AppNotification[] {
  const now = new Date();
  const notifications: AppNotification[] = [];

  for (const a of appointments) {
    const start = new Date(a.startTime);
    const created = new Date(a.createdAt);
    const hoursUntil = (start.getTime() - now.getTime()) / 3_600_000;
    const daysSinceCreated = (now.getTime() - created.getTime()) / 86_400_000;

    if (a.status === "CANCELLED") {
      notifications.push({
        id: `${a.id}-cancelled`,
        kind: "cancelled",
        title: "Appointment cancelled",
        description: `Your appointment with ${a.doctor.name} has been cancelled.`,
        timestamp: a.createdAt,
        appointmentId: a.id,
      });
      continue;
    }

    if (a.status === "NO_SHOW") {
      notifications.push({
        id: `${a.id}-no-show`,
        kind: "no_show",
        title: "Missed appointment",
        description: `You missed your appointment with ${a.doctor.name}.`,
        timestamp: a.startTime,
        appointmentId: a.id,
      });
      continue;
    }

    if (a.status === "COMPLETED") {
      notifications.push({
        id: `${a.id}-completed`,
        kind: "completed",
        title: "Visit completed",
        description: `Your visit with ${a.doctor.name} is complete.`,
        timestamp: a.startTime,
        appointmentId: a.id,
      });
      continue;
    }

    if (daysSinceCreated <= 7) {
      notifications.push({
        id: `${a.id}-confirmed`,
        kind: "confirmed",
        title: "Appointment confirmed",
        description: `Booked with ${a.doctor.name} for ${start.toLocaleString("en-IN", {
          weekday: "short",
          day: "numeric",
          month: "short",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        })}.`,
        timestamp: a.createdAt,
        appointmentId: a.id,
      });
    }

    if (hoursUntil > 0 && hoursUntil <= 24) {
      notifications.push({
        id: `${a.id}-reminder`,
        kind: "reminder",
        title: "Upcoming appointment",
        description: `You have an appointment with ${a.doctor.name} at ${start.toLocaleTimeString(
          "en-IN",
          { hour: "numeric", minute: "2-digit", hour12: true }
        )}.`,
        timestamp: new Date(start.getTime() - 24 * 3_600_000).toISOString(),
        appointmentId: a.id,
      });
    }
  }

  return notifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function getReadIds(): Set<string> {
  try {
    const raw = localStorage.getItem(READ_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

export function markAsRead(id: string) {
  try {
    const read = getReadIds();
    read.add(id);
    localStorage.setItem(READ_KEY, JSON.stringify([...read]));
  } catch {
    // ignore storage failures
  }
}

export function markAllAsRead(ids: string[]) {
  try {
    const read = getReadIds();
    for (const id of ids) read.add(id);
    localStorage.setItem(READ_KEY, JSON.stringify([...read]));
  } catch {
    // ignore storage failures
  }
}
