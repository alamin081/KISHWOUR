"use client";

import { type HomepageContent } from "@/features/homepage/schema";
import { type PageDocument } from "@/features/pages/blocks";
import { type EditablePageId } from "@/features/pages/ids";
import { type PageEditorData } from "@/features/pages/queries";

import { blockAdapter, homeAdapter, type PreviewBundle } from "./adapters";
import { EditorShell } from "./editor-shell";

/**
 * Picks the adapter for the page being edited. The homepage keeps its keyed-section
 * document; every other page uses the block document. Everything after this point is
 * the same shell.
 */
export function PageEditor(props: {
  pageId: EditablePageId;
  initial: PageEditorData;
  preview: PreviewBundle;
  cloudinaryConfigured: boolean;
}) {
  if (props.pageId === "home") {
    return <EditorShell<HomepageContent> {...props} adapter={homeAdapter} />;
  }
  return <EditorShell<PageDocument> {...props} adapter={blockAdapter(props.pageId)} />;
}
