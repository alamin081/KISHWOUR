"use client";

import {
  CircleCheck,
  CircleDot,
  History,
  Loader2,
  Monitor,
  Save,
  Search,
  Smartphone,
  Trash2,
  Upload,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import { Field } from "@/components/admin/form-fields";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SEO_DESCRIPTION_MAX, SEO_TITLE_MAX } from "@/features/pages/blocks";
import {
  discardPageDraft,
  publishPage,
  restorePageVersion,
  savePageDraft,
} from "@/features/pages/actions";
import { addHistoryVersion, type PageVersion } from "@/features/pages/history";
import { type EditablePageId, EDITABLE_PAGES } from "@/features/pages/ids";
import { type PageEditorData } from "@/features/pages/queries";
import { cn } from "@/lib/utils";

import { type EditorAdapter, type PreviewBundle } from "./adapters";
import { HistoryPanel } from "./history-panel";
import { PreviewFrame } from "./preview-frame";
import { SectionFrame } from "./section-frame";
import { SectionPanel } from "./section-panel";

type Device = "desktop" | "mobile";
const DEVICE_WIDTH: Record<Device, string> = { desktop: "100%", mobile: "390px" };

function formatMeta(
  meta: { updatedAt: string; updatedBy: string | null } | null,
): string {
  if (!meta) return "never";
  const when = new Date(meta.updatedAt).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  return meta.updatedBy ? `${when} by ${meta.updatedBy}` : when;
}

export type EditorShellProps<T> = {
  pageId: EditablePageId;
  adapter: EditorAdapter<T>;
  initial: PageEditorData;
  preview: PreviewBundle;
  cloudinaryConfigured: boolean;
};

/**
 * The visual page editor: the real page on the left, an edit panel on the right, and a
 * Draft → Publish workflow with history in the toolbar. One shell for every page; what
 * differs per page comes from its adapter.
 */
