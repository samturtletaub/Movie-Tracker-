import Link from "next/link";
import { listByStatus, listAllEntries, listLoved } from "@/lib/queries";
import { TitleCard } from "@/components/title-card";
import { SectionHeader } from "@/components/section-header";
import { CardRow } from "@/components/card-row";
import { EmptyState } from "@/components/empty-state";
import { BackdropHero } from "@/components/backdrop-hero";
import { RecommendationsCarousel } from "@/components/recommendations";
import { Sparkles } from "lucide-react";
import type { Bucket } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [watchlist, loved, all] = await Promise.all([
    listByStatus("watchlist"),
    listLoved(),
    listAllEntries(),
  ]);

  const featured = loved[Math.floor(Math.random() * Math.max(loved.length, 1))] ?? null;
  const recent = all.slice(0, 12);

  if (!all.length) {
    return (
      <div className="px-6 py-20">
        <EmptyState
          title="Your library is empty"
          description="Run the seed script to import movielist.md, or search TMDB to add your first title."
          actionLabel="Search titles"
          actionHref="/search"
        />
      </div>
    );
  }

  return (
    <div>
      {featured ? (
        <BackdropHero
          backdropPath={featured.title.backdropPath}
          title={featured.title.title}
          year={featured.title.year}
          tagline={
            featured.notes
              ? `"${featured.notes}"`
              : featured.title.overview ?? undefined
          }
        >
          <div className="flex items-center gap-3">
            <Link
              href={`/title/${featured.title.mediaType}/${featured.title.tmdbId}`}
              className="inline-flex items-center rounded-full bg-amber px-5 py-2 text-sm font-medium text-ink-950 hover:bg-amber-soft transition-colors"
            >
              Open title
            </Link>
            <span className="text-[11px] uppercase tracking-[0.25em] text-amber-soft/70">
              From your Loved shelf
            </span>
          </div>
        </BackdropHero>
      ) : null}

      <div className="mx-auto max-w-7xl px-6 py-12 space-y-14">
        <section>
          <SectionHeader
            title="For You"
            subtitle="Hybrid picks — TMDB-similar, ranked by your taste"
            action={
              <form action="/" className="hidden">
                <button type="submit">Regenerate</button>
              </form>
            }
          />
          <RecommendationsCarousel />
        </section>

        {watchlist.length ? (
          <section>
            <SectionHeader
              title="Your Watchlist"
              subtitle={`${watchlist.length} waiting`}
              action={
                <Link
                  href="/watchlist"
                  className="text-xs uppercase tracking-[0.2em] text-ink-300 hover:text-amber"
                >
                  See all →
                </Link>
              }
            />
            <CardRow>
              {watchlist.slice(0, 14).map((e, i) => (
                <div key={e.id} className="w-40 md:w-48 shrink-0 snap-start">
                  <TitleCard
                    tmdbId={e.title.tmdbId}
                    mediaType={e.title.mediaType as "movie" | "tv"}
                    title={e.title.title}
                    year={e.title.year}
                    posterPath={e.title.posterPath}
                    bucket={e.bucket as Bucket | null}
                    style={{ animationDelay: `${i * 30}ms` }}
                  />
                </div>
              ))}
            </CardRow>
          </section>
        ) : null}

        <section>
          <SectionHeader
            title="Recently rated"
            subtitle="Your latest reactions"
            action={
              <Link
                href="/library"
                className="text-xs uppercase tracking-[0.2em] text-ink-300 hover:text-amber"
              >
                Library →
              </Link>
            }
          />
          <CardRow>
            {recent.map((e, i) => (
              <div key={e.id} className="w-40 md:w-48 shrink-0 snap-start">
                <TitleCard
                  tmdbId={e.title.tmdbId}
                  mediaType={e.title.mediaType as "movie" | "tv"}
                  title={e.title.title}
                  year={e.title.year}
                  posterPath={e.title.posterPath}
                  bucket={e.bucket as Bucket | null}
                  style={{ animationDelay: `${i * 30}ms` }}
                />
              </div>
            ))}
          </CardRow>
        </section>

        <div className="flex items-center justify-center gap-2 rounded-full border border-white/5 bg-white/[0.02] py-3 text-xs text-ink-300">
          <Sparkles className="h-3.5 w-3.5 text-amber" />
          <span>
            Keyboard: <kbd className="mx-1 rounded bg-white/10 px-1.5 py-0.5">/</kbd>
            search,
            <kbd className="mx-1 rounded bg-white/10 px-1.5 py-0.5">g</kbd>
            then
            <kbd className="mx-1 rounded bg-white/10 px-1.5 py-0.5">w</kbd>
            watchlist,
            <kbd className="mx-1 rounded bg-white/10 px-1.5 py-0.5">g l</kbd>
            library,
            <kbd className="mx-1 rounded bg-white/10 px-1.5 py-0.5">g s</kbd>
            stats
          </span>
        </div>
      </div>
    </div>
  );
}
