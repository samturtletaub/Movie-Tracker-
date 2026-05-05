/**
 * TMDB v3 API client with in-memory response cache.
 * Docs: https://developer.themoviedb.org/reference/intro/getting-started
 */

const BASE = "https://api.themoviedb.org/3";
const IMG_BASE = "https://image.tmdb.org/t/p";

const DEFAULT_TTL_MS = 1000 * 60 * 60 * 6;
const memory = new Map<string, { expiresAt: number; data: unknown }>();

function apiKey(): string {
  const key = process.env.TMDB_API_KEY;
  if (!key) {
    throw new Error(
      "TMDB_API_KEY missing. Set it in .env.local (see .env.local.example).",
    );
  }
  return key;
}

async function tmdbFetch<T>(
  pathname: string,
  params: Record<string, string | number | undefined> = {},
  ttlMs = DEFAULT_TTL_MS,
): Promise<T> {
  const url = new URL(BASE + pathname);
  url.searchParams.set("api_key", apiKey());
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) url.searchParams.set(k, String(v));
  }
  const cacheKey = url.toString();
  const hit = memory.get(cacheKey);
  if (hit && hit.expiresAt > Date.now()) return hit.data as T;

  const res = await fetch(cacheKey, { headers: { accept: "application/json" } });
  if (!res.ok) {
    throw new Error(`TMDB ${res.status} ${res.statusText} for ${pathname}`);
  }
  const data = (await res.json()) as T;
  memory.set(cacheKey, { expiresAt: Date.now() + ttlMs, data });
  return data;
}

export type TmdbMediaType = "movie" | "tv";

export interface TmdbSearchResult {
  id: number;
  media_type: TmdbMediaType | "person";
  title?: string;
  name?: string;
  release_date?: string;
  first_air_date?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  overview?: string;
  vote_average?: number;
  popularity?: number;
}

export interface TmdbGenre {
  id: number;
  name: string;
}

export interface TmdbDetail {
  id: number;
  title?: string;
  name?: string;
  release_date?: string;
  first_air_date?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  overview?: string;
  genres: TmdbGenre[];
  runtime?: number;
  episode_run_time?: number[];
  number_of_seasons?: number;
  number_of_episodes?: number;
  vote_average?: number;
  tagline?: string;
  seasons?: Array<{
    id: number;
    name: string;
    season_number: number;
    episode_count: number;
    poster_path?: string | null;
  }>;
  credits?: { cast: Array<{ id: number; name: string; character: string; profile_path?: string | null }> };
}

export interface TmdbSimilarResponse {
  results: TmdbSearchResult[];
}

export interface TmdbWatchProvidersResponse {
  results: Record<
    string,
    {
      link?: string;
      flatrate?: Array<{ provider_id: number; provider_name: string; logo_path: string }>;
      rent?: Array<{ provider_id: number; provider_name: string; logo_path: string }>;
      buy?: Array<{ provider_id: number; provider_name: string; logo_path: string }>;
    }
  >;
}

export async function searchMulti(query: string): Promise<TmdbSearchResult[]> {
  const data = await tmdbFetch<{ results: TmdbSearchResult[] }>(
    "/search/multi",
    { query, include_adult: "false" },
  );
  return data.results.filter((r) => r.media_type !== "person");
}

export async function searchMovie(query: string, year?: number) {
  const data = await tmdbFetch<{ results: TmdbSearchResult[] }>("/search/movie", {
    query,
    year,
    include_adult: "false",
  });
  return data.results;
}

export async function searchTv(query: string) {
  const data = await tmdbFetch<{ results: TmdbSearchResult[] }>("/search/tv", {
    query,
    include_adult: "false",
  });
  return data.results;
}

export async function getDetail(
  mediaType: TmdbMediaType,
  tmdbId: number,
): Promise<TmdbDetail> {
  return tmdbFetch<TmdbDetail>(`/${mediaType}/${tmdbId}`, {
    append_to_response: "credits",
  });
}

export async function getSimilar(
  mediaType: TmdbMediaType,
  tmdbId: number,
): Promise<TmdbSearchResult[]> {
  const [similar, recs] = await Promise.all([
    tmdbFetch<TmdbSimilarResponse>(`/${mediaType}/${tmdbId}/similar`),
    tmdbFetch<TmdbSimilarResponse>(`/${mediaType}/${tmdbId}/recommendations`),
  ]);
  const all = [...similar.results, ...recs.results].map((r) => ({
    ...r,
    media_type: mediaType as TmdbMediaType,
  }));
  return dedupeBy(all, (r) => r.id);
}

export async function getWatchProviders(
  mediaType: TmdbMediaType,
  tmdbId: number,
): Promise<TmdbWatchProvidersResponse["results"]["US"] | undefined> {
  const data = await tmdbFetch<TmdbWatchProvidersResponse>(
    `/${mediaType}/${tmdbId}/watch/providers`,
  );
  return data.results?.US;
}

export function posterUrl(path?: string | null, size: "w342" | "w500" | "w780" = "w500") {
  if (!path) return null;
  return `${IMG_BASE}/${size}${path}`;
}

export function backdropUrl(path?: string | null, size: "w780" | "w1280" | "original" = "w1280") {
  if (!path) return null;
  return `${IMG_BASE}/${size}${path}`;
}

export function titleOf(r: TmdbSearchResult | TmdbDetail): string {
  return (r as TmdbSearchResult).title || (r as TmdbSearchResult).name || "Untitled";
}

export function yearOf(r: TmdbSearchResult | TmdbDetail): number | undefined {
  const raw =
    (r as TmdbSearchResult).release_date ||
    (r as TmdbSearchResult).first_air_date ||
    undefined;
  if (!raw) return undefined;
  const y = parseInt(raw.slice(0, 4), 10);
  return Number.isFinite(y) ? y : undefined;
}

function dedupeBy<T>(arr: T[], key: (v: T) => number | string): T[] {
  const seen = new Set<number | string>();
  const out: T[] = [];
  for (const v of arr) {
    const k = key(v);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(v);
  }
  return out;
}
