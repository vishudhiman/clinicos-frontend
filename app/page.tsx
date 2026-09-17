"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getOrCreatePatient, sendChatMessage, type Patient } from "@/lib/api";

interface ChatMessage {
  id: string;
  role: "PATIENT" | "AI";
  content: string;
}

const PATIENT_STORAGE_KEY = "clinicos.patient";

export default function Home() {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [checkingStorage, setCheckingStorage] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PATIENT_STORAGE_KEY);
      if (raw) setPatient(JSON.parse(raw));
    } catch {
      // ignore malformed storage
    }
    setCheckingStorage(false);
  }, []);

  function handleIdentified(p: Patient) {
    try {
      localStorage.setItem(PATIENT_STORAGE_KEY, JSON.stringify(p));
    } catch {
      // ignore storage failures
    }
    setPatient(p);
  }

  if (checkingStorage) return null;

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 p-4 dark:bg-black">
      {patient ? (
        <ChatWindow patient={patient} onSwitchPatient={() => setPatient(null)} />
      ) : (
        <PatientGate onIdentified={handleIdentified} />
      )}
    </div>
  );
}

function PatientGate({ onIdentified }: { onIdentified: (p: Patient) => void }) {
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !phoneNumber.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const patient = await getOrCreatePatient(name.trim(), phoneNumber.trim());
      onIdentified(patient);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-sm p-6">
      <h1 className="mb-1 text-xl font-semibold">Welcome to ClinicOS</h1>
      <p className="mb-6 text-sm text-zinc-500">
        Enter your details to start booking an appointment.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <Input
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <Input
          placeholder="Phone number"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          required
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <Button type="submit" disabled={loading}>
          {loading ? "Please wait..." : "Continue"}
        </Button>
      </form>
    </Card>
  );
}

function ChatWindow({
  patient,
  onSwitchPatient,
}: {
  patient: Patient;
  onSwitchPatient: () => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "AI",
      content: `Hi ${patient.name.split(" ")[0]}! I can help you check availability, book, cancel, or reschedule an appointment. What would you like to do?`,
    },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: "PATIENT", content: text };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setSending(true);
    setError(null);

    try {
      const res = await sendChatMessage({
        patientId: patient.id,
        message: text,
        conversationId,
      });
      setConversationId(res.conversationId);
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "AI", content: res.reply },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <Card className="flex h-[80vh] w-full max-w-lg flex-col overflow-hidden p-0">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div>
          <h1 className="text-base font-semibold">ClinicOS</h1>
          <p className="text-xs text-zinc-500">{patient.name}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onSwitchPatient}>
          Switch patient
        </Button>
      </div>

      <ScrollArea className="flex-1 px-4 py-4">
        <div className="flex flex-col gap-3">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.role === "PATIENT" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm ${
                  m.role === "PATIENT"
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-2xl bg-zinc-100 px-4 py-2 text-sm text-zinc-400 dark:bg-zinc-800">
                Typing...
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {error && <p className="px-4 pb-1 text-xs text-red-500">{error}</p>}

      <form onSubmit={handleSend} className="flex gap-2 border-t p-3">
        <Input
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={sending}
        />
        <Button type="submit" disabled={sending || !input.trim()}>
          Send
        </Button>
      </form>
    </Card>
  );
}
