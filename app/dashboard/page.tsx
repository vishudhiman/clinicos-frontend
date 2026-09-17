"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { CalendarDays, CalendarCheck2, Stethoscope, ListChecks, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/dashboard/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { listAppointments, listDoctors, type Appointment, type Doctor } from "@/lib/api";
import { formatDateTime, isToday } from "@/lib/format";

export default function DashboardPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([listAppointments(), listDoctors()])
      .then(([appts, docs]) => {
        setAppointments(appts);
        setDoctors(docs);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load dashboard"))
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    const now = new Date();
    const today = appointments.filter((a) => isToday(a.startTime));
    const upcoming = appointments.filter(
      (a) => new Date(a.startTime) > now && a.status !== "CANCELLED"
    );
    return {
      today: today.length,
      upcoming: upcoming.length,
      total: appointments.length,
      doctors: doctors.length,
    };
  }, [appointments, doctors]);

  const recent = useMemo(
    () =>
      [...appointments]
        .filter((a) => new Date(a.startTime) >= new Date())
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
        .slice(0, 6),
    [appointments]
  );

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Welcome back</h2>
        <p className="text-sm text-muted-foreground">
          Here&apos;s what&apos;s happening across the clinic today.
        </p>
      </div>

      {error && (
        <p className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Today" value={stats.today} icon={CalendarDays} loading={loading} accent="primary" delay={0} />
        <StatCard
          label="Upcoming"
          value={stats.upcoming}
          icon={CalendarCheck2}
          loading={loading}
          accent="blue"
          delay={0.05}
        />
        <StatCard label="Total appointments" value={stats.total} icon={ListChecks} loading={loading} accent="amber" delay={0.1} />
        <StatCard label="Doctors" value={stats.doctors} icon={Stethoscope} loading={loading} accent="emerald" delay={0.15} />
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.2 }}>
        <Card className="p-0">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h3 className="text-sm font-semibold">Upcoming appointments</h3>
            <Link
              href="/appointments"
              className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              View all
              <ArrowRight className="size-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="flex flex-col gap-3 p-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : recent.length === 0 ? (
            <div className="p-4">
              <EmptyState
                icon={CalendarDays}
                title="No upcoming appointments"
                description="Booked appointments will show up here as patients schedule them via chat."
              />
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {recent.map((a, i) => {
                const { date, time } = formatDateTime(a.startTime);
                return (
                  <motion.li
                    key={a.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2, delay: i * 0.03 }}
                    className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{a.patient.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {a.doctor.name} · {a.doctor.specialty}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xs text-muted-foreground">
                        {date} · {time}
                      </p>
                      <div className="mt-1 flex justify-end">
                        <StatusBadge status={a.status} />
                      </div>
                    </div>
                  </motion.li>
                );
              })}
            </ul>
          )}
        </Card>
      </motion.div>
    </div>
  );
}
