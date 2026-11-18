export default function Loading() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-1 items-center justify-center py-24"
    >
      <span className="size-8 animate-spin rounded-full border-2 border-beige border-t-forest" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
