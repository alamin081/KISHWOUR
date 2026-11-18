"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { saveCategory } from "@/features/admin/categories/actions";
import {
  type CategoryFormInput,
  categoryFormSchema,
  type CategoryFormValues,
} from "@/features/admin/categories/schema";
import { slugify } from "@/lib/utils/slugify";

import { CheckboxField, Field, FormSection, selectClass } from "./form-fields";
import { ImageManager } from "./image-manager";

type Props = {
  categoryId: string | null;
  defaultValues: CategoryFormInput;
  parents: { id: string; label: string }[];
};

export function CategoryForm({ categoryId, defaultValues, parents }: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const form = useForm<CategoryFormInput, unknown, CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues,
  });
  const { register, setValue, setError } = form;
  const errors = form.formState.errors as Record<
    string,
    { message?: string } | undefined
  >;
  const err = (k: string) => errors[k]?.message;
  const image = useWatch({ control: form.control, name: "image" });
  const imagePublicId = useWatch({ control: form.control, name: "imagePublicId" });

  function submit(values: CategoryFormInput) {
    start(async () => {
      const res = await saveCategory(categoryId, values);
      if (res.ok) {
        toast.success(res.message ?? "Saved.");
        if (!categoryId && res.data) router.push(`/admin/categories/${res.data.id}/edit`);
        else router.refresh();
        return;
      }
      for (const [k, m] of Object.entries(res.fieldErrors ?? {}))
        setError(k as keyof CategoryFormInput, { message: m });
      toast.error(res.message);
    });
  }

  return (
    <form
      onSubmit={(e) => void form.handleSubmit(() => submit(form.getValues()))(e)}
      noValidate
      className="space-y-6"
    >
      <FormSection title="Category">
        <Field id="c-name" label="Name" required error={err("name")}>
          <Input
            id="c-name"
            aria-invalid={Boolean(err("name"))}
            {...register("name", {
              onBlur: (e: React.FocusEvent<HTMLInputElement>) => {
                if (!form.getValues("slug"))
                  setValue("slug", slugify(e.target.value), { shouldValidate: true });
              },
            })}
          />
        </Field>
        <Field
          id="c-slug"
          label="URL slug"
          required
          error={err("slug")}
          hint="Page address: /products/<slug>"
        >
          <Input id="c-slug" aria-invalid={Boolean(err("slug"))} {...register("slug")} />
        </Field>
        <Field
          id="c-parentId"
          label="Parent category"
          error={err("parentId")}
          hint="Leave empty for a top-level category"
        >
          <select id="c-parentId" className={selectClass} {...register("parentId")}>
            <option value="">— None (top level) —</option>
            {parents.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </Field>
        <Field
          id="c-sortOrder"
          label="Sort order"
          error={err("sortOrder")}
          hint="Lower numbers appear first"
        >
          <Input id="c-sortOrder" type="number" min={0} {...register("sortOrder")} />
        </Field>
        <Field
          id="c-description"
          label="Description"
          error={err("description")}
          className="sm:col-span-2"
        >
          <Textarea id="c-description" rows={3} {...register("description")} />
        </Field>
        <CheckboxField
          id="c-isActive"
          label="Visible on the website"
          {...register("isActive")}
        />
      </FormSection>

      <FormSection title="Category image">
        <ImageManager
          kind="categories"
          multiple={false}
          max={1}
          value={image ? [{ imageUrl: image, publicId: imagePublicId ?? null }] : []}
          onChange={(imgs) => {
            setValue("image", imgs[0]?.imageUrl ?? "", { shouldDirty: true });
            setValue("imagePublicId", imgs[0]?.publicId ?? "", { shouldDirty: true });
          }}
        />
      </FormSection>

      <FormSection title="SEO">
        <Field id="c-seoTitle" label="SEO title" error={err("seoTitle")}>
          <Input id="c-seoTitle" {...register("seoTitle")} />
        </Field>
        <Field
          id="c-seoDescription"
          label="SEO description"
          error={err("seoDescription")}
        >
          <Input id="c-seoDescription" {...register("seoDescription")} />
        </Field>
      </FormSection>

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/admin/categories")}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? (
            <Loader2 className="animate-spin" aria-hidden />
          ) : (
            <Save aria-hidden />
          )}
          {categoryId ? "Save changes" : "Create category"}
        </Button>
      </div>
    </form>
  );
}
