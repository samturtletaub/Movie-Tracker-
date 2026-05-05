"use client";

import { useEffect, useState } from "react";
import { TitleCard } from "./title-card";
import { CardRow } from "./card-row";
import { RefreshCw, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface Rec {
  tmdbId: number;
  mediaType: "movie" | "tv";
  title: string;
  year?: number | null;
  posterPath?: string | null;
  reason?: string | null;
}

export function RecommendationsCarousel() {
  const [recs, setRecs] = useState<Rec[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load(refresh = false) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/recommend${refresh ? "?refresh=1" : ""}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load recommendations");
      setRecs(data.recs || []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(false);
  }, []);

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <button
          onClick={() => load(true)}
          disabled={loading}
          className={cn(
            "inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-xs uppercase tracking-widest text-ink-200 transition-colors hover:bg-white/10",
            loading && "opacity-60",
          )}
        >
          <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          Regenerate
        </button>
      </div>

      {error ? (
        <div className="rounded-xl border border-crimson/30 bg-crimson/10 p-4 text-sm text-crimson">
          {error}
        </div>
      ) : null}

      {!recs && !error ? <RecSkeleton /> : null}

      {recs && !recs.length ? (
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-8 text-center">
          <Sparkles className="mx-auto mb-2 h-5 w-5 text-amber" />
          <p className="text-sm text-ink-300">
            Rate a few things as Loved to start getting recommendations.
          </p>
        </div>
      ) : null}

      {recs && recs.length ? (
        <CardRow>
          {recs.map((r, i) => (
            <div key={`${r.mediaType}-${r.tmdbId}`} className="w-48 md:w-56 shrink-0 snap-start">
              <TitleCard
                tmdbId={r.tmdbId}
                mediaType={r.mediaType}
                title={r.title}
                year={r.year}
                posterPath={r.posterPath}
                reason={r.reason}
                badge="Pick"
                style={{ animationDelay: `${i * 40}ms` }}
              />
            </div>
          ))}
        </CardRow>
      ) : null}
    </div>
  );
}

function RecSkeleton() {
  return (
    <div className="-mx-6 flex gap-5 overflow-x-hidden px-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="w-48 md:w-56 shrink-0">
          <div className="aspect-[2/3] w-full animate-pulse rounded-xl bg-white/[0.04]" />
          <div className="mt-3 h-4 w-3/4 animate-pulse rounded bg-white/[0.04]" />
          <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-white/[0.03]" />
        </div>
      ))}
    </div>
  );
}
