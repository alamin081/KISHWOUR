import { type Settings } from "@/features/settings/schema";
import { cn } from "@/lib/utils";

const labels: Record<keyof Settings["social"], string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  linkedin: "LinkedIn",
  youtube: "YouTube",
};

/** Renders only the social profiles that are configured (admin → Content → Social links). */
export function SocialLinks({
  social,
  className,
}: {
  social: Settings["social"];
  className?: string;
}) {
  const entries = (Object.keys(labels) as (keyof typeof labels)[])
    .map((key) => ({ key, label: labels[key], href: social[key] }))
    .filter((e): e is { key: keyof typeof labels; label: string; href: string } =>
      Boolean(e.href),
    );

  if (entries.length === 0) return null;

  return (
    <ul
      className={cn("flex flex-wrap gap-2", className)}
      aria-label="Kishwour on social media"
    >
      {entries.map((e) => (
        <li key={e.key}>
          <a
            href={e.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-8 items-center rounded-full border border-charcoal/20 px-3 text-xs font-medium transition-colors hover:border-forest hover:text-forest"
          >
            {e.label}
          </a>
        </li>
      ))}
    </ul>
  );
}
