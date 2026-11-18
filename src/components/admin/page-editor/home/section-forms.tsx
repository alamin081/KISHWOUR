"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { useEffect, useId, useRef } from "react";
import {
  type FieldErrors,
  type FieldValues,
  type Path,
  type UseFormReturn,
  useForm,
  useWatch,
} from "react-hook-form";

import { Field } from "@/components/admin/form-fields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  type HomepageContent,
  type HomepageImage,
  type HomepageSectionFormValues,
  homepageSectionFormSchemas,
  MAX_CRAFT_POINTS,
  MAX_CUSTOM_OPTIONS,
  MAX_WHOLESALE_POINTS,
} from "@/features/homepage/schema";

import { SectionImageField } from "../image-field";
import { TestimonialConsentNotice, TestimonialList } from "./testimonial-list";

/**
 * One typed React Hook Form per homepage section. `visible`, `order` and the section image
 * are owned by the editor (hover controls / upload control), so each form covers the text
 * fields only and reports every keystroke upwards for the live preview.
 */

type FormProps<K extends keyof HomepageContent> = {
  section: HomepageContent[K];
  onChange: (values: HomepageSectionFormValues<K>) => void;
  /** Field errors returned by the Server Action, relative to this section. */
  serverErrors: Record<string, string>;
};

type TestimonialsFormProps = FormProps<"testimonials"> & {
  cloudinaryConfigured: boolean;
};

function errorMessage(errors: FieldErrors, path: string): string | undefined {
  let node: unknown = errors;
  for (const key of path.split(".")) {
    if (typeof node !== "object" || node === null) return undefined;
    node = (node as Record<string, unknown>)[key];
  }
  const message = (node as { message?: unknown } | undefined)?.message;
  return typeof message === "string" ? message : undefined;
}

/** Pushes every change to the parent so the preview updates as the admin types. */
function useLiveSync<T extends FieldValues>(
  form: UseFormReturn<T>,
  onChange: (values: T) => void,
): void {
  const latest = useRef(onChange);
  useEffect(() => {
    latest.current = onChange;
  }, [onChange]);
  useEffect(() => {
    const subscription = form.watch(() => latest.current(form.getValues()));
    return () => subscription.unsubscribe();
  }, [form]);
}

/** Applies Server Action field errors to the form so they appear under the right input. */
function useServerErrors<T extends FieldValues>(
  form: UseFormReturn<T>,
  serverErrors: Record<string, string>,
): void {
  const { setError } = form;
  useEffect(() => {
    for (const [name, message] of Object.entries(serverErrors)) {
      setError(name as Path<T>, { type: "server", message });
    }
  }, [serverErrors, setError]);
}

type RowProps<T extends FieldValues> = {
  form: UseFormReturn<T>;
  name: Path<T>;
  label: string;
  hint?: string;
  required?: boolean;
};

function TextRow<T extends FieldValues>({
  form,
  name,
  label,
  hint,
  required,
}: RowProps<T>) {
  const id = useId();
  const error = errorMessage(form.formState.errors, name);
  return (
    <Field id={id} label={label} hint={hint} required={required} error={error}>
      <Input id={id} aria-invalid={Boolean(error)} {...form.register(name)} />
    </Field>
  );
}

function TextareaRow<T extends FieldValues>({
  form,
  name,
  label,
  hint,
  required,
  rows = 5,
}: RowProps<T> & { rows?: number }) {
  const id = useId();
  const error = errorMessage(form.formState.errors, name);
  return (
    <Field id={id} label={label} hint={hint} required={required} error={error}>
      <Textarea
        id={id}
        rows={rows}
        aria-invalid={Boolean(error)}
        {...form.register(name)}
      />
    </Field>
  );
}

function ListFrame({
  legend,
  hint,
  children,
  onAdd,
  addLabel,
  canAdd,
  error,
}: {
  legend: string;
  hint?: string;
  children: React.ReactNode;
  onAdd: () => void;
  addLabel: string;
  canAdd: boolean;
  error?: string;
}) {
  return (
    <fieldset className="space-y-3 rounded-lg border p-3">
      <legend className="px-1 text-sm font-medium">{legend}</legend>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={onAdd}
        disabled={!canAdd}
      >
        <Plus aria-hidden /> {addLabel}
      </Button>
    </fieldset>
  );
}

