import { cn } from "@/lib/utils";
import Link from "next/link";

export function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
  className,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mx-auto flex max-w-lg flex-col items-center rounded-2xl border border-white/5 bg-white/[0.02] px-8 py-16 text-center",
        className,
      )}
    >
      <div className="mb-3 font-serif text-4xl italic text-amber-soft">—</div>
      <h3 className="font-serif text-2xl italic text-white">{title}</h3>
      <p className="mt-2 text-sm text-ink-300">{description}</p>
      {actionLabel && actionHref ? (
        <Link
          href={actionHref}
          className="mt-6 inline-flex items-center rounded-full bg-amber px-5 py-2 text-sm font-medium text-ink-950 transition-colors hover:bg-amber-soft"
        >
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
