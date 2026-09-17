"use client";

import Link from "next/link";
import { Bell, BellRing } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { AppNotification } from "@/lib/api";
import { NOTIFICATION_META, timeAgo } from "@/lib/notifications";
import { cn } from "@/lib/utils";

export function NotificationBell({
  patientId,
  notifications,
  unreadCount,
  onMarkRead,
}: {
  patientId?: string | null;
  notifications: AppNotification[];
  unreadCount: number;
  onMarkRead: (id: string) => void;
}) {
  const recent = notifications.slice(0, 5);

  if (!patientId) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            aria-label={unreadCount > 0 ? `${unreadCount} unread notifications` : "Notifications"}
            className="relative flex size-9 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {unreadCount > 0 ? <BellRing className="size-4.5" /> : <Bell className="size-4.5" />}
            {unreadCount > 0 && (
              <span className="absolute right-1.5 top-1.5 flex size-2 rounded-full bg-primary" />
            )}
          </button>
        }
      />
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {recent.length === 0 ? (
          <p className="px-1.5 py-4 text-center text-sm text-muted-foreground">
            You&apos;re all caught up.
          </p>
        ) : (
          <div className="flex flex-col gap-0.5">
            {recent.map((n) => {
              const meta = NOTIFICATION_META[n.type];
              const Icon = meta.icon;
              const isRead = !!n.readAt;
              return (
                <DropdownMenuItem
                  key={n.id}
                  onClick={() => !isRead && onMarkRead(n.id)}
                  className="flex items-start gap-2 py-2"
                >
                  <span className={cn("mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md", meta.className)}>
                    <Icon className="size-3.5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate text-sm font-medium">{n.title}</span>
                      {!isRead && <span className="size-1.5 shrink-0 rounded-full bg-primary" />}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">{n.message}</span>
                    <span className="block text-[11px] text-muted-foreground/70">
                      {timeAgo(n.sentAt ?? n.createdAt)}
                    </span>
                  </span>
                </DropdownMenuItem>
              );
            })}
          </div>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/notifications">View all notifications</Link>} className="justify-center text-sm font-medium" />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
