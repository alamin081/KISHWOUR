"use client";

import { ExternalLink, Menu, MessageSquareQuote } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { BrandLogo } from "@/components/shared/brand-logo";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { mainNav, routes } from "@/config/site";
import { cn } from "@/lib/utils";

import { type NavCategory } from "./types";

type MobileNavProps = {
  categories: NavCategory[];
  alibabaStoreUrl?: string;
  tagline: string;
};

export function MobileNav({ categories, alibabaStoreUrl, tagline }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const close = () => setOpen(false);
  const isActive = (href: string) =>
    href === "/"
      ? pathname === "/"
      : pathname === href || pathname.startsWith(`${href}/`);

  const itemClass = (href: string) =>
    cn(
      "flex h-12 items-center border-b text-base font-medium transition-colors hover:text-forest",
      isActive(href) ? "text-forest" : "text-charcoal",
    );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Open menu">
          <Menu className="size-6" aria-hidden />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 bg-background p-0 sm:max-w-sm"
      >
        <SheetHeader className="border-b px-6 py-4">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <SheetDescription className="sr-only">Site navigation</SheetDescription>
          <div onClick={close}>
            <BrandLogo height={36} asHomeLink />
          </div>
        </SheetHeader>

        <nav aria-label="Mobile" className="flex-1 overflow-y-auto px-6">
          <ul>
            {mainNav.map((item) =>
              item.href === routes.products ? (
                <li key={item.href}>
                  <Accordion type="single" collapsible>
                    <AccordionItem value="products" className="border-b">
                      <AccordionTrigger
                        className={cn(
                          "h-12 py-0 font-sans text-base font-medium hover:no-underline",
                          isActive(item.href) ? "text-forest" : "text-charcoal",
                        )}
                      >
                        {item.title}
                      </AccordionTrigger>
                      <AccordionContent className="pb-3">
                        <ul className="ml-1 space-y-0.5 border-l-2 border-beige pl-4">
                          <li>
                            <Link
                              href={routes.products}
                              onClick={close}
                              className="block py-2 text-sm font-semibold text-forest"
                            >
                              All products
                            </Link>
                          </li>
                          {categories.map((c) => (
                            <li key={c.slug}>
                              <Link
                                href={routes.category(c.slug)}
                                onClick={close}
                                className="block py-2 text-sm text-charcoal/85 hover:text-forest"
                              >
                                {c.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </li>
              ) : (
                <li key={item.href}>
                  <Link href={item.href} onClick={close} className={itemClass(item.href)}>
                    {item.title}
                  </Link>
                </li>
              ),
            )}
          </ul>
        </nav>

        <div className="space-y-3 border-t bg-secondary/50 px-6 py-5">
          <Button asChild size="lg" className="w-full">
            <Link href={routes.requestQuote} onClick={close}>
              <MessageSquareQuote aria-hidden /> Request a Quote
            </Link>
          </Button>
          {alibabaStoreUrl ? (
            <Button asChild size="lg" variant="secondary" className="w-full">
              <a href={alibabaStoreUrl} target="_blank" rel="noopener noreferrer">
                Alibaba Store <ExternalLink aria-hidden />
              </a>
            </Button>
          ) : null}
          <p className="pt-1 text-center text-xs tracking-wide text-muted-foreground">
            {tagline}
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
