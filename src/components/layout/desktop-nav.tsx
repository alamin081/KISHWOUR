"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { mainNav, routes } from "@/config/site";
import { cn } from "@/lib/utils";

import { type NavCategory } from "./types";

function isActive(pathname: string, href: string) {
  return href === "/"
    ? pathname === "/"
    : pathname === href || pathname.startsWith(`${href}/`);
}

const linkBase =
  "relative inline-flex h-10 items-center px-3 text-sm font-medium text-charcoal/85 transition-colors hover:text-forest focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 rounded-md";
const activeUnderline =
  "after:absolute after:inset-x-3 after:-bottom-px after:h-0.5 after:bg-forest text-forest";

/** Desktop navigation with a "Products" mega menu listing categories. */
export function DesktopNav({ categories }: { categories: NavCategory[] }) {
  const pathname = usePathname();

  return (
    <NavigationMenu aria-label="Main">
      <NavigationMenuList className="gap-0.5">
        {mainNav.map((item) =>
          item.href === routes.products ? (
            <NavigationMenuItem key={item.href}>
              <NavigationMenuTrigger
                className={cn(
                  "h-10 bg-transparent px-3 text-charcoal/85 hover:bg-transparent hover:text-forest focus:bg-transparent data-[state=open]:bg-transparent data-[state=open]:text-forest",
                  isActive(pathname, item.href) && "text-forest",
                )}
              >
                {item.title}
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <MegaMenu categories={categories} />
              </NavigationMenuContent>
            </NavigationMenuItem>
          ) : (
            <NavigationMenuItem key={item.href}>
              <NavigationMenuLink asChild active={isActive(pathname, item.href)}>
                <Link
                  href={item.href}
                  className={cn(
                    linkBase,
                    isActive(pathname, item.href) && activeUnderline,
                  )}
                >
                  {item.title}
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
          ),
        )}
      </NavigationMenuList>
    </NavigationMenu>
  );
}

function MegaMenu({ categories }: { categories: NavCategory[] }) {
  return (
    <div className="grid w-[min(52rem,calc(100vw-4rem))] grid-cols-[1fr_17rem] gap-0">
      <div className="p-6">
        <p className="mb-4 text-[0.7rem] font-semibold tracking-[0.18em] text-jute-deep uppercase">
          Shop by category
        </p>
        {categories.length > 0 ? (
          <ul className="grid grid-cols-2 gap-1">
            {categories.map((c) => (
              <li key={c.slug}>
                <NavigationMenuLink asChild>
                  <Link
                    href={routes.category(c.slug)}
                    className="block rounded-md p-3 transition-colors hover:bg-secondary/70"
                  >
                    <span className="block text-sm font-medium text-charcoal">
                      {c.name}
                    </span>
                    {c.description ? (
                      <span className="mt-0.5 line-clamp-2 block text-xs leading-relaxed text-muted-foreground">
                        {c.description}
                      </span>
                    ) : null}
                  </Link>
                </NavigationMenuLink>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">Categories will appear here.</p>
        )}
        <NavigationMenuLink asChild>
          <Link
            href={routes.products}
            className="mt-4 inline-flex flex-row items-center gap-1.5 px-3 text-sm font-semibold text-forest hover:underline"
          >
            View all products <ArrowRight className="size-4" aria-hidden />
          </Link>
        </NavigationMenuLink>
      </div>
      <div className="flex flex-col justify-between rounded-r-md bg-secondary p-6">
        <div>
          <p className="mb-2 text-[0.7rem] font-semibold tracking-[0.18em] text-jute-deep uppercase">
            OEM / ODM
          </p>
          <p className="font-serif text-xl leading-snug">
            Your design, made by hand in Bangladesh.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Custom materials, sizes, branding and packaging for wholesale orders.
          </p>
        </div>
        <NavigationMenuLink asChild>
          <Link
            href={routes.customManufacturing}
            className="mt-6 inline-flex flex-row items-center gap-1.5 p-0 text-sm font-semibold text-forest hover:bg-transparent hover:underline"
          >
            Custom manufacturing <ArrowRight className="size-4" aria-hidden />
          </Link>
        </NavigationMenuLink>
      </div>
    </div>
  );
}