export function EditorShell<T>({
  pageId,
  adapter,
  initial,
  preview,
  cloudinaryConfigured,
}: EditorShellProps<T>) {
  const parsedDraft = adapter.parse(initial.draft);
  const parsedPublished = adapter.parse(initial.published);

  const [draft, setDraft] = useState<T | null>(parsedDraft);
  const draftRef = useRef<T | null>(parsedDraft);
  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  const [savedDraft, setSavedDraft] = useState<T | null>(parsedDraft);
  const [published, setPublished] = useState<T | null>(parsedPublished);
  const [hasDraft, setHasDraft] = useState(initial.hasDraft);
  const [draftMeta, setDraftMeta] = useState(initial.draftMeta);
  const [publishedMeta, setPublishedMeta] = useState(initial.publishedMeta);
  const [history, setHistory] = useState<PageVersion[]>(initial.history);

  const [editing, setEditing] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [seoOpen, setSeoOpen] = useState(false);
  const [device, setDevice] = useState<Device>("desktop");
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const [confirm, setConfirm] = useState<"publish" | "discard" | null>(null);
  const [restoreTarget, setRestoreTarget] = useState<PageVersion | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const imagePicker = useRef<(() => void) | null>(null);
  const pendingPicker = useRef(false);
  const imageEditor = useRef<(() => void) | null>(null);
  const pendingImageEditor = useRef(false);

  const meta = EDITABLE_PAGES[pageId];
  const unsaved =
    draft !== null && savedDraft !== null && !adapter.same(draft, savedDraft);
  const differsFromLive =
    savedDraft !== null && published !== null && !adapter.same(savedDraft, published);
  const sections = useMemo(
    () => (draft ? adapter.sections(draft) : []),
    [adapter, draft],
  );
  const labels = useMemo(
    () => (draft ? adapter.labels(draft) : new Map()),
    [adapter, draft],
  );
  const changed = useMemo(
    () => (draft && published ? adapter.changedSections(published, draft) : []),
    [adapter, draft, published],
  );
  const liveVersionId = useMemo(() => {
    if (!published) return null;
    return (
      history.find((version) => {
        const document = adapter.parse(version.document);
        return document !== null && adapter.same(document, published);
      })?.id ?? null
    );
  }, [adapter, history, published]);

  const openSection = (id: string) => {
    setHistoryOpen(false);
    setSeoOpen(false);
    setEditing(id);
  };

  /* --- guard against losing unsaved work ------------------------------- */

  useEffect(() => {
    if (!unsaved) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [unsaved]);

  useEffect(() => {
    if (!unsaved) return;
    // Client-side navigation (admin sidebar, links) does not fire `beforeunload`.
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey)
        return;
      const anchor = (event.target as Element | null)?.closest?.("a[href]");
      if (!(anchor instanceof HTMLAnchorElement) || anchor.target === "_blank") return;
      if (anchor.ownerDocument !== document) return; // Links inside the preview frame.
      if (anchor.href === window.location.href) return;
      if (
        !window.confirm(
          "You have unsaved changes to this page's draft. Leave and discard them?",
        )
      ) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [unsaved]);

  /* --- draft mutations -------------------------------------------------- */

  const update = useCallback((updater: T | ((prev: T) => T)) => {
    setDraft((prev) => {
      const next =
        typeof updater === "function"
          ? prev
            ? (updater as (p: T) => T)(prev)
            : prev
          : updater;
      draftRef.current = next;
      return next;
    });
  }, []);

  const toggleVisible = (id: string, visible: boolean) =>
    setDraft((prev) => {
      const next = prev ? adapter.setVisible(prev, id, visible) : prev;
      draftRef.current = next;
      return next;
    });

  const move = (id: string, direction: -1 | 1) =>
    setDraft((prev) => {
      const next = prev ? adapter.move(prev, id, direction) : prev;
      draftRef.current = next;
      return next;
    });

  const changeImage = useCallback(
    (id: string, image: Parameters<EditorAdapter<T>["setImage"]>[2]) =>
      setDraft((prev) => {
        const next = prev ? adapter.setImage(prev, id, image) : prev;
        draftRef.current = next;
        return next;
      }),
    [adapter],
  );

  const openPicker = (id: string) => {
    if (editing === id && imagePicker.current) {
      imagePicker.current();
      return;
    }
    pendingPicker.current = true;
    openSection(id);
  };

  const openImageEditor = (id: string) => {
    if (editing === id && imageEditor.current) {
      imageEditor.current();
      return;
    }
    pendingImageEditor.current = true;
    openSection(id);
  };

  useEffect(() => {
    if (!editing) return;
    if (pendingPicker.current) {
      pendingPicker.current = false;
      imagePicker.current?.();
    }
    if (pendingImageEditor.current) {
      pendingImageEditor.current = false;
      imageEditor.current?.();
    }
  }, [editing]);

  /* --- server actions --------------------------------------------------- */

  const applyFieldErrors = (fieldErrors: Record<string, string> | undefined) => {
    setServerErrors(fieldErrors ?? {});
    const first = Object.keys(fieldErrors ?? {})[0];
    if (!first || !draft) return;
    const [head, index] = first.split(".");
    const target =
      head === "blocks" && index !== undefined
        ? sections[Number(index)]?.id
        : sections.find((section) => section.id === head)?.id;
    if (target) openSection(target);
    else if (head === "seo") setSeoOpen(true);
  };

  const save = () =>
    new Promise<boolean>((resolve) => {
      startTransition(async () => {
        const current = draftRef.current;
        if (!current) return resolve(false);
        const result = await savePageDraft(pageId, current);
        if (!result.ok) {
          applyFieldErrors(result.fieldErrors);
          toast.error(result.message);
          resolve(false);
          return;
        }
        setServerErrors({});
        setSavedDraft(current);
        setHasDraft(true);
        if (result.data)
          setDraftMeta({ updatedAt: result.data.updatedAt, updatedBy: null });
        toast.success(result.message ?? "Draft saved.");
        resolve(true);
      });
    });

  /**
   * Immediately updates the section image in state AND persists the draft to the database,
   * so an uploaded, edited or removed photo is never lost if the admin refreshes or
   * navigates before clicking "Save draft".
   */
  const commitImage = (
    id: string,
    image: Parameters<EditorAdapter<T>["setImage"]>[2],
  ) => {
    const base = draftRef.current;
    if (!base) return;
    const nextDraft = adapter.setImage(base, id, image);
    draftRef.current = nextDraft;
    setDraft(nextDraft);

    startTransition(async () => {
      const result = await savePageDraft(pageId, nextDraft);
      if (!result.ok) {
        applyFieldErrors(result.fieldErrors);
        toast.error(result.message);
        return;
      }
      setServerErrors({});
      setSavedDraft(nextDraft);
      setHasDraft(true);
      if (result.data)
        setDraftMeta({ updatedAt: result.data.updatedAt, updatedBy: null });
      toast.success(
        image
          ? "Image saved to the draft. Click Publish to make it live on the website."
          : "Image removed from the draft. Click Publish to update the live website.",
      );
    });
  };

  const publish = () => {
    startTransition(async () => {
      const current = draftRef.current;
      if (!current) return;
      const result = await publishPage(pageId, current);
      if (!result.ok) {
        applyFieldErrors(result.fieldErrors);
        toast.error(result.message);
        return;
      }
      setServerErrors({});
      // Update published state and sync savedDraft so the editor reflects the live content.
      setPublished(current);
      setSavedDraft(current);
      setHasDraft(true);
      const data = result.data;
      if (data) {
        setDraftMeta({ updatedAt: data.updatedAt, updatedBy: null });
        setPublishedMeta({ updatedAt: data.updatedAt, updatedBy: null });
        setHistory((prev) => addHistoryVersion(prev, data.version).history);
      }
      toast.success(result.message ?? "Published.");
    });
  };

  const discard = () => {
    startTransition(async () => {
      const result = await discardPageDraft(pageId);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      setDraft(published);
      setSavedDraft(published);
      setHasDraft(false);
      setDraftMeta(null);
      setServerErrors({});
      setEditing(null);
      toast.success(result.message ?? "Draft discarded.");
    });
  };

  const restore = (version: PageVersion) => {
    setRestoreTarget(null);
    setRestoringId(version.id);
    startTransition(async () => {
      const result = await restorePageVersion(pageId, version.id);
      setRestoringId(null);
      if (!result.ok || !result.data) {
        toast.error(result.message);
        return;
      }
      const document = adapter.parse(result.data.document);
      if (!document) {
        toast.error("That version could not be loaded into the editor.");
        return;
      }
      setDraft(document);
      setSavedDraft(document);
      setHasDraft(true);
      setDraftMeta({ updatedAt: new Date().toISOString(), updatedBy: null });
      setServerErrors({});
      setEditing(null);
      setHistoryOpen(false);
      toast.success(result.message ?? "Version restored into the draft.");
    });
  };

  const askRestore = (version: PageVersion) => {
    if (unsaved || hasDraft) setRestoreTarget(version);
    else restore(version);
  };

  /* --- render ----------------------------------------------------------- */

  if (!draft || !published) {
    return (
      <p className="rounded-xl border border-destructive/40 bg-destructive/5 p-6 text-sm">
        This page&rsquo;s stored content could not be read. Reload the page; if it keeps
        happening, publish again from a version in the history.
      </p>
    );
  }

  const status = unsaved
    ? { label: "Unsaved changes", tone: "warn" as const }
    : differsFromLive
      ? { label: "Draft differs from live", tone: "info" as const }
      : { label: "Draft matches the live page", tone: "ok" as const };

  const activeSection = editing
    ? (sections.find((section) => section.id === editing) ?? null)
    : null;
  const seo = adapter.seo?.get(draft) ?? null;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-3">
        <div
          role="group"
          aria-label="Preview width"
          className="flex rounded-md border p-0.5"
        >
          {(["desktop", "mobile"] as const).map((value) => {
            const Icon = value === "desktop" ? Monitor : Smartphone;
            return (
              <button
                key={value}
                type="button"
                aria-pressed={device === value}
                onClick={() => setDevice(value)}
                className={cn(
                  "flex cursor-pointer items-center gap-1.5 rounded px-3 py-1.5 text-sm font-medium transition-colors",
                  device === value
                    ? "bg-forest text-primary-foreground"
                    : "hover:bg-secondary",
                )}
              >
                <Icon className="size-4" aria-hidden />
                {value === "desktop" ? "Desktop" : "Mobile"}
              </button>
            );
          })}
        </div>

        <p
          aria-live="polite"
          className={cn(
            "flex items-center gap-2 text-sm font-medium",
            status.tone === "warn" && "text-jute-deep",
            status.tone === "info" && "text-forest",
            status.tone === "ok" && "text-muted-foreground",
          )}
        >
          {status.tone === "ok" ? (
            <CircleCheck className="size-4" aria-hidden />
          ) : (
            <CircleDot className="size-4" aria-hidden />
          )}
          {status.label}
        </p>

        <div className="flex flex-wrap items-center gap-2">
          {adapter.seo ? (
            <Button
              type="button"
              variant="outline"
              aria-expanded={seoOpen}
              onClick={() => {
                setEditing(null);
                setHistoryOpen(false);
                setSeoOpen((open) => !open);
              }}
            >
              <Search aria-hidden /> SEO
            </Button>
          ) : null}
          <Button
            type="button"
            variant="outline"
            aria-expanded={historyOpen}
            onClick={() => {
              setEditing(null);
              setSeoOpen(false);
              setHistoryOpen((open) => !open);
            }}
          >
            <History aria-hidden /> History
            {history.length > 0 ? (
              <span className="rounded-full bg-secondary px-1.5 text-xs tabular-nums">
                {history.length}
              </span>
            ) : null}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={pending || !unsaved}
            onClick={() => void save()}
          >
            {pending ? (
              <Loader2 className="animate-spin" aria-hidden />
            ) : (
              <Save aria-hidden />
            )}
            Save draft
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="text-destructive"
            disabled={pending || (!hasDraft && !unsaved)}
            onClick={() => setConfirm("discard")}
          >
            <Trash2 aria-hidden /> Discard draft
          </Button>
          <Button
            type="button"
            disabled={pending || (!unsaved && !differsFromLive)}
            onClick={() => setConfirm("publish")}
          >
            <Upload aria-hidden /> Publish
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Draft saved: {formatMeta(draftMeta)} · Published: {formatMeta(publishedMeta)}
        {initial.hasPublished ? "" : " (the website currently shows the default content)"}
      </p>

      <div className="flex min-h-0 flex-1 gap-4">
        <div className="min-w-0 flex-1 overflow-hidden rounded-xl border bg-secondary/30">
          <div
            className="flex h-[70vh] min-h-[32rem] justify-center overflow-hidden p-0 lg:h-[calc(100vh-18rem)]"
            // Links in the preview must not navigate away from the editor.
            onClickCapture={(event) => {
              if ((event.target as Element | null)?.closest?.("a[href]"))
                event.preventDefault();
            }}
          >
            <PreviewFrame
              title={`${meta.label} preview`}
              width={DEVICE_WIDTH[device]}
              className={cn(
                "h-full border-0 bg-background transition-[width] duration-200",
                device === "mobile" && "rounded-lg shadow-lg ring-1 ring-charcoal/10",
              )}
            >
              {sections.map((section, index) => (
                <SectionFrame
                  key={section.id}
                  meta={section}
                  visible={section.visible}
                  active={editing === section.id}
                  isFirst={index === 0}
                  isLast={index === sections.length - 1}
                  canUpload={cloudinaryConfigured}
                  onEdit={() => openSection(section.id)}
                  onReplaceImage={() => openPicker(section.id)}
                  onEditImage={() => openImageEditor(section.id)}
                  onDeleteImage={() => commitImage(section.id, null)}
                  onToggleVisible={() => toggleVisible(section.id, !section.visible)}
                  onMove={(direction) => move(section.id, direction)}
                >
                  {adapter.renderSection(draft, section.id, preview)}
                </SectionFrame>
              ))}
            </PreviewFrame>
          </div>
        </div>

        {historyOpen ? (
          <HistoryPanel
            versions={history}
            sectionLabels={labels}
            liveVersionId={liveVersionId}
            restoringId={restoringId}
            busy={pending}
            onClose={() => setHistoryOpen(false)}
            onRestore={askRestore}
          />
        ) : seoOpen && seo && adapter.seo ? (
          <SeoPanel
            seo={seo}
            errors={serverErrors}
            onChange={(next) => {
              const setter = adapter.seo;
              if (setter) update(setter.set(draft, next));
            }}
            onClose={() => setSeoOpen(false)}
          />
        ) : activeSection ? (
          <SectionPanel
            meta={activeSection}
            image={adapter.image(draft, activeSection.id)}
            imageLabel={adapter.imageLabel(draft, activeSection.id)}
            imageError={adapter.imageError(draft, activeSection.id, serverErrors)}
            imagePortrait={adapter.imagePortrait(draft, activeSection.id)}
            imageAspects={adapter.imageAspects(draft, activeSection.id)}
            activeDevice={device}
            cloudinaryConfigured={cloudinaryConfigured}
            imagePickerRef={imagePicker}
            imageEditorRef={imageEditor}
            onChangeImage={(image) => changeImage(activeSection.id, image)}
            onCommitImage={(image) => commitImage(activeSection.id, image)}
            onClose={() => setEditing(null)}
          >
            {adapter.renderForm({
              content: draft,
              id: activeSection.id,
              serverErrors,
              cloudinaryConfigured,
              onChange: update,
            })}
          </SectionPanel>
        ) : null}
      </div>

      <AlertDialog
        open={confirm === "publish"}
        onOpenChange={(open) => setConfirm(open ? "publish" : null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Publish {meta.label}?</AlertDialogTitle>
            <AlertDialogDescription>
              {changed.length === 0
                ? "The draft matches the live page, so nothing visible will change."
                : `This replaces the live page immediately. Changed: ${changed
                    .map((id) => labels.get(id) ?? id)
                    .join(", ")}.`}
              {unsaved ? " Your unsaved changes are saved first." : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={publish}>Publish now</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={restoreTarget !== null}
        onOpenChange={(open) => {
          if (!open) setRestoreTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Replace the draft with this version?</AlertDialogTitle>
            <AlertDialogDescription>
              Your current draft will be overwritten by the version published on{" "}
              {restoreTarget
                ? new Date(restoreTarget.publishedAt).toLocaleString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : ""}
              . The live page does not change until you publish.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep my draft</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (restoreTarget) restore(restoreTarget);
              }}
            >
              Restore to draft
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={confirm === "discard"}
        onOpenChange={(open) => setConfirm(open ? "discard" : null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard the draft?</AlertDialogTitle>
            <AlertDialogDescription>
              The editor goes back to the content that is live now. Images that were only
              used in this draft, and that no other page uses, are deleted from
              Cloudinary. The live page is not affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction onClick={discard}>Discard draft</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/** Page-level search engine listing. */
function SeoPanel({
  seo,
  errors,
  onChange,
  onClose,
}: {
  seo: { title: string; description: string };
  errors: Record<string, string>;
  onChange: (seo: { title: string; description: string }) => void;
  onClose: () => void;
}) {
  return (
    <aside
      aria-label="Search engine listing"
      className={cn(
        "fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col border-l bg-background shadow-xl",
        "lg:static lg:z-auto lg:w-[22rem] lg:max-w-none lg:shadow-none",
      )}
    >
      <div className="flex items-start justify-between gap-3 border-b p-4">
        <div>
          <h2 className="font-sans text-base font-semibold">Search engine listing</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            How this page appears in search results and when it is shared.
          </p>
        </div>
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          aria-label="Close the search engine panel"
          onClick={onClose}
        >
          ×
        </Button>
      </div>
      <div className="flex-1 space-y-5 overflow-y-auto p-4">
        <Field
          id="seo-title"
          label="Meta title"
          error={errors["seo.title"]}
          hint={`${seo.title.length}/${SEO_TITLE_MAX} characters. Empty uses the page heading.`}
        >
          <Input
            id="seo-title"
            value={seo.title}
            maxLength={SEO_TITLE_MAX}
            onChange={(event) => onChange({ ...seo, title: event.target.value })}
          />
        </Field>
        <Field
          id="seo-description"
          label="Meta description"
          error={errors["seo.description"]}
          hint={`${seo.description.length}/${SEO_DESCRIPTION_MAX} characters.`}
        >
          <Textarea
            id="seo-description"
            rows={4}
            value={seo.description}
            maxLength={SEO_DESCRIPTION_MAX}
            onChange={(event) => onChange({ ...seo, description: event.target.value })}
          />
        </Field>
      </div>
    </aside>
  );
}
