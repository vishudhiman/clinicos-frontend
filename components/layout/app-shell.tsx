"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { HeartPulse } from "lucide-react";
import { Sidebar, MobileSidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { UserMenu } from "@/components/layout/user-menu";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { NotificationBell } from "@/components/layout/notification-bell";
import { PatientDesktopNav, PatientBottomNav } from "@/components/layout/patient-nav";
import { usePatientNotifications } from "@/hooks/use-patient-notifications";

const AUTH_PATHS = ["/login", "/signup"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { notifications, unreadCount, markRead } = usePatientNotifications(session?.user.patientId);

  if (AUTH_PATHS.includes(pathname)) {
    return <>{children}</>;
  }

  const isStaff = session?.user.role === "DOCTOR" || session?.user.role === "ADMIN";

  if (status === "loading") {
    return <div className="flex flex-1" />;
  }

  if (isStaff) {
    return (
      <div className="flex min-h-full flex-1">
        <Sidebar />
        <MobileSidebar open={mobileOpen} onClose={() => setMobileOpen(false)} />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar onMenuClick={() => setMobileOpen(true)} />
          <motion.main
            key={pathname}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="flex flex-1 flex-col"
          >
            {children}
          </motion.main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-sm">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <HeartPulse className="size-4" aria-hidden="true" />
          </span>
          <span className="hidden text-sm font-semibold tracking-tight sm:inline">ClinicOS</span>
        </Link>
        <PatientDesktopNav unreadCount={unreadCount} />
        <div className="flex shrink-0 items-center gap-1">
          <ThemeToggle />
          <NotificationBell
            patientId={session?.user.patientId}
            notifications={notifications}
            unreadCount={unreadCount}
            onMarkRead={markRead}
          />
          {session && <UserMenu />}
        </div>
      </header>
      <motion.main
        key={pathname}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="flex flex-1 flex-col pb-16 md:pb-0"
      >
        {children}
      </motion.main>
      <PatientBottomNav unreadCount={unreadCount} />
    </div>
  );
}
