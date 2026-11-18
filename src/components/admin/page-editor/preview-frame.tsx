"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const BLANK_DOCUMENT =
  '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body></body></html>';

/** Copies the admin document's stylesheets into the preview document. */
function syncStyles(from: Document, to: Document): void {
  const wanted = [...from.querySelectorAll('style, link[rel="stylesheet"]')];
  const present = new Set(
    [...to.head.querySelectorAll("[data-preview-style]")].map(
      (node) => node.getAttribute("data-preview-style") ?? "",
    ),
  );
  wanted.forEach((node, index) => {
    const key = `${index}:${node.nodeName}:${node.getAttribute("href") ?? node.textContent?.length ?? ""}`;
    if (present.has(key)) {
      present.delete(key);
      return;
    }
    const clone = node.cloneNode(true) as HTMLElement;
    clone.setAttribute("data-preview-style", key);
    to.head.append(clone);
  });
  // Styles that disappeared from the admin document (hot reload) are dropped here too.
  for (const stale of present) {
    to.head.querySelector(`[data-preview-style="${CSS.escape(stale)}"]`)?.remove();
  }
}

/**
 * Renders the preview inside an iframe, so the storefront's responsive breakpoints are
 * evaluated against the *preview* width. That makes the Desktop / Mobile toggle show the
 * real mobile layout instead of a narrow desktop one.
 *
 * React keeps owning the tree through a portal, so the live preview still updates on every
 * keystroke. The iframe inherits the page origin, so `next/image` and the fonts work as on
 * the public site.
 */
export function PreviewFrame({
  width,
  className,
  title,
  children,
}: {
  /** CSS width of the frame, e.g. "100%" or "390px". */
  width: string;
  className?: string;
  title: string;
  children: React.ReactNode;
}) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [body, setBody] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const iframe = frame.current;
    if (!iframe) return;
    let observer: MutationObserver | undefined;

    const attach = () => {
      const doc = iframe.contentDocument;
      if (!doc?.body) return;
      syncStyles(document, doc);
      // The font variables live on <html>; the storefront expects them to be inherited.
      doc.documentElement.className = document.documentElement.className;
      doc.body.className = "bg-background";
      observer?.disconnect();
      observer = new MutationObserver(() => syncStyles(document, doc));
      observer.observe(document.head, { childList: true, subtree: true });
      setBody(doc.body);
    };

    iframe.addEventListener("load", attach);
    if (iframe.contentDocument?.readyState === "complete") attach();
    return () => {
      iframe.removeEventListener("load", attach);
      observer?.disconnect();
    };
  }, []);

  return (
    <>
      <iframe
        ref={frame}
        title={title}
        srcDoc={BLANK_DOCUMENT}
        style={{ width }}
        className={className}
      />
      {body ? createPortal(children, body) : null}
    </>
  );
}
