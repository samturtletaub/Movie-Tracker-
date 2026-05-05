import { notFound } from "next/navigation";
import Image from "next/image";
import {
  getDetail,
  getSimilar,
  getWatchProviders,
  posterUrl,
  titleOf,
  yearOf,
  type TmdbDetail,
  type TmdbSearchResult,
} from "@/lib/tmdb";
import { getEntryWithTitle } from "@/lib/queries";
import { upsertTitleFromTmdb, parseGenres } from "@/lib/titles";
import { BackdropHero } from "@/components/backdrop-hero";
import { TitleCard } from "@/components/title-card";
import { CardRow } from "@/components/card-row";
import { SectionHeader } from "@/components/section-header";
import { RateBar } from "@/components/rate-bar";
import { NotesEditor } from "@/components/notes-editor";
import { ShowProgress } from "@/components/show-progress";
import { formatRuntime, type Bucket } from "@/lib/utils";
import { Clock, Star, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TitlePage({
  params,
}: {
  params: Promise<{ mediaType: string; tmdbId: string }>;
}) {
  const { mediaType: mt, tmdbId: idStr } = await params;
  if (mt !== "movie" && mt !== "tv") notFound();
  const mediaType = mt as "movie" | "tv";
  const tmdbId = parseInt(idStr, 10);
  if (!Number.isFinite(tmdbId)) notFound();

  const isOffline = tmdbId < 0;

  let localTitle =
    (await getEntryWithTitle(mediaType, tmdbId))?.title ?? null;

  if (!isOffline && (!localTitle || !process.env.TMDB_API_KEY)) {
    try {
      localTitle = await upsertTitleFromTmdb(mediaType, tmdbId);
    } catch {
      /* offline or no key — fall through */
    }
  }

  if (!localTitle) notFound();

  let detail: TmdbDetail | null = null;
  let similar: (TmdbSearchResult & { media_type?: string })[] = [];
  let providers: Awaited<ReturnType<typeof getWatchProviders>> = undefined;

  if (!isOffline && process.env.TMDB_API_KEY) {
    [detail, similar, providers] = await Promise.all([
      getDetail(mediaType, tmdbId).catch(() => null),
      getSimilar(mediaType, tmdbId).catch(() => []),
      getWatchProviders(mediaType, tmdbId).catch(() => undefined),
    ]);
  }

  const entryRec = await getEntryWithTitle(mediaType, tmdbId);
  const entry = entryRec?.entry ?? null;
  const providerList =
    providers?.flatrate ?? providers?.rent ?? providers?.buy ?? [];

  const runtime =
    detail?.runtime ??
    (detail?.episode_run_time && detail.episode_run_time[0]) ??
    localTitle.runtime ??
    null;

  const displayTitle = detail ? titleOf(detail) : localTitle.title;
  const year = detail ? (yearOf(detail) ?? null) : (localTitle.year ?? null);
  const backdropPath = detail?.backdrop_path ?? localTitle.backdropPath ?? null;
  const posterPath = detail?.poster_path ?? localTitle.posterPath ?? null;
  const overview = detail?.overview ?? localTitle.overview ?? null;
  const genres = detail
    ? detail.genres?.map((g) => g.name)
    : parseGenres(localTitle.genresJson);
  const cast = detail?.credits?.cast?.slice(0, 8) ?? [];
  const voteAverage = detail?.vote_average;

  return (
    <article>
      <BackdropHero
        backdropPath={backdropPath}
        title={displayTitle}
        year={year}
        tagline={detail?.tagline ?? undefined}
        height="short"
      >
        <RateBar
          entryId={entry?.id}
          titleId={localTitle.id}
          mediaType={mediaType}
          tmdbId={tmdbId}
          currentBucket={(entry?.bucket as Bucket) ?? null}
          currentStatus={
            (entry?.status as "watchlist" | "watched" | "didnt_finish") ?? null
          }
        />
      </BackdropHero>

      <div className="mx-auto max-w-6xl px-6 py-12">
        {isOffline ? (
          <div className="mb-8 flex items-center gap-3 rounded-2xl border border-amber/30 bg-amber/5 p-4 text-sm text-amber-soft">
            <Sparkles className="h-4 w-4 shrink-0 text-amber" />
            <div>
              <span className="font-medium text-white">Offline entry.</span>{" "}
              Add a TMDB API key and re-run{" "}
              <code className="rounded bg-white/10 px-1.5 py-0.5 text-[11px]">
                npm run seed
              </code>{" "}
              to pull in poster art, overview, streaming providers, and similar
              titles.
            </div>
          </div>
        ) : null}

        <div className="grid gap-10 md:grid-cols-[240px_1fr]">
          <aside className="space-y-6">
            <div className="relative aspect-[2/3] w-full max-w-[240px] overflow-hidden rounded-2xl bg-ink-800 ring-1 ring-white/10">
              {posterUrl(posterPath) ? (
                <Image
                  src={posterUrl(posterPath)!}
                  alt={displayTitle}
                  fill
                  sizes="240px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-ink-400">
                  <span className="font-serif text-3xl italic">
                    {displayTitle.slice(0, 1)}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-3 text-sm text-ink-200">
              {runtime ? (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber" />
                  <span>{formatRuntime(runtime)}</span>
                  {mediaType === "tv" ? (
                    <span className="text-ink-400">per episode</span>
                  ) : null}
                </div>
              ) : null}
              {voteAverage ? (
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-amber" />
                  <span>{voteAverage.toFixed(1)} / 10 TMDB</span>
                </div>
              ) : null}
              {mediaType === "tv" && detail?.number_of_seasons ? (
                <div className="text-ink-300">
                  {detail.number_of_seasons} season
                  {detail.number_of_seasons > 1 ? "s" : ""}
                  {detail.number_of_episodes
                    ? ` · ${detail.number_of_episodes} eps`
                    : ""}
                </div>
              ) : null}

              {genres.length ? (
                <div className="flex flex-wrap gap-1.5">
                  {genres.map((g) => (
                    <span
                      key={g}
                      className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-0.5 text-[11px] uppercase tracking-widest text-ink-200"
                    >
                      {g}
                    </span>
                  ))}
                </div>
              ) : null}

              {providerList.length ? (
                <div>
                  <div className="mb-2 text-[11px] uppercase tracking-widest text-ink-400">
                    Streaming (US)
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {providerList.map((p) => (
                      <span
                        key={p.provider_id}
                        title={p.provider_name}
                        className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1 text-xs"
                      >
                        {p.logo_path ? (
                          <Image
                            src={`https://image.tmdb.org/t/p/w92${p.logo_path}`}
                            alt={p.provider_name}
                            width={20}
                            height={20}
                            className="rounded"
                          />
                        ) : null}
                        <span>{p.provider_name}</span>
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </aside>

          <div className="space-y-8">
            {overview ? (
              <p className="font-serif text-xl italic leading-relaxed text-ink-100">
                {overview}
              </p>
            ) : null}

            <NotesEditor entryId={entry?.id ?? null} initialNotes={entry?.notes ?? ""} />

            {mediaType === "tv" && entry && detail?.seasons ? (
              <ShowProgress entryId={entry.id} seasons={detail.seasons} />
            ) : null}

            {cast.length ? (
              <div>
                <h3 className="mb-3 text-[11px] uppercase tracking-[0.25em] text-ink-400">
                  Cast
                </h3>
                <div className="flex flex-wrap gap-2 text-sm text-ink-200">
                  {cast.map((c, i) => (
                    <span key={c.id ?? i} className="rounded-full bg-white/5 px-3 py-1">
                      {c.name}
                      <span className="text-ink-400"> · {c.character}</span>
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {similar.length ? (
          <div className="mt-16">
            <SectionHeader
              title="Similar titles"
              subtitle="From TMDB's similar + recommendations"
            />
            <SimilarRow items={similar.slice(0, 20)} />
          </div>
        ) : null}
      </div>
    </article>
  );
}

function SimilarRow({
  items,
}: {
  items: Array<{
    id: number;
    media_type?: string;
    title?: string;
    name?: string;
    release_date?: string;
    first_air_date?: string;
    poster_path?: string | null;
  }>;
}) {
  return (
    <CardRow>
      {items.map((r, i) => (
        <div key={r.id} className="w-40 md:w-48 shrink-0 snap-start">
          <TitleCard
            tmdbId={r.id}
            mediaType={(r.media_type as "movie" | "tv") ?? "movie"}
            title={r.title || r.name || "Untitled"}
            year={
              r.release_date || r.first_air_date
                ? parseInt(
                    (r.release_date || r.first_air_date || "").slice(0, 4),
                    10,
                  ) || null
                : null
            }
            posterPath={r.poster_path ?? null}
            style={{ animationDelay: `${i * 20}ms` }}
          />
        </div>
      ))}
    </CardRow>
  );
}
