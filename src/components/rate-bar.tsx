"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { BUCKETS, type Bucket, BUCKET_LABELS, cn } from "@/lib/utils";
import { Heart, ThumbsUp, Minus, XCircle, Bookmark, Check } from "lucide-react";

const BUCKET_ICONS: Record<Bucket, typeof Heart> = {
  loved: Heart,
  liked: ThumbsUp,
  meh: Minus,
  dnf: XCircle,
};

export function RateBar({
  entryId,
  titleId,
  mediaType,
  tmdbId,
  currentBucket,
  currentStatus,
}: {
  entryId?: number | null;
  titleId?: number | null;
  mediaType: "movie" | "tv";
  tmdbId: number;
  currentBucket?: Bucket | null;
  currentStatus?: "watchlist" | "watched" | "didnt_finish" | null;
}) {
  const router = useRouter();
  const [isPending, start] = useTransition();
  const [bucket, setBucket] = useState<Bucket | null>(currentBucket ?? null);
  const [status, setStatus] = useState<
    "watchlist" | "watched" | "didnt_finish" | null
  >(currentStatus ?? null);

  async function call(body: Record<string, unknown>) {
    const res = await fetch("/api/entries", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...body, mediaType, tmdbId, entryId, titleId }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  function setBucketAction(next: Bucket) {
    const newBucket = bucket === next ? null : next;
    setBucket(newBucket);
    if (newBucket) {
      setStatus(newBucket === "dnf" ? "didnt_finish" : "watched");
    }
    start(async () => {
      await call({ bucket: newBucket });
      router.refresh();
    });
  }

  function toggleWatchlist() {
    const onList = status === "watchlist";
    const newStatus = onList ? null : "watchlist";
    setStatus(newStatus);
    if (!onList) setBucket(null);
    start(async () => {
      await call({ status: newStatus, bucket: null });
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={toggleWatchlist}
        disabled={isPending}
        className={cn(
          "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
          status === "watchlist"
            ? "border-amber bg-amber text-ink-950"
            : "border-white/15 text-white hover:bg-white/10",
        )}
      >
        {status === "watchlist" ? (
          <Check className="h-4 w-4" />
        ) : (
          <Bookmark className="h-4 w-4" />
        )}
        {status === "watchlist" ? "On Watchlist" : "Add to Watchlist"}
      </button>

      <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] p-1">
        {BUCKETS.map((b) => {
          const Icon = BUCKET_ICONS[b];
          const active = bucket === b;
          return (
            <button
              key={b}
              onClick={() => setBucketAction(b)}
              disabled={isPending}
              title={BUCKET_LABELS[b]}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium uppercase tracking-wider transition-colors",
                active
                  ? b === "loved"
                    ? "bg-amber text-ink-950"
                    : b === "liked"
                      ? "bg-sage/90 text-ink-950"
                      : b === "meh"
                        ? "bg-white/15 text-white"
                        : "bg-crimson/80 text-white"
                  : "text-ink-300 hover:text-white hover:bg-white/5",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{BUCKET_LABELS[b]}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
