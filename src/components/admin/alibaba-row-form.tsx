"use client";

import { Loader2, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateProductAlibaba } from "@/features/admin/products/actions";

export function AlibabaRowForm({
  id,
  url,
  productId,
  name,
}: {
  id: string;
  url: string;
  productId: string;
  name: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [v, setV] = useState({ alibabaUrl: url, alibabaProductId: productId });
  return (
    <form
      className="grid gap-2 sm:grid-cols-[1fr_9rem_auto]"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const res = await updateProductAlibaba(id, v);
          if (res.ok) {
            toast.success(res.message ?? "Saved.");
            router.refresh();
          } else toast.error(res.message);
        });
      }}
    >
      <Input
        aria-label={`Alibaba URL for ${name}`}
        placeholder="https://www.alibaba.com/product-detail/…"
        value={v.alibabaUrl}
        onChange={(e) => setV({ ...v, alibabaUrl: e.target.value })}
        className="h-8 text-xs"
      />
      <Input
        aria-label={`Alibaba product ID for ${name}`}
        placeholder="Product ID"
        value={v.alibabaProductId}
        onChange={(e) => setV({ ...v, alibabaProductId: e.target.value })}
        className="h-8 text-xs"
      />
      <Button type="submit" size="sm" variant="outline" disabled={pending}>
        {pending ? (
          <Loader2 className="animate-spin" aria-hidden />
        ) : (
          <Save aria-hidden />
        )}{" "}
        Save
      </Button>
    </form>
  );
}
