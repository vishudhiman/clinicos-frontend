"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { SlotPicker } from "@/components/appointments/slot-picker";
import { rescheduleAppointment, type Appointment, type Slot } from "@/lib/api";

export function RescheduleDialog({
  appointment,
  open,
  onOpenChange,
  onRescheduled,
}: {
  appointment: Appointment;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRescheduled: () => void;
}) {
  const [selected, setSelected] = useState<Slot | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    if (!selected) return;
    setSubmitting(true);
    setError(null);
    try {
      await rescheduleAppointment(appointment.id, selected.startTime, selected.endTime);
      toast.success("Appointment rescheduled");
      onOpenChange(false);
      setSelected(null);
      onRescheduled();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reschedule");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reschedule appointment</DialogTitle>
          <DialogDescription>
            Pick a new time with {appointment.doctor.name}. Your current slot stays booked until
            you confirm.
          </DialogDescription>
        </DialogHeader>

        <SlotPicker doctorId={appointment.doctor.id} onSelect={setSelected} selectedSlot={selected} />

        {error && <p className="text-sm text-destructive">{error}</p>}

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!selected || submitting}>
            {submitting ? "Rescheduling..." : "Confirm new time"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