function PointError({ errors, index }: { errors: FieldErrors; index: number }) {
  const message =
    errorMessage(errors, `points.${index}.title`) ??
    errorMessage(errors, `points.${index}.text`);
  return message ? <p className="text-xs text-destructive">{message}</p> : null;
}

/* ------------------------------------------------------------------ Hero */

export function HeroForm({ section, onChange, serverErrors }: FormProps<"hero">) {
  const { visible: _visible, order: _order, image: _image, ...defaultValues } = section;
  const form = useForm<HomepageSectionFormValues<"hero">>({
    resolver: zodResolver(homepageSectionFormSchemas.hero),
    defaultValues,
    mode: "onBlur",
  });
  useLiveSync(form, onChange);
  useServerErrors(form, serverErrors);

  return (
    <div className="space-y-4">
      <TextRow
        form={form}
        name="eyebrow"
        label="Label above the heading"
        hint="Leave empty to hide it"
      />
      <TextareaRow form={form} name="title" label="Heading" rows={3} required />
      <TextareaRow form={form} name="subtitle" label="Intro text" rows={4} required />
      <TextRow
        form={form}
        name="primaryCtaLabel"
        label="First button label"
        hint="Links to the products page"
        required
      />
      <TextRow
        form={form}
        name="secondaryCtaLabel"
        label="Second button label"
        hint="Links to the wholesale page. Leave empty to hide the button."
      />
    </div>
  );
}

/* ------------------------------------------------------- Categories / Featured */

export function CategoriesForm({
  section,
  onChange,
  serverErrors,
}: FormProps<"categories">) {
  const { visible: _visible, order: _order, ...defaultValues } = section;
  const form = useForm<HomepageSectionFormValues<"categories">>({
    resolver: zodResolver(homepageSectionFormSchemas.categories),
    defaultValues,
    mode: "onBlur",
  });
  useLiveSync(form, onChange);
  useServerErrors(form, serverErrors);

  return (
    <div className="space-y-4">
      <TextRow form={form} name="eyebrow" label="Label above the heading" />
      <TextRow form={form} name="title" label="Heading" required />
      <TextareaRow form={form} name="description" label="Intro text" rows={3} />
      <TextRow
        form={form}
        name="ctaLabel"
        label="Button label"
        hint="Links to all categories. Leave empty to hide the button."
      />
    </div>
  );
}

export function FeaturedForm({ section, onChange, serverErrors }: FormProps<"featured">) {
  const { visible: _visible, order: _order, ...defaultValues } = section;
  const form = useForm<HomepageSectionFormValues<"featured">>({
    resolver: zodResolver(homepageSectionFormSchemas.featured),
    defaultValues,
    mode: "onBlur",
  });
  useLiveSync(form, onChange);
  useServerErrors(form, serverErrors);

  return (
    <div className="space-y-4">
      <TextRow form={form} name="eyebrow" label="Label above the heading" />
      <TextRow form={form} name="title" label="Heading" required />
      <TextareaRow form={form} name="description" label="Intro text" rows={3} />
      <TextRow
        form={form}
        name="ctaLabel"
        label="Button label"
        hint="Links to all products. Leave empty to hide the button."
      />
    </div>
  );
}

/* ----------------------------------------------------------------- About */

export function AboutForm({ section, onChange, serverErrors }: FormProps<"about">) {
  const { visible: _visible, order: _order, image: _image, ...defaultValues } = section;
  const form = useForm<HomepageSectionFormValues<"about">>({
    resolver: zodResolver(homepageSectionFormSchemas.about),
    defaultValues,
    mode: "onBlur",
  });
  useLiveSync(form, onChange);
  useServerErrors(form, serverErrors);

  return (
    <div className="space-y-4">
      <TextRow form={form} name="eyebrow" label="Label above the heading" />
      <TextareaRow form={form} name="title" label="Heading" rows={2} required />
      <TextareaRow
        form={form}
        name="body"
        label="Text"
        rows={8}
        hint="Separate paragraphs with a blank line. Do not add unverified claims."
        required
      />
      <TextRow
        form={form}
        name="linkLabel"
        label="Link label"
        hint="Links to the About page. Leave empty to hide the link."
      />
    </div>
  );
}

