import { z } from "zod";

const text = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((v) => (v ? v : null));

export const categoryFormSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(120),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(2)
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Lowercase letters, numbers and hyphens only"),
  description: text(1000),
  image: text(500).refine(
    (v) => v === null || v.startsWith("https://res.cloudinary.com/"),
    "Images must be hosted on Cloudinary",
  ),
  imagePublicId: text(300),
  parentId: text(40),
  sortOrder: z.coerce.number().int().min(0).max(9999),
  isActive: z.boolean(),
  seoTitle: text(70),
  seoDescription: text(170),
});

export type CategoryFormInput = z.input<typeof categoryFormSchema>;
export type CategoryFormValues = z.output<typeof categoryFormSchema>;

/** True if making `parentId` the parent of `id` would create a cycle. */
export function wouldCreateCycle(
  id: string,
  parentId: string | null,
  parents: Map<string, string | null>,
): boolean {
  let current = parentId;
  const seen = new Set<string>();
  while (current) {
    if (current === id || seen.has(current)) return true;
    seen.add(current);
    current = parents.get(current) ?? null;
  }
  return false;
}
