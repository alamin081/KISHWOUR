"use client";

import { SlidersHorizontal } from "lucide-react";
import { type ReactNode, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

/** Opens the (server-rendered) filter panel in a sheet on small screens. */
export function MobileFilters({
  activeCount,
  children,
}: {
  activeCount: number;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="lg:hidden">
          <SlidersHorizontal aria-hidden /> Filters
          {activeCount > 0 ? (
            <span className="ml-1 rounded-full bg-forest px-1.5 text-xs text-primary-foreground">
              {activeCount}
            </span>
          ) : null}
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-full overflow-y-auto bg-background sm:max-w-sm"
      >
        <SheetHeader className="border-b">
          <SheetTitle className="font-serif text-2xl font-normal">Filters</SheetTitle>
          <SheetDescription className="sr-only">
            Filter the product catalogue
          </SheetDescription>
        </SheetHeader>
        {/* Close the sheet when a filter link is chosen. */}
        <div
          className="px-4 pb-8"
          onClick={(e) => {
            if ((e.target as HTMLElement).closest("a")) setOpen(false);
          }}
        >
          {children}
        </div>
      </SheetContent>
    </Sheet>
  );
}
