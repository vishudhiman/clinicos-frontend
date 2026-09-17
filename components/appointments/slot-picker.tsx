"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarX2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { getDoctorAvailability, type Slot } from "@/lib/api";
import { cn } from "@/lib/utils";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function SlotPicker({
  doctorId,
  onSelect,
  selectedSlot,
}: {
  doctorId: string;
  onSelect: (slot: Slot) => void;
  selectedSlot?: Slot | null;
}) {
  const [date, setDate] = useState(todayISO());
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getDoctorAvailability(doctorId, new Date(date))
      .then((res) => setSlots(res.slots))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load availability"))
      .finally(() => setLoading(false));
  }, [doctorId, date]);

  return (
    <div className="flex flex-col gap-3">
      <Input
        type="date"
        value={date}
        min={todayISO()}
        onChange={(e) => setDate(e.target.value)}
      />

      {loading ? (
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </div>
      ) : error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : slots.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border py-6 text-center">
          <CalendarX2 className="size-5 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No slots available on this date.</p>
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          <motion.div
            key={date}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="grid grid-cols-3 gap-2"
          >
            {slots.map((slot) => {
              const active = selectedSlot?.startTime === slot.startTime;
              return (
                <button
                  key={slot.startTime}
                  type="button"
                  onClick={() => onSelect(slot)}
                  className={cn(
                    "cursor-pointer rounded-lg border px-2 py-2 text-xs font-medium tabular-nums transition-colors",
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border text-foreground hover:border-primary/40"
                  )}
                >
                  {new Date(slot.startTime).toLocaleTimeString("en-IN", {
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true,
                  })}
                </button>
              );
            })}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