/* ----------------------------------------------------------------- Craft */

export function CraftForm({ section, onChange, serverErrors }: FormProps<"craft">) {
  const { visible: _visible, order: _order, image: _image, ...defaultValues } = section;
  const form = useForm<HomepageSectionFormValues<"craft">>({
    resolver: zodResolver(homepageSectionFormSchemas.craft),
    defaultValues,
    mode: "onBlur",
  });
  useLiveSync(form, onChange);
  useServerErrors(form, serverErrors);

  const points = useWatch({ control: form.control, name: "points" }) ?? [];
  const setPoints = (next: { title: string; text: string }[]) =>
    form.setValue("points", next, { shouldDirty: true, shouldValidate: true });

  return (
    <div className="space-y-4">
      <TextRow form={form} name="eyebrow" label="Label above the heading" />
      <TextareaRow form={form} name="title" label="Heading" rows={2} required />
      <ListFrame
        legend="Craft points"
        hint={`Each point gets its own icon. Up to ${MAX_CRAFT_POINTS}.`}
        addLabel="Add a point"
        canAdd={points.length < MAX_CRAFT_POINTS}
        error={errorMessage(form.formState.errors, "points")}
        onAdd={() => setPoints([...points, { title: "", text: "" }])}
      >
        <ul className="space-y-3">
          {points.map((_point, i) => (
            <li key={i} className="space-y-2 rounded-md border bg-background p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-muted-foreground">
                  Point {i + 1}
                </span>
                <Button
                  type="button"
                  size="icon-xs"
                  variant="outline"
                  className="text-destructive"
                  aria-label={`Remove point ${i + 1}`}
                  onClick={() => setPoints(points.filter((_, j) => j !== i))}
                >
                  <Trash2 />
                </Button>
              </div>
              <Input
                aria-label={`Point ${i + 1} heading`}
                placeholder="Heading"
                aria-invalid={Boolean(
                  errorMessage(form.formState.errors, `points.${i}.title`),
                )}
                {...form.register(`points.${i}.title`)}
              />
              <Textarea
                rows={3}
                aria-label={`Point ${i + 1} text`}
                placeholder="Text"
                aria-invalid={Boolean(
                  errorMessage(form.formState.errors, `points.${i}.text`),
                )}
                {...form.register(`points.${i}.text`)}
              />
              <PointError errors={form.formState.errors} index={i} />
            </li>
          ))}
        </ul>
      </ListFrame>
      <TextRow
        form={form}
        name="ctaLabel"
        label="Button label"
        hint="Links to the Our Craft page. Leave empty to hide the button."
      />
    </div>
  );
}

/* ------------------------------------------------------------- Wholesale */

