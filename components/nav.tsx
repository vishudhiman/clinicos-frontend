"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Nav() {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  if (pathname === "/login" || pathname === "/signup") return null;

  const links = [
    { href: "/", label: "Chat", show: true },
    {
      href: "/doctors",
      label: "Doctors",
      show: session?.user.role === "DOCTOR" || session?.user.role === "ADMIN",
    },
  ].filter((l) => l.show);

  return (
    <motion.header
      initial={{ y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/80 px-4 py-3 backdrop-blur-sm"
    >
      <Link href="/" className="text-sm font-semibold tracking-tight">
        ClinicOS
      </Link>
      <nav className="flex items-center gap-1 text-sm">
        {links.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "relative rounded-full px-3 py-1.5 text-zinc-500 transition-colors hover:text-foreground",
                active && "text-foreground"
              )}
            >
              {active && (
                <motion.span
                  layoutId="nav-pill"
                  className="absolute inset-0 rounded-full bg-muted"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                />
              )}
              <span className="relative">{link.label}</span>
            </Link>
          );
        })}
        {status === "authenticated" && (
          <Button
            variant="ghost"
            size="sm"
            className="ml-2"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            Sign out
          </Button>
        )}
      </nav>
    </motion.header>
  );
}
