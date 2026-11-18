"use client";

import { ArrowDown, ArrowUp, Plus, ShieldAlert, Trash2 } from "lucide-react";
import { useEffect, useId, useRef } from "react";
import {
  type FieldErrors,
  type FieldValues,
  type Path,
  type UseFormReturn,
  useForm,
  useWatch,
} from "react-hook-form";

import { CheckboxField, Field, selectClass } from "@/components/admin/form-fields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  emptyItem,
  MAX_BLOCK_ITEMS,
  type PageBlock,
  type TitledItem,
} from "@/features/pages/blocks";

/**
 * Edit panel for one block. React Hook Form drives every field, so the preview updates as
 * the admin types and the same values are validated again by the Server Action.
 *
 * `visible` and the block image are owned by the editor (hover controls / upload control),
 * so they are not part of these forms.
 */

export type BlockValues = Record<string, unknown>;

type Props = {
  block: PageBlock;
  onChange: (values: BlockValues) => void;
  /** Field errors from the last save, relative to this block. */
  serverErrors: Record<string, string>;
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

/** Pushes every change to the parent so the preview follows along. */
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

function ToneRow<T extends FieldValues>({
  form,
  name,
  options,
}: {
  form: UseFormReturn<T>;
  name: Path<T>;
  options: { value: string; label: string }[];
}) {
  const id = useId();
  return (
    <Field id={id} label="Background">
      <select id={id} className={selectClass} {...form.register(name)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

/* ----------------------------------------------------------- list editors */

/** Add / edit / reorder / remove a list of {title, text} items. */
function ItemListEditor<T extends FieldValues>({
  form,
  name,
  legend,
  hint,
  itemNoun,
  titleLabel,
  textLabel,
  textRows = 3,
}: {
  form: UseFormReturn<T>;
  name: Path<T>;
  legend: string;
  hint?: string;
  itemNoun: string;
  titleLabel: string;
  textLabel: string;
  textRows?: number;
}) {
  const items = (useWatch({ control: form.control, name }) ?? []) as TitledItem[];
  const errors = form.formState.errors;
  const set = (next: TitledItem[]) =>
    form.setValue(name, next as never, { shouldDirty: true, shouldValidate: true });
  const swap = (from: number, to: number) => {
    if (to < 0 || to >= items.length) return;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    if (moved) next.splice(to, 0, moved);
    set(next);
  };

  return (
    <fieldset className="space-y-3 rounded-lg border p-3">
      <legend className="px-1 text-sm font-medium">
        {legend} ({items.length}/{MAX_BLOCK_ITEMS})
      </legend>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      {items.length === 0 ? (
        <p className="rounded-md border border-dashed bg-secondary/40 px-3 py-4 text-center text-xs text-muted-foreground">
          Nothing here yet. The section stays hidden until you add {itemNoun}.
        </p>
      ) : (
        <ol className="space-y-3">
          {items.map((item, index) => (
            <li key={item.id} className="space-y-2 rounded-md border bg-background p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-muted-foreground">
                  {index + 1}
                </span>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    size="icon-xs"
                    variant="outline"
                    aria-label={`Move entry ${index + 1} up`}
                    disabled={index === 0}
                    onClick={() => swap(index, index - 1)}
                  >
                    <ArrowUp />
                  </Button>
                  <Button
                    type="button"
                    size="icon-xs"
                    variant="outline"
                    aria-label={`Move entry ${index + 1} down`}
                    disabled={index === items.length - 1}
                    onClick={() => swap(index, index + 1)}
                  >
                    <ArrowDown />
                  </Button>
                  <Button
                    type="button"
                    size="icon-xs"
                    variant="outline"
                    className="text-destructive"
                    aria-label={`Delete entry ${index + 1}`}
                    onClick={() => set(items.filter((_, i) => i !== index))}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </div>
              <Input
                aria-label={`${titleLabel} ${index + 1}`}
                placeholder={titleLabel}
                aria-invalid={Boolean(
                  errorMessage(errors, `${String(name)}.${index}.title`),
                )}
                {...form.register(`${String(name)}.${index}.title` as Path<T>)}
              />
              <Textarea
                rows={textRows}
                aria-label={`${textLabel} ${index + 1}`}
                placeholder={textLabel}
                aria-invalid={Boolean(
                  errorMessage(errors, `${String(name)}.${index}.text`),
                )}
                {...form.register(`${String(name)}.${index}.text` as Path<T>)}
              />
              <ItemError errors={errors} base={`${String(name)}.${index}`} />
            </li>
          ))}
        </ol>
      )}
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={items.length >= MAX_BLOCK_ITEMS}
        onClick={() => set([...items, emptyItem()])}
      >
        <Plus aria-hidden /> Add {itemNoun}
      </Button>
    </fieldset>
  );
}

function ItemError({ errors, base }: { errors: FieldErrors; base: string }) {
  const message =
    errorMessage(errors, `${base}.title`) ?? errorMessage(errors, `${base}.text`);
  return message ? <p className="text-xs text-destructive">{message}</p> : null;
}

/** Add / edit / reorder / remove a plain list of strings. */
function StringListEditor<T extends FieldValues>({
  form,
  name,
  legend,
  hint,
}: {
  form: UseFormReturn<T>;
  name: Path<T>;
  legend: string;
  hint?: string;
}) {
  const items = (useWatch({ control: form.control, name }) ?? []) as string[];
  const set = (next: string[]) =>
    form.setValue(name, next as never, { shouldDirty: true, shouldValidate: true });

  return (
    <fieldset className="space-y-3 rounded-lg border p-3">
      <legend className="px-1 text-sm font-medium">
        {legend} ({items.length}/{MAX_BLOCK_ITEMS})
      </legend>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      <ul className="space-y-2">
        {items.map((_item, index) => (
          <li key={index} className="flex items-start gap-2">
            <Input
              aria-label={`Entry ${index + 1}`}
              aria-invalid={Boolean(
                errorMessage(form.formState.errors, `${String(name)}.${index}`),
              )}
              {...form.register(`${String(name)}.${index}` as Path<T>)}
            />
            <Button
              type="button"
              size="icon-sm"
              variant="outline"
              className="shrink-0 text-destructive"
              aria-label={`Remove entry ${index + 1}`}
              onClick={() => set(items.filter((_, i) => i !== index))}
            >
              <Trash2 />
            </Button>
          </li>
        ))}
      </ul>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={items.length >= MAX_BLOCK_ITEMS}
        onClick={() => set([...items, ""])}
      >
        <Plus aria-hidden /> Add an entry
      </Button>
    </fieldset>
  );
}

/* --------------------------------------------------------------- the form */

type FormOf<B extends PageBlock> = Omit<B, "id" | "type" | "visible" | "image">;

function useBlockForm<B extends PageBlock>(
  block: B,
  onChange: (values: BlockValues) => void,
  serverErrors: Record<string, string>,
): UseFormReturn<FormOf<B> & FieldValues> {
  const {
    id: _id,
    type: _type,
    visible: _visible,
    ...rest
  } = block as PageBlock & { image?: unknown };
  const { image: _image, ...defaultValues } = rest as Record<string, unknown>;
  const form = useForm<FormOf<B> & FieldValues>({
    defaultValues: defaultValues as never,
    mode: "onBlur",
  });
  useLiveSync(form, onChange as (values: FormOf<B> & FieldValues) => void);
  useServerErrors(form, serverErrors);
  return form;
}

/**
 * Renders the fields for whichever block is open. Validation happens on the server for
 * the whole document; these forms keep the shapes and report the messages back.
 */
export function BlockForm({ block, onChange, serverErrors }: Props) {
  const form = useBlockForm(block, onChange, serverErrors);

  switch (block.type) {
    case "header":
      return (
        <div className="space-y-4">
          <TextRow
            form={form}
            name="eyebrow"
            label="Label above the heading"
            hint="Leave empty to hide it"
          />
          <TextareaRow form={form} name="title" label="Heading" rows={2} required />
          <TextareaRow form={form} name="description" label="Intro text" rows={4} />
        </div>
      );

    case "hero":
      return (
        <div className="space-y-4">
          <TextRow form={form} name="eyebrow" label="Label above the heading" />
          <TextareaRow form={form} name="title" label="Heading" rows={2} required />
          <TextareaRow form={form} name="description" label="Intro text" rows={4} />
          <TextRow
            form={form}
            name="primaryCtaLabel"
            label="First button label"
            hint="Links to the quote request form. Empty hides the button."
          />
          <TextRow
            form={form}
            name="secondaryCtaLabel"
            label="Second button label"
            hint="Links to the product catalogue. Empty hides the button."
          />
        </div>
      );

    case "editorial":
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
            name="mediaLabel"
            label="Photo slot label"
            hint='Empty = no photo beside the text. Otherwise e.g. "Brand photography"; it names the placeholder until you upload a photo.'
          />
          <CheckboxField
            id="block-reverse"
            label="Photo on the left"
            hint="Swaps the text and photo columns on wide screens."
            {...form.register("reverse")}
          />
          <ToneRow
            form={form}
            name="tone"
            options={[
              { value: "default", label: "Plain" },
              { value: "muted", label: "Tinted" },
            ]}
          />
        </div>
      );

    case "cards":
      return (
        <div className="space-y-4">
          <TextRow form={form} name="eyebrow" label="Label above the heading" />
          <TextareaRow form={form} name="title" label="Heading" rows={2} required />
          <TextareaRow form={form} name="description" label="Intro text" rows={3} />
          <ItemListEditor
            form={form}
            name="items"
            legend="Cards"
            itemNoun="a card"
            titleLabel="Card heading"
            textLabel="Card text"
            hint="Each card links to the quote form. Icons and links follow the card's ID, so cards you add use the default icon and link."
          />
        </div>
      );

    case "steps":
      return (
        <div className="space-y-4">
          <TextRow form={form} name="eyebrow" label="Label above the heading" />
          <TextareaRow form={form} name="title" label="Heading" rows={2} required />
          <CheckboxField
            id="block-centered"
            label="Centre the heading"
            {...form.register("centered")}
          />
          <ToneRow
            form={form}
            name="tone"
            options={[
              { value: "default", label: "Plain" },
              { value: "dark", label: "Dark band" },
            ]}
          />
          <ItemListEditor
            form={form}
            name="items"
            legend="Steps"
            itemNoun="a step"
            titleLabel="Step heading"
            textLabel="Step text"
            hint="Numbered automatically in this order."
          />
        </div>
      );

    case "checklist":
      return (
        <div className="space-y-4">
          <TextRow form={form} name="eyebrow" label="Label above the heading" />
          <TextareaRow form={form} name="title" label="Heading" rows={2} required />
          <TextareaRow form={form} name="text" label="Text" rows={4} />
          <TextRow
            form={form}
            name="ctaLabel"
            label="Button label"
            hint="Links to the custom-manufacturing quote form. Empty hides the button."
          />
          <StringListEditor
            form={form}
            name="items"
            legend="Tick list"
            hint="Short entries shown with a tick beside the text."
          />
          <ToneRow
            form={form}
            name="tone"
            options={[
              { value: "muted", label: "Tinted" },
              { value: "default", label: "Plain" },
            ]}
          />
        </div>
      );

    case "claims":
      return (
        <div className="space-y-4">
          <p className="flex gap-2 rounded-lg border border-jute/40 bg-jute/5 p-3 text-xs leading-relaxed text-jute-deep">
            <ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>
              <strong className="font-semibold">
                Only publish claims you can verify.
              </strong>{" "}
              Keep the certificate, test report or supplier document on file before adding
              a commitment here. Leave the list empty if nothing is verified yet.
            </span>
          </p>
          <TextareaRow form={form} name="title" label="Heading" rows={2} required />
          <ItemListEditor
            form={form}
            name="items"
            legend="Verified commitments"
            itemNoun="a commitment"
            titleLabel="Commitment"
            textLabel="What it means"
          />
        </div>
      );

    case "note":
      return (
        <div className="space-y-4">
          <TextareaRow form={form} name="text" label="Text" rows={4} required />
        </div>
      );

    case "callout":
      return (
        <div className="space-y-4">
          <TextareaRow form={form} name="title" label="Heading" rows={2} required />
          <TextareaRow form={form} name="text" label="Text" rows={6} required />
        </div>
      );

    case "cta":
      return (
        <div className="space-y-4">
          <CheckboxField
            id="block-bordered"
            label="Show a line above the section"
            {...form.register("bordered")}
          />
        </div>
      );
  }
}
