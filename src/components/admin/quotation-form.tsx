"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Save, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { saveQuotation } from "@/features/admin/quotations/actions";
import {
  computeTotals,
  fromCents,
  type QuotationFormInput,
  quotationFormSchema,
  type QuotationFormValues,
} from "@/features/admin/quotations/schema";

import { Field, FormSection, selectClass } from "./form-fields";

type ProductOption = {
  id: string;
  name: string;
  sku: string | null;
  unit: string;
  minimumOrderQuantity: number | null;
  priceMin: string | null;
};
type Props = {
  quotationId: string | null;
  defaultValues: QuotationFormInput;
  products: ProductOption[];
};

const PRICE = /^\d{1,10}(\.\d{1,2})?$/;

export function QuotationForm({ quotationId, defaultValues, products }: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const form = useForm<QuotationFormInput, unknown, QuotationFormValues>({
    resolver: zodResolver(quotationFormSchema),
    defaultValues,
  });
  const { register, setValue, setError } = form;
  const errors = form.formState.errors as Record<
    string,
    { message?: string } | undefined
  > & {
    items?: { [k: number]: Record<string, { message?: string }> } & { message?: string };
  };
  const items = useFieldArray({ control: form.control, name: "items" });
  const watchedItems = useWatch({ control: form.control, name: "items" });
  const shipping = useWatch({ control: form.control, name: "shippingCost" });
  const currency = useWatch({ control: form.control, name: "currency" });

  // Live preview (the server recalculates authoritatively).
  const valid = (watchedItems ?? []).every(
    (i) => PRICE.test(String(i.unitPrice ?? "")) && Number(i.quantity) > 0,
  );
  const totals = valid
    ? computeTotals(
        (watchedItems ?? []).map((i) => ({
          quantity: Number(i.quantity),
          unitPrice: String(i.unitPrice),
        })),
        PRICE.test(String(shipping ?? "")) ? String(shipping) : "0",
      )
    : null;

  function submit(values: QuotationFormInput) {
    start(async () => {
      const res = await saveQuotation(quotationId, values);
      if (res.ok) {
        toast.success(res.message ?? "Saved.");
        if (!quotationId && res.data) router.push(`/admin/quotations/${res.data.id}`);
        else router.refresh();
        return;
      }
      for (const [k, m] of Object.entries(res.fieldErrors ?? {}))
        setError(k as keyof QuotationFormInput, { message: m });
      toast.error(res.message);
    });
  }

  const err = (k: string) => errors[k]?.message;

  return (
    <form
      onSubmit={(e) => void form.handleSubmit(() => submit(form.getValues()))(e)}
      noValidate
      className="space-y-6"
    >
      <section className="rounded-xl border bg-card p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-sans text-base font-semibold">Line items</h2>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() =>
              items.append({
                productId: "",
                description: "",
                quantity: "1",
                moq: "",
                unit: "pieces",
                unitPrice: "",
              })
            }
          >
            <Plus aria-hidden /> Add line
          </Button>
        </div>
        {errors.items?.message ? (
          <p className="mt-2 text-xs text-destructive">{errors.items.message}</p>
        ) : null}
        <div className="mt-4 space-y-3">
          {items.fields.map((field, i) => {
            const rowErr = errors.items?.[i];
            const line = totals?.lines[i];
            return (
              <div
                key={field.id}
                className="grid gap-2 rounded-lg border p-3 md:grid-cols-[1.2fr_1.6fr_6rem_6rem_6rem_7rem_7rem_auto] md:items-start"
              >
                <select
                  aria-label="Product"
                  className={selectClass}
                  {...register(`items.${i}.productId`, {
                    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => {
                      const p = products.find((x) => x.id === e.target.value);
                      if (!p) return;
                      setValue(
                        `items.${i}.description`,
                        p.sku ? `${p.name} (SKU ${p.sku})` : p.name,
                      );
                      setValue(`items.${i}.unit`, p.unit);
                      if (p.minimumOrderQuantity)
                        setValue(`items.${i}.moq`, String(p.minimumOrderQuantity));
                      if (p.priceMin && !form.getValues(`items.${i}.unitPrice`))
                        setValue(`items.${i}.unitPrice`, p.priceMin);
                    },
                  })}
                >
                  <option value="">Custom line</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                      {p.sku ? ` · ${p.sku}` : ""}
                    </option>
                  ))}
                </select>
                <div>
                  <Input
                    aria-label="Description"
                    placeholder="Description *"
                    {...register(`items.${i}.description`)}
                  />
                  {rowErr?.["description"] ? (
                    <p className="text-xs text-destructive">
                      {rowErr["description"].message}
                    </p>
                  ) : null}
                </div>
                <Input
                  aria-label="Quantity"
                  type="number"
                  min={1}
                  placeholder="Qty"
                  {...register(`items.${i}.quantity`)}
                />
                <Input
                  aria-label="MOQ"
                  type="number"
                  min={1}
                  placeholder="MOQ"
                  {...register(`items.${i}.moq`)}
                />
                <Input
                  aria-label="Unit"
                  placeholder="Unit"
                  {...register(`items.${i}.unit`)}
                />
                <div>
                  <Input
                    aria-label="Unit price"
                    inputMode="decimal"
                    placeholder="Unit price"
                    {...register(`items.${i}.unitPrice`)}
                  />
                  {rowErr?.["unitPrice"] ? (
                    <p className="text-xs text-destructive">
                      {rowErr["unitPrice"].message}
                    </p>
                  ) : null}
                </div>
                <p
                  className="py-2 text-right text-sm tabular-nums"
                  aria-label="Line total"
                >
                  {line !== undefined ? fromCents(line) : "—"}
                </p>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  className="text-destructive"
                  aria-label="Remove line"
                  onClick={() => items.remove(i)}
                  disabled={items.fields.length === 1}
                >
                  <Trash2 />
                </Button>
              </div>
            );
          })}
        </div>
        <dl className="mt-5 ml-auto w-full max-w-xs space-y-1 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Subtotal</dt>
            <dd className="tabular-nums">
              {totals ? `${currency} ${fromCents(totals.subtotal)}` : "—"}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">
              <label htmlFor="q-shipping">Shipping</label>
            </dt>
            <dd>
              <Input
                id="q-shipping"
                inputMode="decimal"
                className="h-8 w-28 text-right"
                {...register("shippingCost")}
              />
            </dd>
          </div>
          <div className="flex justify-between border-t pt-2 font-semibold">
            <dt>Total</dt>
            <dd className="tabular-nums">
              {totals ? `${currency} ${fromCents(totals.total)}` : "—"}
            </dd>
          </div>
        </dl>
      </section>

      <FormSection title="Terms">
        <Field id="q-currency" label="Currency" error={err("currency")} required>
          <Input id="q-currency" maxLength={3} {...register("currency")} />
        </Field>
        <Field id="q-incoterm" label="Incoterm (shipping basis)" error={err("incoterm")}>
          <select id="q-incoterm" className={selectClass} {...register("incoterm")}>
            {["", "EXW", "FOB", "CFR", "CIF", "DAP", "DDP"].map((t) => (
              <option key={t} value={t}>
                {t || "Not specified"}
              </option>
            ))}
          </select>
        </Field>
        <Field
          id="q-shippingTerms"
          label="Shipping terms"
          error={err("shippingTerms")}
          hint="e.g. Sea freight to Hamburg"
        >
          <Input id="q-shippingTerms" {...register("shippingTerms")} />
        </Field>
        <Field
          id="q-paymentTerms"
          label="Payment terms"
          error={err("paymentTerms")}
          hint="e.g. 30% advance, 70% against B/L copy"
        >
          <Input id="q-paymentTerms" {...register("paymentTerms")} />
        </Field>
        <Field
          id="q-leadTime"
          label="Production lead time"
          error={err("leadTime")}
          hint="e.g. 45 days after sample approval"
        >
          <Input id="q-leadTime" {...register("leadTime")} />
        </Field>
        <Field id="q-validityDate" label="Valid until" error={err("validityDate")}>
          <Input id="q-validityDate" type="date" {...register("validityDate")} />
        </Field>
        <Field id="q-status" label="Status" error={err("status")}>
          <select id="q-status" className={selectClass} {...register("status")}>
            {["DRAFT", "SENT", "ACCEPTED", "REJECTED", "EXPIRED"].map((s) => (
              <option key={s} value={s}>
                {s.toLowerCase()}
              </option>
            ))}
          </select>
        </Field>
        <Field
          id="q-notes"
          label="Notes (shown on the quotation)"
          error={err("notes")}
          className="sm:col-span-2"
        >
          <Textarea id="q-notes" rows={4} {...register("notes")} />
        </Field>
      </FormSection>

      <div className="flex justify-end gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? (
            <Loader2 className="animate-spin" aria-hidden />
          ) : (
            <Save aria-hidden />
          )}
          {quotationId ? "Save quotation" : "Create quotation"}
        </Button>
      </div>
    </form>
  );
}
