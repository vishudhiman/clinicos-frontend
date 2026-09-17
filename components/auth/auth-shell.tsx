"use client";

import { motion } from "framer-motion";
import { HeartPulse } from "lucide-react";
import { Card } from "@/components/ui/card";

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-muted/30 p-4">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.6, scale: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-gradient-to-br from-cyan-200 to-sky-100 blur-3xl dark:from-cyan-900/30 dark:to-sky-900/20"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.6, scale: 1 }}
          transition={{ duration: 1.2, ease: "easeOut", delay: 0.15 }}
          className="absolute -bottom-32 -right-24 h-96 w-96 rounded-full bg-gradient-to-br from-emerald-100 to-cyan-100 blur-3xl dark:from-emerald-900/20 dark:to-cyan-900/20"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="relative w-full max-w-sm"
      >
        <div className="mb-6 flex justify-center">
          <span className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
            <HeartPulse className="size-5" aria-hidden="true" />
          </span>
        </div>
        <Card className="p-6 shadow-xl shadow-slate-900/5">
          <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
          <p className="mb-6 text-sm text-muted-foreground">{subtitle}</p>
          {children}
        </Card>
      </motion.div>
    </div>
  );
}
