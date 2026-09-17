"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { MessageCircle, CalendarDays, Stethoscope, Bell, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { listAppointments } from "@/lib/api";
import { deriveNotifications, getReadIds } from "@/lib/notifications";

export const PATIENT_NAV_ITEMS = [
  { href: "/", label: "Assistant", icon: MessageCircle },
  { href: "/my-appointments", label: "Appointments", icon: CalendarDays },
  { href: "/find-a-doctor", label: "Doctors", icon: Stethoscope },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/profile", label: "Profile", icon: UserRound },
];

function useUnreadCount(patientId?: string | null) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!patientId) return;
    let cancelled = false;
    listAppointments()
      .then((appts) => {
        if (cancelled) return;
        const mine = appts.filter((a) => a.patient.id === patientId);
        const notifications = deriveNotifications(mine);
        const read = getReadIds();
        setCount(notifications.filter((n) => !read.has(n.id)).length);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [patientId]);

  return count;
}

export function PatientDesktopNav({ patientId }: { patientId?: string | null }) {
  const pathname = usePathname();
  const unread = useUnreadCount(patientId);

  return (
    <nav className="hidden items-center gap-1 md:flex">
      {PATIENT_NAV_ITEMS.map((item) => {
        const active = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "relative flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
              active && "text-foreground"
            )}
          >
            {active && (
              <motion.span
                layoutId="patient-nav-pill"
                className="absolute inset-0 rounded-full bg-muted"
                transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
              />
            )}
            <Icon className="relative size-4" aria-hidden="true" />
            <span className="relative">{item.label}</span>
            {item.href === "/notifications" && unread > 0 && (
              <span className="relative flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

export function PatientBottomNav({ patientId }: { patientId?: string | null }) {
  const pathname = usePathname();
  const unread = useUnreadCount(patientId);

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm md:hidden"
      aria-label="Primary"
    >
      <div className="flex items-stretch justify-around">
        {PATIENT_NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex min-w-14 flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium text-muted-foreground transition-colors",
                active && "text-primary"
              )}
            >
              <span className="relative">
                <Icon className="size-5" aria-hidden="true" />
                {item.href === "/notifications" && unread > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 flex size-3.5 items-center justify-center rounded-full bg-primary text-[9px] font-semibold text-primary-foreground">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </span>
              {item.label}
              {active && (
                <motion.span
                  layoutId="patient-bottom-nav-indicator"
                  className="absolute inset-x-4 top-0 h-0.5 rounded-full bg-primary"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
