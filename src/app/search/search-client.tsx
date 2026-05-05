"use client";

import { useEffect, useRef, useState } from "react";
import { TitleCard } from "@/components/title-card";
import { CardGrid } from "@/components/card-row";
import { Search as SearchIcon, Loader2 } from "lucide-react";

interface Result {
  tmdbId: number;
  mediaType: "movie" | "tv";
  title: string;
  year: number | null;
  posterPath: string | null;
  overview: string;
}

export function SearchClient() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    let cancelled = false;
    const t = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`);
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) throw new Error(data.error || "Search failed");
        setResults(data.results);
      } catch (err) {
        if (!cancelled) setError((err as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 280);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [q]);

  return (
    <div>
      <div className="mb-10">
        <h1 className="font-serif text-5xl italic text-white">Search</h1>
        <p className="mt-2 text-ink-300">
          Powered by TMDB. Movies and shows only.
        </p>
      </div>

      <div className="relative mb-10">
        <SearchIcon className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-400" />
        <input
          ref={inputRef}
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="The Departed, Mad Men, Parasite…"
          className="w-full rounded-full border border-white/10 bg-white/[0.03] py-4 pl-14 pr-5 text-lg text-white placeholder:text-ink-400 focus:border-amber/60 focus:outline-none"
        />
        {loading ? (
          <Loader2 className="absolute right-5 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin text-ink-400" />
        ) : null}
      </div>

      {error ? (
        <div className="rounded-xl border border-crimson/30 bg-crimson/10 p-4 text-sm text-crimson">
          {error}
        </div>
      ) : null}

      {!q.trim() ? (
        <p className="text-sm text-ink-400">
          Type anything to begin. Press{" "}
          <kbd className="rounded bg-white/10 px-1.5 py-0.5 text-xs">/</kbd>{" "}
          from anywhere to jump here.
        </p>
      ) : null}

      {results.length ? (
        <CardGrid>
          {results.map((r, i) => (
            <TitleCard
              key={`${r.mediaType}-${r.tmdbId}`}
              tmdbId={r.tmdbId}
              mediaType={r.mediaType}
              title={r.title}
              year={r.year}
              posterPath={r.posterPath}
              style={{ animationDelay: `${i * 15}ms` }}
            />
          ))}
        </CardGrid>
      ) : null}

      {q.trim() && !loading && !results.length && !error ? (
        <p className="text-sm text-ink-400">No matches.</p>
      ) : null}
    </div>
  );
}
