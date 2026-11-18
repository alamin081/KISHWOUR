"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

import { adminNav } from "./nav";

/** Navigation links; `allowed` is computed on the server from the user's role. */
export function SidebarNav({
  allowed,
  onNavigate,
}: {
  allowed: string[];
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin" className="space-y-1">
      {adminNav
        .filter((item) => allowed.includes(item.href))
        .map((item) => {
          const active =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-forest text-primary-foreground"
                  : "text-charcoal/80 hover:bg-secondary",
              )}
            >
              <item.icon className="size-4" aria-hidden />
              {item.title}
            </Link>
          );
        })}
    </nav>
  );
}
