"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, BellOff } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import {
  usePatientNotifications,
  requestBrowserNotificationPermission,
  getBrowserNotificationPermission,
} from "@/hooks/use-patient-notifications";
import { NOTIFICATION_META, timeAgo } from "@/lib/notifications";
import { cn } from "@/lib/utils";

export default function NotificationsPage() {
  const { data: session } = useSession();
  const { notifications, unreadCount, loading, markRead, markAllRead } = usePatientNotifications(
    session?.user.patientId
  );
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");

  useEffect(() => {
    setPermission(getBrowserNotificationPermission());
  }, []);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 p-4 md:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Notifications</h1>
          <p className="text-sm text-muted-foreground">Confirmations, reminders, and updates.</p>
        </div>
        {unreadCount > 0 && (
          <Button size="sm" variant="outline" onClick={markAllRead}>
            Mark all as read
          </Button>
        )}
      </div>

      {permission !== "granted" && permission !== "unsupported" && (
        <Card className="flex items-center justify-between gap-3 border-dashed p-3">
          <div className="flex items-center gap-2 text-sm">
            <BellOff className="size-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              Enable browser notifications to get reminders even when this tab isn&apos;t open.
            </span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              requestBrowserNotificationPermission();
              setTimeout(() => setPermission(getBrowserNotificationPermission()), 300);
            }}
          >
            Enable
          </Button>
        </Card>
      )}

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
              const meta = NOTIFICATION_META[n.type];
              const Icon = meta.icon;
              const isRead = !!n.readAt;
              return (
                <motion.button
                  key={n.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25, delay: i * 0.03 }}
                  onClick={() => !isRead && markRead(n.id)}
                  className="text-left"
                >
                  <Card
                    className={cn(
                      "flex items-start gap-3 p-3 transition-colors",
                      !isRead && "bg-primary/3 ring-1 ring-primary/10"
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
                      <p className="text-sm text-muted-foreground">{n.message}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground/70">
                        {timeAgo(n.sentAt ?? n.createdAt)}
                      </p>
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
