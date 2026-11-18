/**
 * Single-series bar chart (one hue, no legend — the title names the series).
 * Thin bars with 4px rounded data-ends anchored to the baseline, recessive gridline,
 * per-bar hover tooltip, and an equivalent table for screen readers.
 */
export function ColumnChart({
  title,
  data,
  valueLabel,
}: {
  title: string;
  data: { label: string; value: number }[];
  valueLabel: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <figure>
      <figcaption className="sr-only">{title}</figcaption>
      <div className="relative h-48" aria-hidden>
        <div className="absolute inset-x-0 bottom-6 border-t border-border" />
        <div className="absolute inset-x-0 top-0 bottom-6 flex items-end gap-[2px] sm:gap-3">
          {data.map((d) => (
            <div
              key={d.label}
              className="group relative flex h-full flex-1 items-end justify-center"
            >
              <div
                className="w-full max-w-10 rounded-t-[4px] bg-forest transition-opacity group-hover:opacity-80"
                style={{
                  height: `${(d.value / max) * 100}%`,
                  minHeight: d.value > 0 ? 2 : 0,
                }}
              />
              <span className="pointer-events-none absolute -top-8 rounded bg-charcoal px-2 py-1 text-xs whitespace-nowrap text-warm-white opacity-0 transition-opacity group-hover:opacity-100">
                {d.label}: {d.value.toLocaleString("en-US")} {valueLabel}
              </span>
            </div>
          ))}
        </div>
        <div className="absolute inset-x-0 bottom-0 flex gap-[2px] sm:gap-3">
          {data.map((d) => (
            <span
              key={d.label}
              className="flex-1 text-center text-xs text-muted-foreground"
            >
              {d.label}
            </span>
          ))}
        </div>
      </div>
      <table className="sr-only">
        <caption>{title}</caption>
        <thead>
          <tr>
            <th scope="col">Period</th>
            <th scope="col">{valueLabel}</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.label}>
              <th scope="row">{d.label}</th>
              <td>{d.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

/** Horizontal bars for a categorical breakdown (single hue, values labelled in text ink). */
export function BarList({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <ul className="space-y-3">
      {data.map((d) => (
        <li key={d.label} title={`${d.label}: ${d.value}`}>
          <div className="mb-1 flex justify-between text-sm">
            <span>{d.label}</span>
            <span className="text-muted-foreground tabular-nums">
              {d.value.toLocaleString("en-US")}
            </span>
          </div>
          <div className="h-2 rounded-full bg-muted" aria-hidden>
            <div
              className="h-2 rounded-full bg-forest"
              style={{ width: `${(d.value / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
