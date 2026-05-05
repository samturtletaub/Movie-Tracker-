import { and, eq } from "drizzle-orm";
import { db } from "./db";
import { titles, type NewTitle, type Title } from "./db/schema";
import {
  getDetail,
  getWatchProviders,
  titleOf,
  yearOf,
  type TmdbMediaType,
} from "./tmdb";

/**
 * Upsert a TMDB title into the local cache. If already present and fresh
 * (<7 days), return the cached row without re-fetching TMDB.
 */
export async function upsertTitleFromTmdb(
  mediaType: TmdbMediaType,
  tmdbId: number,
  opts: { force?: boolean } = {},
): Promise<Title> {
  const existing = await db
    .select()
    .from(titles)
    .where(and(eq(titles.tmdbId, tmdbId), eq(titles.mediaType, mediaType)))
    .get();

  const WEEK = 1000 * 60 * 60 * 24 * 7;
  const stale =
    !existing ||
    opts.force ||
    !existing.lastSyncedAt ||
    Date.now() - existing.lastSyncedAt.getTime() > WEEK;

  if (existing && !stale) return existing;

  const [detail, providers] = await Promise.all([
    getDetail(mediaType, tmdbId),
    getWatchProviders(mediaType, tmdbId).catch(() => undefined),
  ]);

  const runtime =
    detail.runtime ??
    (detail.episode_run_time && detail.episode_run_time[0]) ??
    null;

  const row: NewTitle = {
    tmdbId,
    mediaType,
    title: titleOf(detail),
    year: yearOf(detail),
    posterPath: detail.poster_path ?? null,
    backdropPath: detail.backdrop_path ?? null,
    overview: detail.overview ?? null,
    genresJson: JSON.stringify(detail.genres?.map((g) => g.name) ?? []),
    runtime,
    numberOfSeasons: detail.number_of_seasons ?? null,
    numberOfEpisodes: detail.number_of_episodes ?? null,
    providersJson: providers ? JSON.stringify(providers) : null,
    tmdbVote: detail.vote_average != null ? String(detail.vote_average) : null,
    lastSyncedAt: new Date(),
  };

  if (existing) {
    await db.update(titles).set(row).where(eq(titles.id, existing.id));
    return { ...existing, ...row } as Title;
  }
  const inserted = await db.insert(titles).values(row).returning().get();
  return inserted;
}

export function parseGenres(json: string | null): string[] {
  if (!json) return [];
  try {
    const v = JSON.parse(json);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}
