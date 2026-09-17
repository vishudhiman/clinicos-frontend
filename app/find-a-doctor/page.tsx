"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Stethoscope, CalendarPlus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/empty-state";
import { SlotPicker } from "@/components/appointments/slot-picker";
import { listDoctors, bookAppointment, type Doctor, type Slot } from "@/lib/api";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function initials(name: string) {
  const parts = name.replace(/^Dr\.?\s*/i, "").trim().split(/\s+/);
  return (parts[0]?.[0] ?? "").concat(parts[1]?.[0] ?? "").toUpperCase();
}

export default function FindADoctorPage() {
  const { data: session } = useSession();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [booking, setBooking] = useState<Doctor | null>(null);

  useEffect(() => {
    listDoctors()
      .then(setDoctors)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load doctors"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 p-4 md:p-6">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">Find a Doctor</h1>
        <p className="text-sm text-muted-foreground">
          Browse doctors and specialties, then book a slot that works for you.
        </p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="size-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
              <Skeleton className="mt-4 h-3 w-full" />
            </Card>
          ))}
        </div>
      ) : doctors.length === 0 ? (
        <EmptyState icon={Stethoscope} title="No doctors available yet" description="Check back soon." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <AnimatePresence initial={false}>
            {doctors.map((doctor, i) => (
              <motion.div
                key={doctor.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05, ease: "easeOut" }}
              >
                <Card className="flex h-full flex-col p-4 transition-shadow hover:shadow-md">
                  <div className="flex items-center gap-3">
                    <Avatar size="lg">
                      <AvatarFallback className="bg-primary/10 font-semibold text-primary">
                        {initials(doctor.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-medium">{doctor.name}</h3>
                      <p className="truncate text-sm text-muted-foreground">{doctor.specialty}</p>
                    </div>
                  </div>

                  {doctor.bio && (
                    <p className="mt-3 line-clamp-2 flex-1 text-sm text-muted-foreground">{doctor.bio}</p>
                  )}

                  <div className="mt-3 flex flex-wrap gap-1">
                    {[...new Set(doctor.schedules.map((s) => s.dayOfWeek))]
                      .sort()
                      .map((d) => (
                        <Badge key={d} variant="secondary" className="font-normal">
                          {DAY_LABELS[d]}
                        </Badge>
                      ))}
                  </div>

                  <Button className="mt-4 self-start" onClick={() => setBooking(doctor)}>
                    <CalendarPlus className="size-4" />
                    Book appointment
                  </Button>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {booking && (
        <BookingDialog
          doctor={booking}
          patientId={session?.user.patientId ?? null}
          open={!!booking}
          onOpenChange={(open) => !open && setBooking(null)}
        />
      )}
    </div>
  );
}

function BookingDialog({
  doctor,
  patientId,
  open,
  onOpenChange,
}: {
  doctor: Doctor;
  patientId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [selected, setSelected] = useState<Slot | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    if (!selected || !patientId) return;
    setSubmitting(true);
    setError(null);
    try {
      await bookAppointment({
        doctorId: doctor.id,
        patientId,
        startTime: selected.startTime,
        endTime: selected.endTime,
      });
      toast.success(`Booked with ${doctor.name}`);
      onOpenChange(false);
      setSelected(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to book appointment");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Book with {doctor.name}</DialogTitle>
          <DialogDescription>{doctor.specialty} — pick an available slot.</DialogDescription>
        </DialogHeader>

        <SlotPicker doctorId={doctor.id} onSelect={setSelected} selectedSlot={selected} />

        {error && <p className="text-sm text-destructive">{error}</p>}

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!selected || submitting}>
            {submitting ? "Booking..." : "Confirm booking"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
