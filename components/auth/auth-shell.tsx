"use client";

import { motion } from "framer-motion";
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
    <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-zinc-50 p-4 dark:bg-black">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.5, scale: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-gradient-to-br from-violet-300 to-sky-200 blur-3xl dark:from-violet-900/40 dark:to-sky-900/30"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.5, scale: 1 }}
          transition={{ duration: 1.2, ease: "easeOut", delay: 0.15 }}
          className="absolute -bottom-32 -right-24 h-96 w-96 rounded-full bg-gradient-to-br from-emerald-200 to-cyan-200 blur-3xl dark:from-emerald-900/30 dark:to-cyan-900/30"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="relative w-full max-w-sm"
      >
        <Card className="p-6 shadow-xl shadow-zinc-900/5">
          <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
          <p className="mb-6 text-sm text-zinc-500">{subtitle}</p>
          {children}
        </Card>
      </motion.div>
    </div>
  );
}
