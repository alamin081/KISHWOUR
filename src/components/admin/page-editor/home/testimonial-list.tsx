"use client";

import { ArrowDown, ArrowUp, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { useId } from "react";
import { type FieldErrors, type UseFormReturn, useFieldArray } from "react-hook-form";

import { Field, selectClass } from "@/components/admin/form-fields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  emptyTestimonial,
  type HomepageSectionFormValues,
  MAX_TESTIMONIALS,
} from "@/features/homepage/schema";
import { COUNTRY_OPTIONS } from "@/lib/data/countries";

type TestimonialsForm = UseFormReturn<HomepageSectionFormValues<"testimonials">>;

function message(errors: FieldErrors, path: string): string | undefined {
  let node: unknown = errors;
  for (const key of path.split(".")) {
    if (typeof node !== "object" || node === null) return undefined;
    node = (node as Record<string, unknown>)[key];
  }
  const text = (node as { message?: unknown } | undefined)?.message;
  return typeof text === "string" ? text : undefined;
}

/**
 * The permission notice is not decoration: published testimonials name real people and
 * real companies, so an admin must have their agreement before adding one.
 */
export function TestimonialConsentNotice() {
  return (
    <p className="flex gap-2 rounded-lg border border-jute/40 bg-jute/5 p-3 text-xs leading-relaxed text-jute-deep">
      <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span>
        <strong className="font-semibold">
          Only add real testimonials from real buyers, with their permission.
        </strong>{" "}
        Never invent quotes or use a name, company or photo you have not been allowed to
        publish.
      </span>
    </p>
  );
}

/**
 * Add, edit, reorder and remove testimonials. Every change flows through React Hook Form,
 * so the live preview updates as you type and the same Zod rules run again on the server.
 */
export function TestimonialList({
  form,
  cloudinaryConfigured,
  renderPhoto,
}: {
  form: TestimonialsForm;
  cloudinaryConfigured: boolean;
  /** Renders the Cloudinary photo control for one row (kept out of this file's imports). */
  renderPhoto: (index: number) => React.ReactNode;
}) {
  const baseId = useId();
  const { fields, append, remove, swap } = useFieldArray({
    control: form.control,
    name: "items",
    keyName: "key",
  });
  const errors = form.formState.errors;
  const listError = message(errors, "items");

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-sans text-sm font-semibold">
          Testimonials ({fields.length}/{MAX_TESTIMONIALS})
        </h3>
      </div>

      {fields.length === 0 ? (
        <p className="rounded-lg border border-dashed bg-secondary/40 px-4 py-6 text-center text-sm text-muted-foreground">
          No testimonials yet. The section stays hidden on the website until you add one.
        </p>
      ) : (
        <ol className="space-y-4">
          {fields.map((field, index) => {
            const id = `${baseId}-${index}`;
            return (
              <li
                key={field.key}
                className="space-y-3 rounded-lg border bg-background p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-muted-foreground">
                    Testimonial {index + 1}
                  </span>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      size="icon-xs"
                      variant="outline"
                      aria-label={`Move testimonial ${index + 1} up`}
                      disabled={index === 0}
                      onClick={() => swap(index, index - 1)}
                    >
                      <ArrowUp />
                    </Button>
                    <Button
                      type="button"
                      size="icon-xs"
                      variant="outline"
                      aria-label={`Move testimonial ${index + 1} down`}
                      disabled={index === fields.length - 1}
                      onClick={() => swap(index, index + 1)}
                    >
                      <ArrowDown />
                    </Button>
                    <Button
                      type="button"
                      size="icon-xs"
                      variant="outline"
                      className="text-destructive"
                      aria-label={`Delete testimonial ${index + 1}`}
                      onClick={() => remove(index)}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </div>

                <Field
                  id={`${id}-quote`}
                  label="Quote"
                  required
                  error={message(errors, `items.${index}.quote`)}
                >
                  <Textarea
                    id={`${id}-quote`}
                    rows={4}
                    aria-invalid={Boolean(message(errors, `items.${index}.quote`))}
                    {...form.register(`items.${index}.quote`)}
                  />
                </Field>

                <Field
                  id={`${id}-name`}
                  label="Name"
                  required
                  error={message(errors, `items.${index}.name`)}
                >
                  <Input
                    id={`${id}-name`}
                    aria-invalid={Boolean(message(errors, `items.${index}.name`))}
                    {...form.register(`items.${index}.name`)}
                  />
                </Field>

                <Field
                  id={`${id}-role`}
                  label="Role or title"
                  error={message(errors, `items.${index}.role`)}
                  hint="Optional, e.g. Purchasing Manager"
                >
                  <Input id={`${id}-role`} {...form.register(`items.${index}.role`)} />
                </Field>

                <Field
                  id={`${id}-company`}
                  label="Company"
                  error={message(errors, `items.${index}.company`)}
                  hint="Optional"
                >
                  <Input
                    id={`${id}-company`}
                    {...form.register(`items.${index}.company`)}
                  />
                </Field>

                <Field
                  id={`${id}-country`}
                  label="Country"
                  error={message(errors, `items.${index}.country`)}
                  hint="Optional"
                >
                  <select
                    id={`${id}-country`}
                    className={selectClass}
                    {...form.register(`items.${index}.country`)}
                  >
                    <option value="">— No country —</option>
                    {COUNTRY_OPTIONS.map((country) => (
                      <option key={country.code} value={country.code}>
                        {country.name}
                      </option>
                    ))}
                  </select>
                </Field>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Photo</p>
                  {renderPhoto(index)}
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {listError ? <p className="text-xs text-destructive">{listError}</p> : null}

      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={fields.length >= MAX_TESTIMONIALS}
        onClick={() => append(emptyTestimonial())}
      >
        <Plus aria-hidden /> Add a testimonial
      </Button>
      {fields.length >= MAX_TESTIMONIALS ? (
        <p className="text-xs text-muted-foreground">
          The homepage shows at most {MAX_TESTIMONIALS} testimonials.
        </p>
      ) : null}
      {cloudinaryConfigured ? null : (
        <p className="text-xs text-destructive">
          Photos need Cloudinary. Testimonials can still be added without one.
        </p>
      )}
    </section>
  );
}
