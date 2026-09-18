"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarDays,
  CalendarClock,
  History,
  Check,
  Clock3,
  type LucideIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { RescheduleDialog } from "@/components/appointments/reschedule-dialog";
import { CancelDialog } from "@/components/appointments/cancel-dialog";
import { listAppointments, listNotifications, type Appointment, type AppNotification } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function MyAppointmentsPage() {
  const { data: session } = useSession();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rescheduling, setRescheduling] = useState<Appointment | null>(null);
  const [cancelling, setCancelling] = useState<Appointment | null>(null);

  async function refresh() {
    if (!session?.user.patientId) return;
    setLoading(true);
    try {
      const [mine, notifs] = await Promise.all([
        listAppointments(),
        listNotifications(session.user.patientId),
      ]);
      setAppointments(mine);
      setNotifications(notifs);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load appointments");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (session?.user.patientId) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user.patientId]);

  const { upcoming, past } = useMemo(() => {
    const now = new Date();
    const upcoming: Appointment[] = [];
    const past: Appointment[] = [];
    for (const a of appointments) {
      const isFuture = new Date(a.startTime) > now && a.status !== "CANCELLED" && a.status !== "COMPLETED";
      (isFuture ? upcoming : past).push(a);
    }
    upcoming.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    past.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
    return { upcoming, past };
  }, [appointments]);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 p-4 md:p-6">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">My Appointments</h1>
        <p className="text-sm text-muted-foreground">View, reschedule, or cancel your bookings.</p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-4">
          <AppointmentList
            appointments={upcoming}
            notifications={notifications}
            loading={loading}
            emptyIcon={CalendarClock}
            emptyTitle="No upcoming appointments"
            emptyDescription="Ask the AI Assistant to book one, or find a doctor to get started."
            onReschedule={setRescheduling}
            onCancel={setCancelling}
            showReminders
          />
        </TabsContent>

        <TabsContent value="past" className="mt-4">
          <AppointmentList
            appointments={past}
            notifications={notifications}
            loading={loading}
            emptyIcon={History}
            emptyTitle="No past appointments yet"
          />
        </TabsContent>
      </Tabs>

      {rescheduling && (
        <RescheduleDialog
          appointment={rescheduling}
          open={!!rescheduling}
          onOpenChange={(open) => !open && setRescheduling(null)}
          onRescheduled={refresh}
        />
      )}
      {cancelling && (
        <CancelDialog
          appointment={cancelling}
          open={!!cancelling}
          onOpenChange={(open) => !open && setCancelling(null)}
          onCancelled={refresh}
        />
      )}
    </div>
  );
}

function ReminderStatus({ notifications, appointmentId }: { notifications: AppNotification[]; appointmentId: string }) {
  const reminders = notifications.filter(
    (n) =>
      n.appointmentId === appointmentId &&
      (n.type === "REMINDER_24H" || n.type === "REMINDER_1H") &&
      n.status !== "SKIPPED"
  );

  // One badge per reminder type — a reminder goes out on two channels (email + in-app),
  // but the patient only needs to know whether *the reminder* went out, not per-channel detail.
  const byType = new Map<string, boolean>();
  for (const n of reminders) {
    byType.set(n.type, (byType.get(n.type) ?? false) || n.status === "SENT");
  }
  if (byType.size === 0) return null;

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {[...byType.entries()].map(([type, sent]) => {
        const label = type === "REMINDER_24H" ? "24h reminder" : "1h reminder";
        return (
          <span
            key={type}
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
              sent
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "bg-muted text-muted-foreground"
            )}
          >
            {sent ? <Check className="size-3" /> : <Clock3 className="size-3" />}
            {label} {sent ? "sent" : "scheduled"}
          </span>
        );
      })}
    </div>
  );
}

function AppointmentList({
  appointments,
  notifications,
  loading,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  onReschedule,
  onCancel,
  showReminders,
}: {
  appointments: Appointment[];
  notifications: AppNotification[];
  loading: boolean;
  emptyIcon: LucideIcon;
  emptyTitle: string;
  emptyDescription?: string;
  onReschedule?: (a: Appointment) => void;
  onCancel?: (a: Appointment) => void;
  showReminders?: boolean;
}) {
  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (appointments.length === 0) {
    return <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="flex flex-col gap-3">
      <AnimatePresence initial={false}>
        {appointments.map((a, i) => {
          const { date, time } = formatDateTime(a.startTime);
          const canManage = onReschedule && onCancel && (a.status === "PENDING" || a.status === "CONFIRMED");
          return (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, delay: i * 0.03 }}
            >
              <Card className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{a.doctor.name}</p>
                    <p className="text-sm text-muted-foreground">{a.doctor.specialty}</p>
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                      <CalendarDays className="size-3.5" />
                      {date} · {time}
                    </p>
                  </div>
                  <StatusBadge status={a.status} />
                </div>

                {showReminders && <ReminderStatus notifications={notifications} appointmentId={a.id} />}

                {canManage && (
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => onReschedule?.(a)}>
                      Reschedule
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => onCancel?.(a)}>
                      Cancel
                    </Button>
                  </div>
                )}
              </Card>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
