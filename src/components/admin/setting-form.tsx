"use client";

import { Loader2, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { saveSetting } from "@/features/settings/actions";
import { type SettingKey } from "@/features/settings/schema";

import { Field } from "./form-fields";

export type SettingField = {
  name: string;
  label: string;
  type?: "text" | "textarea" | "email" | "url";
  hint?: string;
  required?: boolean;
};

/** Generic editor for one flat settings group (contact, social, brand, home, alibaba). */
export function SettingForm({
  settingKey,
  fields,
  initial,
}: {
  settingKey: SettingKey;
  fields: SettingField[];
  initial: Record<string, string | undefined>;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(fields.map((f) => [f.name, initial[f.name] ?? ""])),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  return (
    <form
      className="grid gap-4 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const res = await saveSetting(settingKey, values);
          setErrors(res.ok ? {} : (res.fieldErrors ?? {}));
          if (res.ok) {
            toast.success(res.message ?? "Saved.");
            router.refresh();
          } else toast.error(res.message);
        });
      }}
    >
      {fields.map((f) => {
        const id = `${settingKey}-${f.name}`;
        const common = {
          id,
          value: values[f.name] ?? "",
          "aria-invalid": Boolean(errors[f.name]),
          onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
            setValues({ ...values, [f.name]: e.target.value }),
        };
        return (
          <Field
            key={f.name}
            id={id}
            label={f.label}
            hint={f.hint}
            error={errors[f.name]}
            required={f.required}
            className={f.type === "textarea" ? "sm:col-span-2" : undefined}
          >
            {f.type === "textarea" ? (
              <Textarea rows={5} {...common} />
            ) : (
              <Input
                type={f.type === "email" ? "email" : f.type === "url" ? "url" : "text"}
                {...common}
              />
            )}
          </Field>
        );
      })}
      <div className="flex justify-end sm:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? (
            <Loader2 className="animate-spin" aria-hidden />
          ) : (
            <Save aria-hidden />
          )}{" "}
          Save
        </Button>
      </div>
    </form>
  );
}

/** Editor for the About page sections (fixed list of sections). */
export function AboutForm({
  initial,
}: {
  initial: {
    introDescription: string;
    sections: { id: string; eyebrow: string; title: string; body: string }[];
  };
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [value, setValue] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = (i: number, k: "eyebrow" | "title" | "body", v: string) =>
    setValue({
      ...value,
      sections: value.sections.map((s, j) => (j === i ? { ...s, [k]: v } : s)),
    });

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const res = await saveSetting("about", value);
          setErrors(res.ok ? {} : (res.fieldErrors ?? {}));
          if (res.ok) {
            toast.success(res.message ?? "Saved.");
            router.refresh();
          } else toast.error(res.message);
        });
      }}
    >
      <Field
        id="about-intro"
        label="Introduction"
        error={errors["introDescription"]}
        required
      >
        <Input
          id="about-intro"
          value={value.introDescription}
          onChange={(e) => setValue({ ...value, introDescription: e.target.value })}
        />
      </Field>
      {value.sections.map((s, i) => (
        <fieldset key={s.id} className="grid gap-3 rounded-lg border p-4 sm:grid-cols-2">
          <legend className="px-1 text-sm font-semibold">Section {i + 1}</legend>
          <Field
            id={`about-${i}-eyebrow`}
            label="Label"
            error={errors[`sections.${i}.eyebrow`]}
          >
            <Input
              id={`about-${i}-eyebrow`}
              value={s.eyebrow}
              onChange={(e) => set(i, "eyebrow", e.target.value)}
            />
          </Field>
          <Field
            id={`about-${i}-title`}
            label="Heading"
            error={errors[`sections.${i}.title`]}
          >
            <Input
              id={`about-${i}-title`}
              value={s.title}
              onChange={(e) => set(i, "title", e.target.value)}
            />
          </Field>
          <Field
            id={`about-${i}-body`}
            label="Text"
            hint="Separate paragraphs with a blank line."
            error={errors[`sections.${i}.body`]}
            className="sm:col-span-2"
          >
            <Textarea
              id={`about-${i}-body`}
              rows={5}
              value={s.body}
              onChange={(e) => set(i, "body", e.target.value)}
            />
          </Field>
        </fieldset>
      ))}
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? (
            <Loader2 className="animate-spin" aria-hidden />
          ) : (
            <Save aria-hidden />
          )}{" "}
          Save About page
        </Button>
      </div>
    </form>
  );
}
