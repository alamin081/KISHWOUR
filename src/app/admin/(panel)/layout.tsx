import { ExternalLink, LogOut } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { MobileSidebar } from "@/components/admin/mobile-sidebar";
import { adminNav } from "@/components/admin/nav";
import { SidebarNav } from "@/components/admin/sidebar-nav";
import { BrandLogo } from "@/components/shared/brand-logo";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { logout } from "@/features/admin/auth-actions";
import { can } from "@/lib/auth/permissions";
import { requireStaff } from "@/lib/auth/session";

/**
 * Authenticated admin shell.
 *
 * The session is read at request time, so it cannot be prerendered. Each piece that needs
 * it sits behind its own `<Suspense>` boundary and `{children}` stays outside them - a
 * top-level `await` here would hold every admin page behind the session read and stop any
 * of them prerendering a static shell.
 *
 * Authorization is unchanged: `requireStaff()` still runs here, and every page and Server
 * Action re-checks it on the server.
 */

/** The navigation the signed-in user is allowed to see. */
async function allowedNav(): Promise<string[]> {
  const staff = await requireStaff();
  return adminNav.filter((item) => can(staff.role, item.permission)).map((i) => i.href);
}

async function DesktopNav() {
  return <SidebarNav allowed={await allowedNav()} />;
}

async function MobileNav() {
  return <MobileSidebar allowed={await allowedNav()} />;
}

async function CurrentUser() {
  const staff = await requireStaff();
  return (
    <div className="hidden text-right sm:block">
      <p className="text-sm leading-tight font-medium">{staff.name ?? staff.email}</p>
      <p className="text-xs text-muted-foreground">
        {staff.role === "ADMIN" ? "Administrator" : "Editor"}
      </p>
    </div>
  );
}

function NavSkeleton() {
  return (
    <div className="space-y-2" aria-hidden>
      {Array.from({ length: 9 }, (_, i) => (
        <Skeleton key={i} className="h-8 w-full" />
      ))}
    </div>
  );
}

export default function AdminPanelLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="flex min-h-svh">
      <aside className="hidden w-64 shrink-0 border-r bg-background lg:flex lg:flex-col">
        <div className="border-b px-5 py-4">
          <Link href="/admin" aria-label="Admin dashboard">
            <BrandLogo height={34} priority />
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          <Suspense fallback={<NavSkeleton />}>
            <DesktopNav />
          </Suspense>
        </div>
        <div className="border-t p-3">
          <a
            href="/"
            target="_blank"
            rel="noopener"
            className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-forest"
          >
            <ExternalLink className="size-4" aria-hidden /> View website
          </a>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b bg-background/95 px-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-2">
            <Suspense fallback={<Skeleton className="size-10 lg:hidden" />}>
              <MobileNav />
            </Suspense>
            <span className="text-sm text-muted-foreground">Kishwour Admin</span>
          </div>
          <div className="flex items-center gap-3">
            <Suspense fallback={<Skeleton className="hidden h-8 w-28 sm:block" />}>
              <CurrentUser />
            </Suspense>
            <form action={logout}>
              <Button type="submit" variant="outline" size="sm">
                <LogOut aria-hidden /> Sign out
              </Button>
            </form>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
