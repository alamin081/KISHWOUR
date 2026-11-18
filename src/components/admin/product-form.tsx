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
import { saveProduct } from "@/features/admin/products/actions";
import {
  type ProductFormInput,
  productFormSchema,
  type ProductFormValues,
} from "@/features/admin/products/schema";
import { slugify } from "@/lib/utils/slugify";

import { CheckboxField, Field, FormSection, selectClass } from "./form-fields";
import { ImageManager } from "./image-manager";

type Props = {
  productId: string | null;
  defaultValues: ProductFormInput;
  categories: { id: string; label: string }[];
  countries: { code: string; name: string }[];
};

const INCOTERMS = ["", "EXW", "FOB", "CFR", "CIF", "DAP", "DDP"] as const;

export function ProductForm({ productId, defaultValues, categories, countries }: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const form = useForm<ProductFormInput, unknown, ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues,
  });
  const { register, formState, setValue, setError } = form;
  const errors = formState.errors as Record<string, { message?: string } | undefined>;
  const err = (name: string) => errors[name]?.message;
  const variants = useFieldArray({ control: form.control, name: "variants" });
  const images = useWatch({ control: form.control, name: "images" });

  function submit(values: ProductFormInput) {
    start(async () => {
      const res = await saveProduct(productId, values);
      if (res.ok) {
        toast.success(res.message ?? "Saved.");
        if (!productId && res.data) router.push(`/admin/products/${res.data.id}/edit`);
        else router.refresh();
        return;
      }
      for (const [key, message] of Object.entries(res.fieldErrors ?? {})) {
        setError(key as keyof ProductFormInput, { message });
      }
      toast.error(res.message);
    });
  }

  const text = (
    name: keyof ProductFormInput,
    label: string,
    opts: {
      hint?: string;
      required?: boolean;
      type?: string;
      className?: string;
      placeholder?: string;
    } = {},
  ) => (
    <Field
      id={`p-${name}`}
      label={label}
      error={err(name)}
      hint={opts.hint}
      required={opts.required}
      className={opts.className}
    >
      <Input
        id={`p-${name}`}
        type={opts.type ?? "text"}
        placeholder={opts.placeholder}
        aria-invalid={Boolean(err(name))}
        {...register(name)}
      />
    </Field>
  );

  return (
    <form
      onSubmit={(e) => void form.handleSubmit(() => submit(form.getValues()))(e)}
      noValidate
      className="space-y-6"
    >
      <FormSection title="Basic information">
        <Field
          id="p-name"
          label="Product name"
          error={err("name")}
          required
          className="sm:col-span-2"
        >
          <Input
            id="p-name"
            aria-invalid={Boolean(err("name"))}
            {...register("name", {
              onBlur: (e: React.FocusEvent<HTMLInputElement>) => {
                if (!form.getValues("slug"))
                  setValue("slug", slugify(e.target.value), { shouldValidate: true });
              },
            })}
          />
        </Field>
        {text("slug", "URL slug", {
          required: true,
          hint: "Used in /products/<slug>. Must not match a category slug.",
        })}
        {text("sku", "SKU", { placeholder: "e.g. KSW-JT-001" })}
        <Field id="p-categoryId" label="Category" error={err("categoryId")} required>
          <select
            id="p-categoryId"
            className={selectClass}
            aria-invalid={Boolean(err("categoryId"))}
            {...register("categoryId")}
          >
            <option value="">Choose a category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </Field>
        {text("productType", "Product type", {
          hint: "Used by the catalogue filter, e.g. Tote bag, Sandal, Basket",
        })}
        <Field
          id="p-shortDescription"
          label="Short description"
          error={err("shortDescription")}
          hint="Shown on product cards (max 300 characters)"
          className="sm:col-span-2"
        >
          <Textarea id="p-shortDescription" rows={2} {...register("shortDescription")} />
        </Field>
        <Field
          id="p-description"
          label="Full description"
          error={err("description")}
          className="sm:col-span-2"
        >
          <Textarea id="p-description" rows={6} {...register("description")} />
        </Field>
      </FormSection>

      <FormSection
        title="Images"
        description="Upload multiple images; set the primary image with the star."
      >
        <ImageManager
          kind="products"
          value={images ?? []}
          onChange={(next) => setValue("images", next, { shouldDirty: true })}
        />
        {err("images") ? (
          <p className="text-xs text-destructive sm:col-span-2">{err("images")}</p>
        ) : null}
      </FormSection>

      <FormSection title="Specifications">
        {text("material", "Material (as shown to buyers)", {
          placeholder: "e.g. Jute with cotton lining",
        })}
        {text("materials", "Material filter tags", {
          hint: "Comma separated, e.g. Jute, Cotton",
        })}
        {text("colors", "Colours", { hint: "Comma separated" })}
        {text("dimensions", "Dimensions", { placeholder: "e.g. 40 × 35 × 12 cm" })}
        {text("weight", "Weight", { placeholder: "e.g. 350 g" })}
        <Field
          id="p-originCountry"
          label="Origin country"
          error={err("originCountry")}
          required
        >
          <select
            id="p-originCountry"
            className={selectClass}
            {...register("originCountry")}
          >
            {countries.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        {text("originRegion", "Origin region / district")}
        {text("hsCode", "HS code")}
      </FormSection>

      <FormSection
        title="Wholesale terms & pricing"
        description="Leave prices empty to show “On request”."
      >
        {text("minimumOrderQuantity", "Minimum order quantity (MOQ)", { type: "number" })}
        {text("unit", "Unit", { required: true, placeholder: "pieces, pairs, sets…" })}
        {text("priceMin", "Wholesale price from", { placeholder: "e.g. 4.50" })}
        {text("priceMax", "Wholesale price to", { placeholder: "e.g. 6.00" })}
        {text("currency", "Currency", { required: true, placeholder: "USD" })}
        <Field id="p-incoterm" label="Price basis (Incoterm)" error={err("incoterm")}>
          <select id="p-incoterm" className={selectClass} {...register("incoterm")}>
            {INCOTERMS.map((t) => (
              <option key={t} value={t}>
                {t || "Not specified"}
              </option>
            ))}
          </select>
        </Field>
        {text("leadTimeDays", "Production lead time (days)", { type: "number" })}
        {text("productionCapacity", "Production capacity", {
          hint: "Only enter verified figures",
        })}
        <Field
          id="p-packagingDetails"
          label="Packaging details"
          error={err("packagingDetails")}
          className="sm:col-span-2"
        >
          <Textarea id="p-packagingDetails" rows={3} {...register("packagingDetails")} />
        </Field>
        <CheckboxField
          id="p-sampleAvailable"
          label="Samples available"
          {...register("sampleAvailable")}
        />
        <CheckboxField
          id="p-isCustomizable"
          label="Customisable (OEM/ODM)"
          {...register("isCustomizable")}
        />
        <Field
          id="p-customizationOptions"
          label="Customisation options"
          hint="One per line or comma separated"
          className="sm:col-span-2"
          error={err("customizationOptions")}
        >
          <Textarea
            id="p-customizationOptions"
            rows={3}
            {...register("customizationOptions")}
          />
        </Field>
        {text("retailPrice", "Retail price (future B2C, optional)")}
        {text("stockQuantity", "Stock quantity (future B2C, optional)", {
          type: "number",
        })}
      </FormSection>

      <section className="rounded-xl border bg-card p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-sans text-base font-semibold">Variants</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Sizes, colours or finishes with their own SKU.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              variants.append({
                name: "",
                sku: "",
                color: "",
                size: "",
                material: "",
                isActive: true,
              })
            }
          >
            <Plus aria-hidden /> Add variant
          </Button>
        </div>
        {err("variants") ? (
          <p className="mt-2 text-xs text-destructive">{err("variants")}</p>
        ) : null}
        {variants.fields.length > 0 ? (
          <ul className="mt-5 space-y-3">
            {variants.fields.map((field, i) => (
              <li
                key={field.id}
                className="grid gap-2 rounded-lg border p-3 sm:grid-cols-[1.4fr_1fr_1fr_1fr_1fr_auto_auto] sm:items-center"
              >
                <Input
                  aria-label="Variant name"
                  placeholder="Name *"
                  {...register(`variants.${i}.name`)}
                />
                <Input
                  aria-label="Variant SKU"
                  placeholder="SKU"
                  {...register(`variants.${i}.sku`)}
                />
                <Input
                  aria-label="Colour"
                  placeholder="Colour"
                  {...register(`variants.${i}.color`)}
                />
                <Input
                  aria-label="Size"
                  placeholder="Size"
                  {...register(`variants.${i}.size`)}
                />
                <Input
                  aria-label="Material"
                  placeholder="Material"
                  {...register(`variants.${i}.material`)}
                />
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="size-4 accent-forest"
                    {...register(`variants.${i}.isActive`)}
                  />{" "}
                  Active
                </label>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="text-destructive"
                  aria-label="Remove variant"
                  onClick={() => variants.remove(i)}
                >
                  <Trash2 />
                </Button>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <FormSection
        title="Alibaba"
        description="Manual links only — Kishwour does not synchronise with Alibaba automatically."
      >
        {text("alibabaUrl", "Alibaba product URL", {
          placeholder: "https://www.alibaba.com/product-detail/…",
          className: "sm:col-span-2",
        })}
        {text("alibabaProductId", "Alibaba product ID")}
      </FormSection>

      <FormSection title="Visibility & SEO">
        <CheckboxField
          id="p-isActive"
          label="Published"
          hint="Visible on the public website"
          {...register("isActive")}
        />
        <CheckboxField
          id="p-isFeatured"
          label="Featured"
          hint="Shown first and on the home page"
          {...register("isFeatured")}
        />
        {text("seoTitle", "SEO title", { hint: "Optional, max 70 characters" })}
        {text("seoDescription", "SEO description", {
          hint: "Optional, max 170 characters",
        })}
      </FormSection>

      <div className="sticky bottom-0 -mx-4 flex justify-end gap-3 border-t bg-background/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/admin/products")}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? (
            <Loader2 className="animate-spin" aria-hidden />
          ) : (
            <Save aria-hidden />
          )}
          {productId ? "Save changes" : "Create product"}
        </Button>
      </div>
    </form>
  );
}
