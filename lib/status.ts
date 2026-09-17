import type { LucideIcon } from "lucide-react";
import { CalendarClock, CheckCircle2, CircleSlash, CircleX, Clock3 } from "lucide-react";

export type AppointmentStatus = "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED" | "NO_SHOW";

interface StatusMeta {
  label: string;
  icon: LucideIcon;
  badgeClass: string;
  dotClass: string;
}

export const STATUS_META: Record<AppointmentStatus, StatusMeta> = {
  PENDING: {
    label: "Pending",
    icon: Clock3,
    badgeClass:
      "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20",
    dotClass: "bg-amber-500",
  },
  CONFIRMED: {
    label: "Confirmed",
    icon: CheckCircle2,
    badgeClass:
      "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20",
    dotClass: "bg-emerald-500",
  },
  CANCELLED: {
    label: "Cancelled",
    icon: CircleX,
    badgeClass:
      "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-500/20",
    dotClass: "bg-red-500",
  },
  COMPLETED: {
    label: "Completed",
    icon: CalendarClock,
    badgeClass:
      "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-500/20",
    dotClass: "bg-blue-500",
  },
  NO_SHOW: {
    label: "No-show",
    icon: CircleSlash,
    badgeClass:
      "bg-zinc-100 text-zinc-600 ring-1 ring-inset ring-zinc-200 dark:bg-zinc-500/10 dark:text-zinc-400 dark:ring-zinc-500/20",
    dotClass: "bg-zinc-400",
  },
};
