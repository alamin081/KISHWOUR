import { type LucideIcon } from "lucide-react";
import Link from "next/link";
import { type ReactNode } from "react";

import { cn } from "@/lib/utils";

export function AdminPageHeader({
  title,
  description,
  actions,
  back,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {back ? (
          <Link
            href={back.href}
            className="mb-2 inline-block text-sm text-muted-foreground hover:text-forest"
          >
            ← {back.label}
          </Link>
        ) : null}
        <h1 className="text-2xl sm:text-3xl">{title}</h1>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function Panel({
  title,
  description,
  children,
  className,
  actions,
}: {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
  actions?: ReactNode;
}) {
  return (
    <section className={cn("rounded-xl border bg-card p-5 sm:p-6", className)}>
      {title ? (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="font-sans text-base font-semibold">{title}</h2>
            {description ? (
              <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
            ) : null}
          </div>
          {actions}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function StatCard({
  label,
  value,
  icon: Icon,
  href,
  hint,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  href?: string;
  hint?: string;
}) {
  const body = (
    <>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        <Icon className="size-4 text-forest" aria-hidden />
      </div>
      <p className="mt-2 font-serif text-3xl tabular-nums">
        {value.toLocaleString("en-US")}
      </p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </>
  );
  return href ? (
    <Link
      href={href}
      className="block rounded-xl border bg-card p-5 transition-colors hover:border-forest/40"
    >
      {body}
    </Link>
  ) : (
    <div className="rounded-xl border bg-card p-5">{body}</div>
  );
}

const STATUS_STYLES: Record<string, string> = {
  NEW: "bg-forest/10 text-forest",
  REVIEWING: "bg-amber-100 text-amber-900",
  CONTACTED: "bg-orange-100 text-orange-900",
  QUOTATION_SENT: "bg-sky-100 text-sky-900",
  NEGOTIATION: "bg-violet-100 text-violet-900",
  APPROVED: "bg-emerald-100 text-emerald-900",
  CLOSED: "bg-stone-200 text-stone-800",
  SPAM: "bg-red-100 text-red-900",
  DRAFT: "bg-stone-200 text-stone-800",
  SENT: "bg-sky-100 text-sky-900",
  ACCEPTED: "bg-emerald-100 text-emerald-900",
  REJECTED: "bg-stone-200 text-stone-800",
  EXPIRED: "bg-stone-200 text-stone-800",
  ACTIVE: "bg-emerald-100 text-emerald-900",
  INACTIVE: "bg-stone-200 text-stone-800",
};

/** Status pill: always text + colour (never colour alone). */
export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap",
        STATUS_STYLES[status] ?? "bg-muted text-foreground",
      )}
    >
      {status
        .replaceAll("_", " ")
        .toLowerCase()
        .replace(/^\w/, (c) => c.toUpperCase())}
    </span>
  );
}

export function EmptyRow({
  colSpan,
  children,
}: {
  colSpan: number;
  children: ReactNode;
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="py-10 text-center text-sm text-muted-foreground">
        {children}
      </td>
    </tr>
  );
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