export function WholesaleForm({
  section,
  onChange,
  serverErrors,
}: FormProps<"wholesale">) {
  const { visible: _visible, order: _order, ...defaultValues } = section;
  const form = useForm<HomepageSectionFormValues<"wholesale">>({
    resolver: zodResolver(homepageSectionFormSchemas.wholesale),
    defaultValues,
    mode: "onBlur",
  });
  useLiveSync(form, onChange);
  useServerErrors(form, serverErrors);

  const points = useWatch({ control: form.control, name: "points" }) ?? [];
  const setPoints = (next: string[]) =>
    form.setValue("points", next, { shouldDirty: true, shouldValidate: true });

  return (
    <div className="space-y-4">
      <TextRow form={form} name="eyebrow" label="Label above the heading" />
      <TextareaRow form={form} name="title" label="Heading" rows={2} required />
      <TextareaRow form={form} name="text" label="Text" rows={4} required />
      <ListFrame
        legend="Highlights"
        hint={`Short entries shown as a list beside the text. Up to ${MAX_WHOLESALE_POINTS}.`}
        addLabel="Add an entry"
        canAdd={points.length < MAX_WHOLESALE_POINTS}
        error={errorMessage(form.formState.errors, "points")}
        onAdd={() => setPoints([...points, ""])}
      >
        <ul className="space-y-2">
          {points.map((point, i) => (
            <li key={i} className="flex items-start gap-2">
              <Input
                aria-label={`Highlight ${i + 1}`}
                aria-invalid={Boolean(errorMessage(form.formState.errors, `points.${i}`))}
                {...form.register(`points.${i}`)}
              />
              <Button
                type="button"
                size="icon-sm"
                variant="outline"
                className="shrink-0 text-destructive"
                aria-label={`Remove highlight ${i + 1}`}
                onClick={() => setPoints(points.filter((_, j) => j !== i))}
              >
                <Trash2 />
              </Button>
            </li>
          ))}
        </ul>
      </ListFrame>
      <TextRow
        form={form}
        name="primaryCtaLabel"
        label="First button label"
        hint="Links to the quote request form"
        required
      />
      <TextRow
        form={form}
        name="secondaryCtaLabel"
        label="Second button label"
        hint="Links to the wholesale page. Leave empty to hide the button."
      />
    </div>
  );
}

/* --------------------------------------------------- Custom manufacturing */

export function CustomManufacturingForm({
  section,
  onChange,
  serverErrors,
}: FormProps<"customManufacturing">) {
  const { visible: _visible, order: _order, ...defaultValues } = section;
  const form = useForm<HomepageSectionFormValues<"customManufacturing">>({
    resolver: zodResolver(homepageSectionFormSchemas.customManufacturing),
    defaultValues,
    mode: "onBlur",
  });
  useLiveSync(form, onChange);
  useServerErrors(form, serverErrors);

  const options = useWatch({ control: form.control, name: "options" }) ?? [];
  const setOptions = (next: string[]) =>
    form.setValue("options", next, { shouldDirty: true, shouldValidate: true });

  return (
    <div className="space-y-4">
      <TextRow form={form} name="eyebrow" label="Label above the heading" />
      <TextareaRow form={form} name="title" label="Heading" rows={2} required />
      <TextareaRow form={form} name="text" label="Text" rows={4} required />
      <TextRow
        form={form}
        name="optionsHeading"
        label="List heading"
        hint="Leave empty to hide the heading"
      />
      <ListFrame
        legend="What buyers can ask about"
        hint={`Up to ${MAX_CUSTOM_OPTIONS} entries.`}
        addLabel="Add an entry"
        canAdd={options.length < MAX_CUSTOM_OPTIONS}
        error={errorMessage(form.formState.errors, "options")}
        onAdd={() => setOptions([...options, ""])}
      >
        <ul className="space-y-2">
          {options.map((option, i) => (
            <li key={i} className="flex items-start gap-2">
              <Input
                aria-label={`Entry ${i + 1}`}
                aria-invalid={Boolean(
                  errorMessage(form.formState.errors, `options.${i}`),
                )}
                {...form.register(`options.${i}`)}
              />
              <Button
                type="button"
                size="icon-sm"
                variant="outline"
                className="shrink-0 text-destructive"
                aria-label={`Remove entry ${i + 1}`}
                onClick={() => setOptions(options.filter((_, j) => j !== i))}
              >
                <Trash2 />
              </Button>
            </li>
          ))}
        </ul>
      </ListFrame>
      <TextRow
        form={form}
        name="ctaLabel"
        label="Button label"
        hint="Links to the custom manufacturing section. Leave empty to hide the button."
      />
    </div>
  );
}

/* -------------------------------------------------------- Sustainability */

