"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { type FieldValues, type Resolver, useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitBuyerInquiry } from "@/features/inquiries/actions";
import {
  BUSINESS_TYPES,
  type BuyerInquiryInput,
  contactSchema,
  QUOTE_TYPES,
  quoteSchema,
  sampleSchema,
} from "@/features/inquiries/schema";
import { cn } from "@/lib/utils";

type Kind = "quote" | "sample" | "contact";
type Props = {
  kind: Kind;
  countries: { code: string; name: string }[];
  product?: { slug: string; name: string; sku: string | null } | null;
  defaultQuoteType?: "WHOLESALE" | "OEM_ODM";
  className?: string;
};

const schemas = {
  quote: quoteSchema,
  sample: sampleSchema,
  contact: contactSchema,
} as const;
const selectClass =
  "border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:border-destructive h-10 w-full rounded-md border px-3 text-sm outline-none focus-visible:ring-[3px]";

function Field({
  id,
  label,
  required,
  error,
  hint,
  children,
  wide,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className={cn("space-y-2", wide && "sm:col-span-2")}>
      <Label htmlFor={id}>
        {label}
        {required ? (
          <span className="text-destructive" aria-hidden>
            *
          </span>
        ) : (
          <span className="font-normal text-muted-foreground">(optional)</span>
        )}
      </Label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-sm text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

function defaults(
  kind: Kind,
  product: Props["product"],
  quoteType: "WHOLESALE" | "OEM_ODM",
): FieldValues {
  const common = { email: "", country: "", website: "", submissionKey: "x".repeat(16) };
  if (kind === "quote")
    return {
      ...common,
      kind,
      inquiryType: quoteType,
      companyName: "",
      contactPerson: "",
      phone: "",
      businessType: "",
      productSlug: product?.slug ?? "",
      product: product?.name ?? "",
      productSku: product?.sku ?? "",
      requestedQuantity: "",
      customizationRequirements: "",
      message: "",
    };
  if (kind === "sample")
    return {
      ...common,
      kind,
      companyName: "",
      contactPerson: "",
      productSlug: product?.slug ?? "",
      product: product?.name ?? "",
      quantity: "1",
      deliveryAddress: "",
      requirements: "",
    };
  return {
    ...common,
    kind,
    contactPerson: "",
    companyName: "",
    phone: "",
    subject: "",
    message: "",
  };
}

function newKey(): string {
  return crypto.randomUUID().replaceAll("-", "");
}

/**
 * Public B2B form (Request a Quote, Request a Sample, Contact). Validated with the same Zod
 * schema on the client and server. On success the buyer is taken to a confirmation page that
 * reads the stored inquiry from the database.
 */
export function BuyerInquiryForm({
  kind,
  countries,
  product = null,
  defaultQuoteType = "WHOLESALE",
  className,
}: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const keyRef = useRef<string | null>(null);
  const firstInteraction = useRef<number | null>(null);

  const form = useForm<FieldValues>({
    // One form component serves three schemas; values are re-validated on the server.
    resolver: zodResolver(schemas[kind]) as unknown as Resolver<FieldValues>,
    defaultValues: defaults(kind, product, defaultQuoteType),
  });
  const errors = form.formState.errors;
  const err = (n: string) =>
    errors[n]?.message ? String(errors[n]?.message) : undefined;
  const a = (n: string) => ({
    "aria-invalid": Boolean(err(n)),
    "aria-describedby": err(n) ? `bf-${n}-error` : undefined,
  });

  function submit() {
    setServerMessage(null);
    keyRef.current ??= newKey();
    const values = {
      ...form.getValues(),
      submissionKey: keyRef.current,
      elapsedMs: firstInteraction.current
        ? Date.now() - firstInteraction.current
        : undefined,
    } as BuyerInquiryInput;
    start(async () => {
      const res = await submitBuyerInquiry(values);
      if (res.ok) {
        router.push(`/inquiry/received?ref=${encodeURIComponent(res.inquiryNumber)}`);
        return;
      }
      for (const [k, m] of Object.entries(res.fieldErrors ?? {}))
        form.setError(k, { message: m });
      setServerMessage(res.message);
    });
  }

  const text = (
    name: string,
    label: string,
    opts: {
      required?: boolean;
      type?: string;
      hint?: string;
      wide?: boolean;
      autoComplete?: string;
      placeholder?: string;
    } = {},
  ) => (
    <Field
      id={`bf-${name}`}
      label={label}
      required={opts.required}
      error={err(name)}
      hint={opts.hint}
      wide={opts.wide}
    >
      <Input
        id={`bf-${name}`}
        type={opts.type ?? "text"}
        autoComplete={opts.autoComplete}
        placeholder={opts.placeholder}
        {...a(name)}
        {...form.register(name)}
      />
    </Field>
  );
  const area = (
    name: string,
    label: string,
    opts: { required?: boolean; hint?: string; rows?: number } = {},
  ) => (
    <Field
      id={`bf-${name}`}
      label={label}
      required={opts.required}
      error={err(name)}
      hint={opts.hint}
      wide
    >
      <Textarea
        id={`bf-${name}`}
        rows={opts.rows ?? 5}
        {...a(name)}
        {...form.register(name)}
      />
    </Field>
  );
  const countrySelect = (
    <Field id="bf-country" label="Country" required error={err("country")}>
      <select
        id="bf-country"
        className={selectClass}
        autoComplete="country"
        {...a("country")}
        {...form.register("country")}
      >
        <option value="">Select your country</option>
        {countries.map((c) => (
          <option key={c.code} value={c.code}>
            {c.name}
          </option>
        ))}
      </select>
    </Field>
  );

  return (
    <form
      noValidate
      onFocus={() => {
        firstInteraction.current ??= Date.now();
      }}
      onSubmit={(e) => void form.handleSubmit(submit)(e)}
      className={cn("space-y-6 rounded-xl border bg-card p-6 sm:p-8", className)}
    >
      <div className="grid gap-5 sm:grid-cols-2">
        {kind === "quote" ? (
          <>
            <Field
              id="bf-inquiryType"
              label="Request type"
              required
              error={err("inquiryType")}
              wide
            >
              <select
                id="bf-inquiryType"
                className={selectClass}
                {...form.register("inquiryType")}
              >
                {QUOTE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </Field>
            {text("companyName", "Company name", {
              required: true,
              autoComplete: "organization",
            })}
            {text("contactPerson", "Contact person", {
              required: true,
              autoComplete: "name",
            })}
            {text("email", "Business email", {
              required: true,
              type: "email",
              autoComplete: "email",
            })}
            {text("phone", "Phone / WhatsApp", {
              type: "tel",
              autoComplete: "tel",
              placeholder: "+49 30 1234567",
            })}
            {countrySelect}
            <Field
              id="bf-businessType"
              label="Business type"
              required
              error={err("businessType")}
            >
              <select
                id="bf-businessType"
                className={selectClass}
                {...a("businessType")}
                {...form.register("businessType")}
              >
                <option value="">Select…</option>
                {BUSINESS_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </Field>
            {text("product", "Product", {
              hint: product
                ? "Selected from the catalogue"
                : "Product name or type you are looking for",
            })}
            {text("productSku", "Product SKU")}
            {text("requestedQuantity", "Required quantity", {
              required: true,
              type: "number",
              hint: "Approximate number of units",
            })}
            {area("customizationRequirements", "Customisation requirements", {
              rows: 3,
              hint: "Materials, colours, sizes, logo / labels, packaging…",
            })}
            {area("message", "Message", {
              required: true,
              hint: "Destination, timeline and anything else that helps us quote accurately.",
            })}
          </>
        ) : kind === "sample" ? (
          <>
            {text("companyName", "Company name", {
              required: true,
              autoComplete: "organization",
            })}
            {text("contactPerson", "Contact person", { autoComplete: "name" })}
            {text("email", "Email", {
              required: true,
              type: "email",
              autoComplete: "email",
            })}
            {countrySelect}
            {text("product", "Product", {
              required: true,
              hint: product ? "Selected from the catalogue" : undefined,
            })}
            {text("quantity", "Quantity", {
              required: true,
              type: "number",
              hint: "Number of samples (max 100)",
            })}
            {area("deliveryAddress", "Delivery address", {
              required: true,
              rows: 3,
              hint: "Full address including postcode and country",
            })}
            {area("requirements", "Requirements", {
              rows: 4,
              hint: "Colours, sizes, customisation or courier account details",
            })}
          </>
        ) : (
          <>
            {text("contactPerson", "Your name", { required: true, autoComplete: "name" })}
            {text("companyName", "Company", { autoComplete: "organization" })}
            {text("email", "Email", {
              required: true,
              type: "email",
              autoComplete: "email",
            })}
            {text("phone", "Phone / WhatsApp", { type: "tel", autoComplete: "tel" })}
            {countrySelect}
            {text("subject", "Subject")}
            {area("message", "Message", { required: true })}
          </>
        )}
      </div>

      <input type="hidden" {...form.register("productSlug")} />
      {/* Honeypot: hidden from people and assistive technology */}
      <div aria-hidden className="hidden">
        <label htmlFor="bf-website">Website</label>
        <input
          id="bf-website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          {...form.register("website")}
        />
      </div>

      {serverMessage ? (
        <p role="alert" className="text-sm text-destructive">
          {serverMessage}
        </p>
      ) : null}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-relaxed text-muted-foreground sm:max-w-sm">
          We use your details only to respond to this request.
        </p>
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? (
            <Loader2 className="animate-spin" aria-hidden />
          ) : (
            <Send aria-hidden />
          )}
          {pending
            ? "Sending…"
            : kind === "quote"
              ? "Request quotation"
              : kind === "sample"
                ? "Request sample"
                : "Send message"}
        </Button>
      </div>
    </form>
  );
}
