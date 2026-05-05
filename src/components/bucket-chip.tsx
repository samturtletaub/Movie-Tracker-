import { cn } from "@/lib/utils";
import { Heart, ThumbsUp, Minus, XCircle } from "lucide-react";
import type { Bucket } from "@/lib/utils";

const CONFIG: Record<Bucket, { label: string; icon: typeof Heart; tone: string }> = {
  loved: { label: "Loved", icon: Heart, tone: "text-amber bg-amber/10 border-amber/30" },
  liked: { label: "Liked", icon: ThumbsUp, tone: "text-sage bg-sage/10 border-sage/30" },
  meh: { label: "Meh", icon: Minus, tone: "text-ink-300 bg-white/5 border-white/10" },
  dnf: { label: "DNF", icon: XCircle, tone: "text-crimson bg-crimson/10 border-crimson/30" },
};

export function BucketChip({
  bucket,
  size = "sm",
  className,
}: {
  bucket: Bucket;
  size?: "sm" | "md";
  className?: string;
}) {
  const c = CONFIG[bucket];
  const Icon = c.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border uppercase tracking-wider font-medium",
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs",
        c.tone,
        className,
      )}
    >
      <Icon className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />
      {c.label}
    </span>
  );
}
