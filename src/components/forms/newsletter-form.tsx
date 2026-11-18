"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Mail } from "lucide-react";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { subscribeToNewsletter } from "@/features/newsletter/actions";
import { type NewsletterInput, newsletterSchema } from "@/features/newsletter/schema";
import { cn } from "@/lib/utils";

type NewsletterFormProps = {
  /** "dark" for use on charcoal/forest backgrounds. */
  tone?: "light" | "dark";
  /** "inline": input and button side by side (≥640px). "stacked": always stacked (narrow columns). */
  layout?: "inline" | "stacked";
  className?: string;
};

export function NewsletterForm({
  tone = "light",
  layout = "inline",
  className,
}: NewsletterFormProps) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const form = useForm<NewsletterInput>({
    resolver: zodResolver(newsletterSchema),
    defaultValues: { email: "", website: "" },
  });
  const emailError = form.formState.errors.email?.message;

  const onSubmit = form.handleSubmit((values) => {
    setResult(null);
    startTransition(async () => {
      const res = await subscribeToNewsletter(values);
      if (!res.ok && res.fieldErrors?.email) {
        form.setError("email", { message: res.fieldErrors.email });
      }
      setResult({ ok: res.ok, message: res.message });
      if (res.ok) form.reset();
    });
  });

  const dark = tone === "dark";

  return (
    <form onSubmit={onSubmit} noValidate className={cn("w-full max-w-md", className)}>
      <Label htmlFor="newsletter-email" className={cn("mb-2", dark && "text-warm-white")}>
        Email address
      </Label>
      <div className={cn("flex flex-col gap-2", layout === "inline" && "sm:flex-row")}>
        <div className="relative flex-1">
          <Mail
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            id="newsletter-email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            aria-invalid={Boolean(emailError)}
            aria-describedby={emailError ? "newsletter-email-error" : undefined}
            className="h-10 bg-background pl-9"
            {...form.register("email")}
          />
        </div>
        {/* Honeypot — hidden from people and assistive tech */}
        <input
          type="text"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden
          className="hidden"
          {...form.register("website")}
        />
        <Button type="submit" disabled={pending} variant={dark ? "jute" : "default"}>
          {pending ? <Loader2 className="animate-spin" aria-hidden /> : null}
          Subscribe
        </Button>
      </div>
      <div aria-live="polite" className="min-h-6 pt-2 text-sm">
        {emailError ? (
          <p
            id="newsletter-email-error"
            className={dark ? "text-[#ffb4a8]" : "text-destructive"}
          >
            {emailError}
          </p>
        ) : result ? (
          <p className={dark ? "text-warm-white/85" : "text-muted-foreground"}>
            {result.message}
          </p>
        ) : null}
      </div>
    </form>
  );
}
