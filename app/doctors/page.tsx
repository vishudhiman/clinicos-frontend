"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { createDoctor, listDoctors, type Doctor } from "@/lib/api";

const DAYS = [
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
  { value: 0, label: "Sun" },
];

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6">
      <div>
        <h1 className="text-xl font-semibold">Doctors</h1>
        <p className="text-sm text-zinc-500">
          Onboard doctors and keep their profile up to date. The AI assistant uses this
          information to answer patients — never invented.
        </p>
      </div>

      <AddDoctorForm onCreated={refresh} />

      <div className="flex flex-col gap-3">
        {loading && <p className="text-sm text-zinc-500">Loading...</p>}
        {error && <p className="text-sm text-red-500">{error}</p>}
        {!loading && doctors.length === 0 && (
          <p className="text-sm text-zinc-500">No doctors yet. Add one above.</p>
        )}
        {doctors.map((doctor) => (
          <Card key={doctor.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-medium">{doctor.name}</h2>
                <p className="text-sm text-zinc-500">{doctor.specialty}</p>
              </div>
              <div className="flex flex-wrap justify-end gap-1">
                {doctor.schedules.map((s) => (
                  <Badge key={s.id} variant="secondary">
                    {DAYS.find((d) => d.value === s.dayOfWeek)?.label} {s.startTime}-{s.endTime}
                  </Badge>
                ))}
              </div>
            </div>
            {doctor.bio && <p className="mt-2 text-sm text-zinc-600">{doctor.bio}</p>}
          </Card>
        ))}
      </div>
    </div>
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
    <Card className="p-4">
      <h2 className="mb-3 font-medium">Add a doctor</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input
            placeholder="Specialty"
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
            required
          />
        </div>
        <textarea
          placeholder="Bio (used by the AI assistant to answer patient questions)"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={2}
          className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />

        <div>
          <p className="mb-1 text-xs text-zinc-500">Working days</p>
          <div className="flex flex-wrap gap-2">
            {DAYS.map((d) => (
              <button
                key={d.value}
                type="button"
                onClick={() => toggleDay(d.value)}
                className={`rounded-full border px-3 py-1 text-xs ${
                  selectedDays.includes(d.value)
                    ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                    : "border-zinc-300 text-zinc-600 dark:border-zinc-700 dark:text-zinc-400"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <p className="mb-1 text-xs text-zinc-500">Start time</p>
            <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          </div>
          <div>
            <p className="mb-1 text-xs text-zinc-500">End time</p>
            <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
          </div>
          <div>
            <p className="mb-1 text-xs text-zinc-500">Slot length (min)</p>
            <Input
              type="number"
              min={5}
              max={240}
              value={slotMinutes}
              onChange={(e) => setSlotMinutes(Number(e.target.value))}
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <Button type="submit" disabled={submitting} className="self-start">
          {submitting ? "Adding..." : "Add doctor"}
        </Button>
      </form>
    </Card>
  );
}
