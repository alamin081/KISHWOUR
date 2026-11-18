"use client";

import { useState } from "react";

import { deleteCategory } from "@/features/admin/categories/actions";

import { ConfirmButton } from "./action-buttons";
import { selectClass } from "./form-fields";

/** Delete with mandatory reassignment when products still use the category. */
export function DeleteCategory({
  id,
  name,
  productCount,
  targets,
}: {
  id: string;
  name: string;
  productCount: number;
  targets: { id: string; label: string }[];
}) {
  const [target, setTarget] = useState("");
  const needsTarget = productCount > 0;
  return (
    <div className="space-y-3">
      {needsTarget ? (
        <>
          <p className="text-sm">
            {productCount} product{productCount === 1 ? "" : "s"} use this category.
            Choose where to move {productCount === 1 ? "it" : "them"} before deleting:
          </p>
          <select
            className={selectClass}
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            aria-label="Move products to"
          >
            <option value="">Choose a category…</option>
            {targets.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">
          No products use this category. Sub-categories (if any) will become top-level.
        </p>
      )}
      <ConfirmButton
        variant="outline"
        className="text-destructive"
        disabled={needsTarget && !target}
        run={() => deleteCategory(id, needsTarget ? target : undefined)}
        redirectTo="/admin/categories"
        title={`Delete “${name}”?`}
        description={
          needsTarget
            ? `${productCount} product(s) will be moved to the chosen category, then this category is deleted.`
            : "This category will be deleted permanently."
        }
        confirmLabel="Delete category"
      >
        Delete category
      </ConfirmButton>
    </div>
  );
}
