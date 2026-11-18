"use client";

import { Loader2, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  type InquiryUpdateInput,
  updateInquiry,
} from "@/features/admin/inquiries/actions";
import {
  INQUIRY_SOURCE_LABELS,
  INQUIRY_STATUS_LABELS,
} from "@/features/inquiries/status";

import { Field, selectClass } from "./form-fields";

type Props = {
  id: string;
  status: string;
  source: string;
  adminNotes: string;
  assignedToId: string;
  staff: { id: string; name: string | null; email: string }[];
  emailConfigured: boolean;
};

export function InquiryUpdateForm({
  id,
  status,
  source,
  adminNotes,
  assignedToId,
  staff,
  emailConfigured,
}: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [values, setValues] = useState({
    status,
    source,
    adminNotes,
    assignedToId,
    notifyBuyer: false,
    buyerNote: "",
  });
  const statusChanged = values.status !== status;

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          // Values come from fixed option lists; the server validates them again.
          const res = await updateInquiry(id, {
            ...values,
            notifyBuyer: statusChanged && values.notifyBuyer,
          } as InquiryUpdateInput);
          if (res.ok) {
            toast.success(res.message ?? "Saved.");
            setValues((v) => ({ ...v, notifyBuyer: false, buyerNote: "" }));
            router.refresh();
          } else toast.error(res.message);
        });
      }}
    >
      <Field id="i-status" label="Status">
        <select
          id="i-status"
          className={selectClass}
          value={values.status}
          onChange={(e) => setValues({ ...values, status: e.target.value })}
        >
          {Object.entries(INQUIRY_STATUS_LABELS).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </Field>
      {statusChanged ? (
        <div className="space-y-3 rounded-md bg-secondary/50 p-3">
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              className="mt-0.5 size-4 accent-forest"
              disabled={!emailConfigured}
              checked={values.notifyBuyer}
              onChange={(e) => setValues({ ...values, notifyBuyer: e.target.checked })}
            />
            <span>
              Email the buyer about this status
              {!emailConfigured ? (
                <span className="block text-xs text-muted-foreground">
                  Email is not configured.
                </span>
              ) : null}
            </span>
          </label>
          {values.notifyBuyer ? (
            <Field
              id="i-buyerNote"
              label="Message to the buyer (optional)"
              hint="Included in the email. Internal notes are never sent."
            >
              <Textarea
                id="i-buyerNote"
                rows={3}
                value={values.buyerNote}
                onChange={(e) => setValues({ ...values, buyerNote: e.target.value })}
              />
            </Field>
          ) : null}
        </div>
      ) : null}
      <Field id="i-source" label="Source">
        <select
          id="i-source"
          className={selectClass}
          value={values.source}
          onChange={(e) => setValues({ ...values, source: e.target.value })}
        >
          {Object.entries(INQUIRY_SOURCE_LABELS).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </Field>
      <Field id="i-assignee" label="Assigned to">
        <select
          id="i-assignee"
          className={selectClass}
          value={values.assignedToId}
          onChange={(e) => setValues({ ...values, assignedToId: e.target.value })}
        >
          <option value="">Unassigned</option>
          {staff.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name ?? s.email}
            </option>
          ))}
        </select>
      </Field>
      <Field id="i-notes" label="Internal notes" hint="Only visible to staff.">
        <Textarea
          id="i-notes"
          rows={6}
          value={values.adminNotes}
          onChange={(e) => setValues({ ...values, adminNotes: e.target.value })}
        />
      </Field>
      <Button type="submit" disabled={pending} className="w-full">
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
