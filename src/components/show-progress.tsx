"use client";

import { useEffect, useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import { Minus, Plus, Check } from "lucide-react";

interface Season {
  season_number: number;
  name: string;
  episode_count: number;
  poster_path?: string | null;
}

interface ProgressRow {
  season: number;
  episodesWatched: number;
  totalEpisodes: number | null;
}

export function ShowProgress({
  entryId,
  seasons,
}: {
  entryId: number;
  seasons: Season[];
}) {
  const [progress, setProgress] = useState<ProgressRow[]>([]);
  const [, start] = useTransition();

  useEffect(() => {
    fetch(`/api/show-progress?entryId=${entryId}`)
      .then((r) => r.json())
      .then((d) => setProgress(d.progress || []))
      .catch(() => {});
  }, [entryId]);

  const valid = seasons.filter((s) => s.season_number > 0);

  function update(seasonNumber: number, next: number, total: number) {
    const clamped = Math.max(0, Math.min(next, total));
    setProgress((prev) => {
      const has = prev.find((p) => p.season === seasonNumber);
      if (has) {
        return prev.map((p) =>
          p.season === seasonNumber ? { ...p, episodesWatched: clamped } : p,
        );
      }
      return [
        ...prev,
        { season: seasonNumber, episodesWatched: clamped, totalEpisodes: total },
      ];
    });
    start(async () => {
      await fetch("/api/show-progress", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          entryId,
          season: seasonNumber,
          episodesWatched: clamped,
          totalEpisodes: total,
        }),
      });
    });
  }

  function get(seasonNumber: number): number {
    return (
      progress.find((p) => p.season === seasonNumber)?.episodesWatched ?? 0
    );
  }

  if (!valid.length) return null;

  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
      <div className="mb-3 text-[11px] uppercase tracking-[0.25em] text-ink-400">
        Season progress
      </div>
      <div className="grid gap-2">
        {valid.map((s) => {
          const total = s.episode_count;
          const watched = get(s.season_number);
          const pct = total ? (watched / total) * 100 : 0;
          const done = total > 0 && watched >= total;
          return (
            <div
              key={s.season_number}
              className="flex items-center gap-3 rounded-lg border border-white/5 bg-ink-900/40 p-3"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 text-sm text-white">
                  <span className="font-medium">{s.name}</span>
                  {done ? (
                    <span className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-sage">
                      <Check className="h-3 w-3" /> Done
                    </span>
                  ) : null}
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/5">
                  <div
                    className={cn(
                      "h-full transition-all",
                      done ? "bg-sage" : "bg-amber",
                    )}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => update(s.season_number, watched - 1, total)}
                  className="rounded-full border border-white/10 p-1 text-ink-200 hover:bg-white/10"
                  aria-label="Decrement"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <div className="min-w-[56px] text-center text-sm tabular-nums">
                  <span className="text-white">{watched}</span>
                  <span className="text-ink-400"> / {total}</span>
                </div>
                <button
                  onClick={() => update(s.season_number, watched + 1, total)}
                  className="rounded-full border border-white/10 p-1 text-ink-200 hover:bg-white/10"
                  aria-label="Increment"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
