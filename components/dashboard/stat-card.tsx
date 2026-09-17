"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  icon: Icon,
  loading,
  accent = "primary",
  delay = 0,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  loading?: boolean;
  accent?: "primary" | "emerald" | "amber" | "blue";
  delay?: number;
}) {
  const accentClass = {
    primary: "bg-primary/10 text-primary",
    emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  }[accent];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay, ease: "easeOut" }}
    >
      <Card className="p-4 transition-shadow hover:shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{label}</span>
          <span className={cn("flex size-8 items-center justify-center rounded-lg", accentClass)}>
            <Icon className="size-4" aria-hidden="true" />
          </span>
        </div>
        <div className="mt-2">
          {loading ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <span className="text-2xl font-semibold tabular-nums tracking-tight">{value}</span>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
