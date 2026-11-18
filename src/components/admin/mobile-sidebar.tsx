"use client";

import { Menu } from "lucide-react";
import { useState } from "react";

import { BrandLogo } from "@/components/shared/brand-logo";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { SidebarNav } from "./sidebar-nav";

export function MobileSidebar({ allowed }: { allowed: string[] }) {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          aria-label="Open admin menu"
        >
          <Menu aria-hidden />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 bg-background p-4">
        <SheetHeader className="px-0">
          <SheetTitle className="sr-only">Admin menu</SheetTitle>
          <SheetDescription className="sr-only">Admin navigation</SheetDescription>
          <BrandLogo height={32} />
        </SheetHeader>
        <SidebarNav allowed={allowed} onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
