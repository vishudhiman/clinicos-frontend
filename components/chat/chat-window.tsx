"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HeartPulse } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { sendChatMessage } from "@/lib/api";

interface ChatMessage {
  id: string;
  role: "PATIENT" | "AI";
  content: string;
}

const SUGGESTIONS = [
  "What doctors are available?",
  "Book me with Dr. Sharma tomorrow",
  "Check my appointment status",
];

export function ChatWindow({
  patientId,
  patientName,
}: {
  patientId: string;
  patientName: string;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "AI",
      content: `Hi ${patientName.split(" ")[0]}! I can help you check availability, book, cancel, or reschedule an appointment. What would you like to do?`,
    },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  async function submitMessage(text: string) {
    if (!text || sending) return;

    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: "PATIENT", content: text };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setSending(true);
    setError(null);

    try {
      const res = await sendChatMessage({ patientId, message: text, conversationId });
      setConversationId(res.conversationId);
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "AI", content: res.reply }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSending(false);
    }
  }

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    submitMessage(input.trim());
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="w-full max-w-lg"
    >
      <Card className="flex h-[80vh] w-full flex-col overflow-hidden p-0 shadow-xl shadow-slate-900/5">
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <HeartPulse className="size-4" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-sm font-semibold">ClinicOS Assistant</h1>
            <p className="truncate text-xs text-muted-foreground">{patientName}</p>
          </div>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <motion.span
              className="flex h-2 w-2 rounded-full bg-emerald-500"
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            Online
          </span>
        </div>

        <ScrollArea className="flex-1 px-4 py-4">
          <div className="flex flex-col gap-3">
            <AnimatePresence initial={false}>
              {messages.map((m) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className={`flex ${m.role === "PATIENT" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm ${
                      m.role === "PATIENT"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    {m.content}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {sending && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="flex items-center gap-1 rounded-2xl bg-muted px-4 py-3">
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60"
                      animate={{ y: [0, -4, 0] }}
                      transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                    />
                  ))}
                </div>
              </motion.div>
            )}
            {messages.length === 1 && !sending && (
              <div className="flex flex-wrap gap-2 pt-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => submitMessage(s)}
                    className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        {error && <p className="px-4 pb-1 text-xs text-destructive">{error}</p>}

        <form onSubmit={handleSend} className="flex gap-2 border-t border-border p-3">
          <Input
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={sending}
          />
          <motion.div whileTap={{ scale: 0.95 }}>
            <Button type="submit" disabled={sending || !input.trim()}>
              Send
            </Button>
          </motion.div>
        </form>
      </Card>
    </motion.div>
  );
}
