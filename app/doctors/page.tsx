"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Plus, Stethoscope, Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/empty-state";
import { createDoctor, listDoctors, updateDoctor, type Doctor } from "@/lib/api";
import { cn } from "@/lib/utils";

const DAYS = [
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
  { value: 0, label: "Sun" },
];

function initials(name: string) {
  const parts = name.replace(/^Dr\.?\s*/i, "").trim().split(/\s+/);
  return (parts[0]?.[0] ?? "").concat(parts[1]?.[0] ?? "").toUpperCase();
}

export default function DoctorsPage() {
  const { data: session } = useSession();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  async function refresh() {
    setLoading(true);
    try {
      setDoctors(await listDoctors());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load doctors");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Doctors</h2>
          <p className="text-sm text-muted-foreground">
            The AI assistant answers patients using this profile information — never invented.
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger
            render={
              <Button>
                <Plus className="size-4" />
                Add doctor
              </Button>
            }
          />
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add a doctor</DialogTitle>
              <DialogDescription>
                They&apos;ll appear immediately in scheduling and the AI knowledge base.
              </DialogDescription>
            </DialogHeader>
            <AddDoctorForm
              onCreated={() => {
                setDialogOpen(false);
                refresh();
                toast.success("Doctor added");
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="size-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
              <Skeleton className="mt-4 h-3 w-full" />
              <Skeleton className="mt-1.5 h-3 w-4/5" />
            </Card>
          ))}
        </div>
      ) : doctors.length === 0 ? (
        <EmptyState
          icon={Stethoscope}
          title="No doctors yet"
          description="Add your first doctor to start taking bookings through the AI assistant."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence initial={false}>
            {doctors.map((doctor, i) => (
              <motion.div
                key={doctor.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, delay: i * 0.04, ease: "easeOut" }}
              >
                <DoctorCard
                  doctor={doctor}
                  isSelf={session?.user.doctorId === doctor.id}
                  onUpdated={refresh}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

function DoctorCard({
  doctor,
  isSelf,
  onUpdated,
}: {
  doctor: Doctor;
  isSelf: boolean;
  onUpdated: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [specialty, setSpecialty] = useState(doctor.specialty);
  const [bio, setBio] = useState(doctor.bio ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSubmitting(true);
    setError(null);
    try {
      await updateDoctor(doctor.id, { specialty, bio });
      setEditing(false);
      onUpdated();
      toast.success("Profile updated");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="group relative p-4 transition-shadow hover:shadow-md">
      <div className="flex items-start gap-3">
        <Avatar size="lg" className="shrink-0">
          <AvatarFallback className="bg-primary/10 font-semibold text-primary">
            {initials(doctor.name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate font-medium">{doctor.name}</h3>
            {isSelf && (
              <Badge variant="secondary" className="shrink-0 text-[10px]">
                You
              </Badge>
            )}
          </div>
          {!editing ? (
            <p className="truncate text-sm text-muted-foreground">{doctor.specialty}</p>
          ) : (
            <Input
              className="mt-1 h-7 text-sm"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
            />
          )}
        </div>
        {isSelf && !editing && (
          <button
            onClick={() => setEditing(true)}
            aria-label="Edit profile"
            className="flex size-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground group-hover:opacity-100 focus-visible:opacity-100"
          >
            <Pencil className="size-3.5" />
          </button>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-1">
        {doctor.schedules.map((s) => (
          <Badge key={s.id} variant="secondary" className="font-normal">
            {DAYS.find((d) => d.value === s.dayOfWeek)?.label} {s.startTime}-{s.endTime}
          </Badge>
        ))}
      </div>

      {!editing ? (
        doctor.bio && <p className="mt-3 text-sm text-muted-foreground">{doctor.bio}</p>
      ) : (
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={3}
          className="mt-3 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      )}

      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}

      {editing && (
        <div className="mt-3 flex gap-2">
          <Button size="sm" onClick={handleSave} disabled={submitting}>
            <Check className="size-3.5" />
            {submitting ? "Saving..." : "Save"}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
            <X className="size-3.5" />
            Cancel
          </Button>
        </div>
      )}
    </Card>
  );
}

function AddDoctorForm({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [bio, setBio] = useState("");
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("18:00");
  const [slotMinutes, setSlotMinutes] = useState(30);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleDay(day: number) {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !specialty.trim() || selectedDays.length === 0) return;
    setSubmitting(true);
    setError(null);
    try {
      await createDoctor({
        name: name.trim(),
        specialty: specialty.trim(),
        bio: bio.trim() || undefined,
        schedules: selectedDays.map((dayOfWeek) => ({
          dayOfWeek,
          startTime,
          endTime,
          slotMinutes,
        })),
      });
      setName("");
      setSpecialty("");
      setBio("");
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create doctor");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="doctor-name">Name</Label>
          <Input id="doctor-name" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="doctor-specialty">Specialty</Label>
          <Input
            id="doctor-specialty"
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="doctor-bio">Bio</Label>
        <textarea
          id="doctor-bio"
          placeholder="Used by the AI assistant to answer patient questions"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={2}
          className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>

      <div>
        <Label className="mb-1.5">Working days</Label>
        <div className="flex flex-wrap gap-2">
          {DAYS.map((d) => (
            <button
              key={d.value}
              type="button"
              onClick={() => toggleDay(d.value)}
              className={cn(
                "cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                selectedDays.includes(d.value)
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:border-foreground/30"
              )}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="doctor-start">Start</Label>
          <Input id="doctor-start" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="doctor-end">End</Label>
          <Input id="doctor-end" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="doctor-slot">Slot (min)</Label>
          <Input
            id="doctor-slot"
            type="number"
            min={5}
            max={240}
            value={slotMinutes}
            onChange={(e) => setSlotMinutes(Number(e.target.value))}
          />
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={submitting} className="mt-1">
        {submitting ? "Adding..." : "Add doctor"}
      </Button>
    </form>
  );
}
