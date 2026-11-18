"use client";

import { History, Loader2, RotateCcw, X } from "lucide-react";
import { useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { type PageVersion } from "@/features/pages/history";
import { cn } from "@/lib/utils";

function formatMoment(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Unknown date";
  return date.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function changeSummary(version: PageVersion, labels: Map<string, string>): string {
  const named = version.changedSections
    .map((id) => labels.get(id))
    .filter((label): label is string => Boolean(label));
  if (named.length === 0) {
    return version.changedSections.length === 0 ? "First published version" : "Content";
  }
  return named.join(", ");
}

/**
 * The publish history of one page: every Publish is snapshotted and the newest ten are
 * kept. Restoring copies a version into the draft - it never goes live without a Publish.
 */
export function HistoryPanel({
  versions,
  sectionLabels,
  liveVersionId,
  restoringId,
  busy,
  onClose,
  onRestore,
}: {
  versions: readonly PageVersion[];
  /** Section ID → label, so the summary reads in the admin's words. */
  sectionLabels: Map<string, string>;
  /** The version whose document matches what is published right now. */
  liveVersionId: string | null;
  restoringId: string | null;
  busy: boolean;
  onClose: () => void;
  onRestore: (version: PageVersion) => void;
}) {
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    heading.current?.focus();
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <>
      <button
        type="button"
        aria-label="Close the version history"
        onClick={onClose}
        className="fixed inset-0 z-40 cursor-default bg-charcoal/30 lg:hidden"
      />
      <aside
        aria-label="Publish history"
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col border-l bg-background shadow-xl",
          "lg:static lg:z-auto lg:w-[22rem] lg:max-w-none lg:shadow-none",
        )}
      >
        <div className="flex items-start justify-between gap-3 border-b p-4">
          <div>
            <h2
              ref={heading}
              tabIndex={-1}
              className="flex items-center gap-2 font-sans text-base font-semibold outline-none"
            >
              <History className="size-4" aria-hidden /> Publish history
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              The last {versions.length === 1 ? "version" : `${versions.length} versions`}{" "}
              published. Restoring loads a version into the draft.
            </p>
          </div>
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            aria-label="Close the version history"
            onClick={onClose}
          >
            <X aria-hidden />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {versions.length === 0 ? (
            <p className="rounded-lg border border-dashed bg-secondary/40 px-4 py-6 text-center text-sm text-muted-foreground">
              Nothing published yet. Every time you publish, a version is saved here.
            </p>
          ) : (
            <ol className="space-y-3">
              {versions.map((version) => {
                const live = version.id === liveVersionId;
                return (
                  <li
                    key={version.id}
                    className={cn(
                      "rounded-lg border p-3",
                      live ? "border-forest bg-forest/5" : "bg-background",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium">
                        {formatMoment(version.publishedAt)}
                      </p>
                      {live ? (
                        <span className="rounded-full bg-forest px-2 py-0.5 text-[0.65rem] font-semibold tracking-wide text-primary-foreground uppercase">
                          Live now
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      by {version.publishedBy.name || "unknown"}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">Changed: </span>
                      {changeSummary(version, sectionLabels)}
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="mt-3"
                      disabled={busy}
                      onClick={() => onRestore(version)}
                    >
                      {restoringId === version.id ? (
                        <Loader2 className="animate-spin" aria-hidden />
                      ) : (
                        <RotateCcw aria-hidden />
                      )}
                      Restore to draft
                    </Button>
                  </li>
                );
              })}
            </ol>
          )}
        </div>

        <p className="border-t p-4 text-xs text-muted-foreground">
          Restoring replaces your draft. The live homepage only changes when you press{" "}
          <strong>Publish</strong>.
        </p>
      </aside>
    </>
  );
}
