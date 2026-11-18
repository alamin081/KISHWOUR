"use client";

import { Loader2, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  createManualInquiry,
  type ManualInquiryInput,
} from "@/features/admin/inquiries/actions";

import { Field, FormSection, selectClass } from "./form-fields";

const SOURCES = [
  ["ALIBABA", "Alibaba"],
  ["WHATSAPP", "WhatsApp"],
  ["EMAIL", "Email"],
  ["TRADE_SHOW", "Trade show"],
  ["REFERRAL", "Referral"],
  ["OTHER", "Other"],
] as const;
const TYPES = [
  ["WHOLESALE", "Wholesale"],
  ["OEM_ODM", "OEM / ODM"],
  ["SAMPLE_REQUEST", "Sample request"],
  ["GENERAL", "General"],
] as const;

/** Records an inquiry that arrived outside the website. */
export function ManualInquiryForm({
  countries,
}: {
  countries: { code: string; name: string }[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [v, setV] = useState({
    source: "ALIBABA",
    inquiryType: "WHOLESALE",
    contactPerson: "",
    companyName: "",
    email: "",
    phone: "",
    country: "",
    product: "",
    productSku: "",
    requestedQuantity: "",
    message: "",
    deliveryAddress: "",
  });
  const bind = (k: keyof typeof v) => ({
    id: `m-${k}`,
    value: v[k],
    "aria-invalid": Boolean(errors[k]),
    onChange: (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
    ) => setV({ ...v, [k]: e.target.value }),
  });

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const res = await createManualInquiry(v as ManualInquiryInput);
          setErrors(res.ok ? {} : (res.fieldErrors ?? {}));
          if (res.ok && res.data) {
            toast.success(res.message ?? "Saved.");
            router.push(`/admin/inquiries/${res.data.id}`);
          } else if (!res.ok) toast.error(res.message);
        });
      }}
    >
      <FormSection title="Origin">
        <Field id="m-source" label="Source" required error={errors["source"]}>
          <select className={selectClass} {...bind("source")}>
            {SOURCES.map(([val, l]) => (
              <option key={val} value={val}>
                {l}
              </option>
            ))}
          </select>
        </Field>
        <Field id="m-inquiryType" label="Type" required error={errors["inquiryType"]}>
          <select className={selectClass} {...bind("inquiryType")}>
            {TYPES.map(([val, l]) => (
              <option key={val} value={val}>
                {l}
              </option>
            ))}
          </select>
        </Field>
      </FormSection>
      <FormSection title="Buyer">
        <Field
          id="m-contactPerson"
          label="Contact person"
          required
          error={errors["contactPerson"]}
        >
          <Input {...bind("contactPerson")} />
        </Field>
        <Field id="m-companyName" label="Company" error={errors["companyName"]}>
          <Input {...bind("companyName")} />
        </Field>
        <Field id="m-email" label="Email" required error={errors["email"]}>
          <Input type="email" {...bind("email")} />
        </Field>
        <Field id="m-phone" label="Phone / WhatsApp" error={errors["phone"]}>
          <Input type="tel" {...bind("phone")} />
        </Field>
        <Field id="m-country" label="Country" required error={errors["country"]}>
          <select className={selectClass} {...bind("country")}>
            <option value="">Select…</option>
            {countries.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
      </FormSection>
      <FormSection title="Request">
        <Field id="m-product" label="Product" error={errors["product"]}>
          <Input {...bind("product")} />
        </Field>
        <Field id="m-productSku" label="Product SKU" error={errors["productSku"]}>
          <Input {...bind("productSku")} />
        </Field>
        <Field
          id="m-requestedQuantity"
          label="Quantity"
          error={errors["requestedQuantity"]}
        >
          <Input type="number" min={1} {...bind("requestedQuantity")} />
        </Field>
        <Field
          id="m-message"
          label="Message / request"
          required
          error={errors["message"]}
          className="sm:col-span-2"
        >
          <Textarea rows={5} {...bind("message")} />
        </Field>
        <Field
          id="m-deliveryAddress"
          label="Delivery address (samples)"
          error={errors["deliveryAddress"]}
          className="sm:col-span-2"
        >
          <Textarea rows={2} {...bind("deliveryAddress")} />
        </Field>
      </FormSection>
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? (
            <Loader2 className="animate-spin" aria-hidden />
          ) : (
            <Save aria-hidden />
          )}{" "}
          Record inquiry
        </Button>
      </div>
    </form>
  );
}
