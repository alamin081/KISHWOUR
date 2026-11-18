"use client";

import { Search } from "lucide-react";
import Form from "next/form";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { routes } from "@/config/site";

/** Search button that opens a dialog; submits to the product catalog (?q=…). */
export function HeaderSearch() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Search products">
          <Search className="size-5" aria-hidden />
        </Button>
      </DialogTrigger>
      <DialogContent className="top-[20%] translate-y-0 sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl font-normal">
            Search products
          </DialogTitle>
          <DialogDescription>
            Search by product name, material or description.
          </DialogDescription>
        </DialogHeader>
        <Form
          action={routes.products}
          onSubmit={() => setOpen(false)}
          className="flex gap-2"
        >
          <label htmlFor="header-search-q" className="sr-only">
            Search term
          </label>
          <Input
            id="header-search-q"
            name="q"
            type="search"
            required
            maxLength={100}
            placeholder="e.g. jute tote, leather sandal"
            className="h-11"
            autoFocus
          />
          <Button type="submit" size="lg" className="h-11">
            <Search aria-hidden /> Search
          </Button>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
