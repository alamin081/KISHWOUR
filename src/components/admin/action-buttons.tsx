"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { type ComponentProps, type ReactNode, useTransition } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { type ActionResult } from "@/features/admin/action-result";

type Run = () => Promise<ActionResult<unknown>>;

function useRun(run: Run, redirectTo?: string) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const trigger = () =>
    start(async () => {
      const res = await run();
      if (res.ok) {
        toast.success(res.message ?? "Done.");
        if (redirectTo) router.push(redirectTo);
        else router.refresh();
      } else toast.error(res.message);
    });
  return { pending, trigger };
}

/** Runs a server action and reports the result with a toast. */
export function ActionButton({
  run,
  children,
  redirectTo,
  ...props
}: { run: Run; children: ReactNode; redirectTo?: string } & Omit<
  ComponentProps<typeof Button>,
  "onClick"
>) {
  const { pending, trigger } = useRun(run, redirectTo);
  return (
    <Button {...props} disabled={pending || props.disabled} onClick={trigger}>
      {pending ? <Loader2 className="animate-spin" aria-hidden /> : null}
      {children}
    </Button>
  );
}

/** Same as ActionButton but asks for confirmation first (destructive actions). */
export function ConfirmButton({
  run,
  children,
  title,
  description,
  confirmLabel = "Confirm",
  redirectTo,
  ...props
}: {
  run: Run;
  children: ReactNode;
  title: string;
  description: string;
  confirmLabel?: string;
  redirectTo?: string;
} & Omit<ComponentProps<typeof Button>, "onClick">) {
  const { pending, trigger } = useRun(run, redirectTo);
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button {...props} disabled={pending || props.disabled}>
          {pending ? <Loader2 className="animate-spin" aria-hidden /> : null}
          {children}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={trigger}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
