"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Chat" },
  { href: "/doctors", label: "Doctors" },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <header className="flex items-center justify-between border-b px-4 py-3">
      <span className="text-sm font-semibold">ClinicOS</span>
      <nav className="flex gap-4 text-sm">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "text-zinc-500 hover:text-foreground",
              pathname === link.href && "font-medium text-foreground"
            )}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
