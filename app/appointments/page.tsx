"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarX2, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { STATUS_META, type AppointmentStatus } from "@/lib/status";
import { listAppointments, type Appointment } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

const FILTERS: { value: AppointmentStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "PENDING", label: STATUS_META.PENDING.label },
  { value: "CONFIRMED", label: STATUS_META.CONFIRMED.label },
  { value: "COMPLETED", label: STATUS_META.COMPLETED.label },
  { value: "CANCELLED", label: STATUS_META.CANCELLED.label },
  { value: "NO_SHOW", label: STATUS_META.NO_SHOW.label },
];

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<AppointmentStatus | "ALL">("ALL");
  const [query, setQuery] = useState("");

  useEffect(() => {
    listAppointments()
      .then(setAppointments)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load appointments"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return appointments
      .filter((a) => filter === "ALL" || a.status === filter)
      .filter(
        (a) =>
          !q ||
          a.patient.name.toLowerCase().includes(q) ||
          a.doctor.name.toLowerCase().includes(q)
      )
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  }, [appointments, filter, query]);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Appointments</h2>
          <p className="text-sm text-muted-foreground">All bookings made through the AI assistant.</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search patient or doctor..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              "cursor-pointer rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              filter === f.value
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <Card className="p-0">
        {error && <p className="px-4 py-3 text-sm text-destructive">{error}</p>}

        {loading ? (
          <div className="flex flex-col gap-2 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-4">
            <EmptyState
              icon={CalendarX2}
              title="No appointments found"
              description={
                query || filter !== "ALL"
                  ? "Try a different search term or filter."
                  : "Appointments booked through the AI assistant will appear here."
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Doctor</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence initial={false}>
                  {filtered.map((a) => {
                    const { date, time } = formatDateTime(a.startTime);
                    return (
                      <motion.tr
                        key={a.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="border-b border-border last:border-0 hover:bg-muted/50"
                      >
                        <TableCell className="font-medium">{a.patient.name}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {a.doctor.name}
                          <span className="text-xs"> · {a.doctor.specialty}</span>
                        </TableCell>
                        <TableCell>{date}</TableCell>
                        <TableCell className="tabular-nums">{time}</TableCell>
                        <TableCell>
                          <StatusBadge status={a.status} />
                        </TableCell>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}
