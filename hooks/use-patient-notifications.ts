"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type AppNotification,
} from "@/lib/api";

const POLL_MS = 30_000;

function fireBrowserNotification(n: AppNotification) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  try {
    new Notification(n.title, { body: n.message, tag: n.id });
  } catch {
    // Notification API can throw in some embedded/webview contexts — ignore.
  }
}

export function usePatientNotifications(patientId?: string | null) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const seenIds = useRef<Set<string> | null>(null);

  const refresh = useCallback(async () => {
    if (!patientId) return;
    try {
      const data = await listNotifications(patientId);
      const delivered = data.filter((n) => n.status === "SENT");

      if (seenIds.current) {
        for (const n of delivered) {
          if (!seenIds.current.has(n.id)) fireBrowserNotification(n);
        }
      }
      seenIds.current = new Set(delivered.map((n) => n.id));

      setNotifications(data);
    } catch {
      // keep last-known state on transient failures
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    if (!patientId) return;
    refresh();
    const interval = setInterval(refresh, POLL_MS);
    return () => clearInterval(interval);
  }, [patientId, refresh]);

  const markRead = useCallback(async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)));
    try {
      await markNotificationRead(id);
    } catch {
      // best-effort; next poll will reconcile
    }
  }, []);

  const markAllRead = useCallback(async () => {
    if (!patientId) return;
    const now = new Date().toISOString();
    setNotifications((prev) => prev.map((n) => (n.readAt ? n : { ...n, readAt: now })));
    try {
      await markAllNotificationsRead(patientId);
    } catch {
      // best-effort; next poll will reconcile
    }
  }, [patientId]);

  const delivered = notifications.filter((n) => n.status === "SENT");
  const unreadCount = delivered.filter((n) => !n.readAt).length;

  return { notifications: delivered, unreadCount, loading, refresh, markRead, markAllRead };
}

export function requestBrowserNotificationPermission() {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission === "default") {
    Notification.requestPermission();
  }
}

export function getBrowserNotificationPermission(): NotificationPermission | "unsupported" {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  return Notification.permission;
}
