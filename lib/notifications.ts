import { Bell, CalendarCheck2, CalendarClock, CircleX, CheckCircle2 } from "lucide-react";
import type { NotificationType } from "@/lib/api";

export const NOTIFICATION_META: Record<NotificationType, { icon: typeof Bell; className: string }> = {
  BOOKING_CONFIRMATION: {
    icon: CalendarCheck2,
    className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  REMINDER_24H: { icon: CalendarClock, className: "bg-primary/10 text-primary" },
  REMINDER_1H: { icon: CalendarClock, className: "bg-primary/10 text-primary" },
  CANCELLATION: { icon: CircleX, className: "bg-red-500/10 text-red-600 dark:text-red-400" },
  RESCHEDULE: { icon: CheckCircle2, className: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
};

export function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60_000);
  if (Math.abs(mins) < 60) return mins <= 0 ? "just now" : `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (Math.abs(hours) < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}