export function SustainabilityForm({
  section,
  onChange,
  serverErrors,
}: FormProps<"sustainability">) {
  const { visible: _visible, order: _order, image: _image, ...defaultValues } = section;
  const form = useForm<HomepageSectionFormValues<"sustainability">>({
    resolver: zodResolver(homepageSectionFormSchemas.sustainability),
    defaultValues,
    mode: "onBlur",
  });
  useLiveSync(form, onChange);
  useServerErrors(form, serverErrors);

  return (
    <div className="space-y-4">
      <TextRow form={form} name="eyebrow" label="Label above the heading" />
      <TextareaRow form={form} name="title" label="Heading" rows={2} required />
      <TextareaRow form={form} name="text" label="Text" rows={5} required />
      <TextRow
        form={form}
        name="linkLabel"
        label="Link label"
        hint="Links to the Sustainability page. Leave empty to hide the link."
      />
    </div>
  );
}

/* ---------------------------------------------------------- Testimonials */

export function TestimonialsForm({
  section,
  onChange,
  serverErrors,
  cloudinaryConfigured,
}: TestimonialsFormProps) {
  const { visible: _visible, order: _order, ...defaultValues } = section;
  const form = useForm<HomepageSectionFormValues<"testimonials">>({
    resolver: zodResolver(homepageSectionFormSchemas.testimonials),
    defaultValues,
    mode: "onBlur",
  });
  useLiveSync(form, onChange);
  useServerErrors(form, serverErrors);

  const setPhoto = (index: number, photo: HomepageImage | null) =>
    form.setValue(`items.${index}.photo`, photo, {
      shouldDirty: true,
      shouldValidate: true,
    });

  return (
    <div className="space-y-4">
      <TestimonialConsentNotice />
      <TextRow form={form} name="eyebrow" label="Label above the heading" />
      <TextRow form={form} name="title" label="Heading" required />
      <TestimonialList
        form={form}
        cloudinaryConfigured={cloudinaryConfigured}
        renderPhoto={(index) => (
          <TestimonialPhoto
            form={form}
            index={index}
            cloudinaryConfigured={cloudinaryConfigured}
            onChange={(photo) => setPhoto(index, photo)}
          />
        )}
      />
    </div>
  );
}

/** Keeps one row's photo control subscribed to just that row's value. */
function TestimonialPhoto({
  form,
  index,
  cloudinaryConfigured,
  onChange,
}: {
  form: UseFormReturn<HomepageSectionFormValues<"testimonials">>;
  index: number;
  cloudinaryConfigured: boolean;
  onChange: (photo: HomepageImage | null) => void;
}) {
  const photo = useWatch({ control: form.control, name: `items.${index}.photo` });
  return (
    <SectionImageField
      variant="portrait"
      label="Portrait"
      value={photo ?? null}
      cloudinaryConfigured={cloudinaryConfigured}
      error={
        errorMessage(form.formState.errors, `items.${index}.photo.alt`) ??
        errorMessage(form.formState.errors, `items.${index}.photo.url`)
      }
      onChange={onChange}
    />
  );
}

/* --------------------------------------------------------------- Contact */

export function ContactForm({ section, onChange, serverErrors }: FormProps<"contact">) {
  const { visible: _visible, order: _order, ...defaultValues } = section;
  const form = useForm<HomepageSectionFormValues<"contact">>({
    resolver: zodResolver(homepageSectionFormSchemas.contact),
    defaultValues,
    mode: "onBlur",
  });
  useLiveSync(form, onChange);
  useServerErrors(form, serverErrors);

  return (
    <div className="space-y-4">
      <TextareaRow form={form} name="title" label="Heading" rows={2} required />
      <TextareaRow form={form} name="text" label="Text" rows={3} required />
      <TextRow
        form={form}
        name="primaryCtaLabel"
        label="First button label"
        hint="Links to the quote request form"
        required
      />
      <TextRow
        form={form}
        name="secondaryCtaLabel"
        label="Second button label"
        hint="Links to the contact page. Leave empty to hide the button."
      />
      <TextRow
        form={form}
        name="whatsappLabel"
        label="WhatsApp button label"
        hint="Only shown when a WhatsApp number is set under Content → Contact details."
      />
    </div>
  );
}
