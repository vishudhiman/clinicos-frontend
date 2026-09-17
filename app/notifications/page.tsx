"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, BellOff } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { listAppointments } from "@/lib/api";
import {
  deriveNotifications,
  getReadIds,
  markAsRead,
  markAllAsRead,
  type AppNotification,
  type NotificationKind,
} from "@/lib/notifications";
import { cn } from "@/lib/utils";

const KIND_META: Record<NotificationKind, { icon: typeof Bell; className: string }> = {
  confirmed: { icon: Bell, className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  reminder: { icon: Bell, className: "bg-primary/10 text-primary" },
  cancelled: { icon: Bell, className: "bg-red-500/10 text-red-600 dark:text-red-400" },
  completed: { icon: Bell, className: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  no_show: { icon: Bell, className: "bg-zinc-500/10 text-zinc-500" },
};

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60_000);
  if (Math.abs(mins) < 60) return mins <= 0 ? "just now" : `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (Math.abs(hours) < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export default function NotificationsPage() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.user.patientId) return;
    listAppointments()
      .then((all) => {
        const mine = all.filter((a) => a.patient.id === session.user.patientId);
        setNotifications(deriveNotifications(mine));
        setReadIds(getReadIds());
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load notifications"))
      .finally(() => setLoading(false));
  }, [session?.user.patientId]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !readIds.has(n.id)).length,
    [notifications, readIds]
  );

  function handleMarkAllRead() {
    markAllAsRead(notifications.map((n) => n.id));
    setReadIds(getReadIds());
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 p-4 md:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Notifications</h1>
          <p className="text-sm text-muted-foreground">Confirmations, reminders, and updates.</p>
        </div>
        {unreadCount > 0 && (
          <Button size="sm" variant="outline" onClick={handleMarkAllRead}>
            Mark all as read
          </Button>
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="You're all caught up"
          description="Booking confirmations and appointment reminders will show up here."
        />
      ) : (
        <div className="flex flex-col gap-2">
          <AnimatePresence initial={false}>
            {notifications.map((n, i) => {
              const meta = KIND_META[n.kind];
              const Icon = meta.icon;
              const isRead = readIds.has(n.id);
              return (
                <motion.button
                  key={n.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25, delay: i * 0.03 }}
                  onClick={() => {
                    markAsRead(n.id);
                    setReadIds(getReadIds());
                  }}
                  className="text-left"
                >
                  <Card
                    className={cn(
                      "flex items-start gap-3 p-3 transition-colors",
                      !isRead && "bg-primary/[0.03] ring-1 ring-primary/10"
                    )}
                  >
                    <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg", meta.className)}>
                      <Icon className="size-4" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium">{n.title}</p>
                        {!isRead && <span className="size-1.5 shrink-0 rounded-full bg-primary" />}
                      </div>
                      <p className="text-sm text-muted-foreground">{n.description}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground/70">{timeAgo(n.timestamp)}</p>
                    </div>
                  </Card>
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
