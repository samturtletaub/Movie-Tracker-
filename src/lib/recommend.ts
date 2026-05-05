import { db } from "./db";
import { entries, recsCache, titles, type Title } from "./db/schema";
import { and, desc, eq, gte, inArray, sql } from "drizzle-orm";
import { getSimilar, type TmdbMediaType, type TmdbSearchResult } from "./tmdb";
import { upsertTitleFromTmdb, parseGenres } from "./titles";
import { llmJSON } from "./llm";

const CACHE_TTL_HOURS = 24;

export interface Recommendation {
  tmdbId: number;
  mediaType: TmdbMediaType;
  title: string;
  year: number | null;
  posterPath: string | null;
  reason: string | null;
}

interface Candidate {
  result: TmdbSearchResult & { media_type: TmdbMediaType };
  score: number;
  seedReasons: string[];
}

/**
 * Returns a freshly-curated recommendations list, using the 24h cache
 * unless `refresh` is true.
 */
export async function getRecommendations(
  opts: { refresh?: boolean; limit?: number } = {},
): Promise<{ recs: Recommendation[]; source: "cache" | "generated" | "empty" }> {
  const limit = opts.limit ?? 12;

  if (!opts.refresh) {
    const cached = await readCache(limit);
    if (cached.length) return { recs: cached, source: "cache" };
  }

  const loved = await db
    .select({ entry: entries, title: titles })
    .from(entries)
    .innerJoin(titles, eq(entries.titleId, titles.id))
    .where(eq(entries.bucket, "loved"))
    .all();

  const liked = await db
    .select({ entry: entries, title: titles })
    .from(entries)
    .innerJoin(titles, eq(entries.titleId, titles.id))
    .where(eq(entries.bucket, "liked"))
    .all();

  const tasteSeeds = [...loved, ...liked];
  if (!tasteSeeds.length) {
    return { recs: [], source: "empty" };
  }

  const excluded = await db.select({ id: titles.id, tmdbId: titles.tmdbId, mediaType: titles.mediaType }).from(entries).innerJoin(titles, eq(entries.titleId, titles.id)).all();
  const excludedKeys = new Set(excluded.map((t) => `${t.mediaType}:${t.tmdbId}`));

  const candidateMap = new Map<string, Candidate>();
  const seedSubset = tasteSeeds.slice(0, 12);

  for (const seed of seedSubset) {
    try {
      const similar = await getSimilar(
        seed.title.mediaType as TmdbMediaType,
        seed.title.tmdbId,
      );
      for (const r of similar) {
        if (!r.media_type || (r.media_type !== "movie" && r.media_type !== "tv"))
          continue;
        const key = `${r.media_type}:${r.id}`;
        if (excludedKeys.has(key)) continue;
        const existing = candidateMap.get(key);
        const boost = seed.entry.bucket === "loved" ? 0.5 : 0;
        if (existing) {
          existing.score += 1 + boost;
          existing.seedReasons.push(seed.title.title);
        } else {
          candidateMap.set(key, {
            result: r as TmdbSearchResult & { media_type: TmdbMediaType },
            score: 1 + boost + (r.popularity ?? 0) / 200,
            seedReasons: [seed.title.title],
          });
        }
      }
    } catch {
      continue;
    }
  }

  const top = [...candidateMap.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, 25);

  if (!top.length) return { recs: [], source: "empty" };

  const tastePayload = seedSubset.slice(0, 20).map((t) => ({
    title: t.title.title,
    year: t.title.year,
    bucket: t.entry.bucket,
    notes: t.entry.notes?.slice(0, 140) ?? null,
    genres: parseGenres(t.title.genresJson).slice(0, 4),
  }));

  const candidatesPayload = top.map((c) => {
    const rr = c.result;
    return {
      tmdbId: rr.id,
      mediaType: rr.media_type,
      title: (rr.title || rr.name || "").trim(),
      year:
        (rr.release_date || rr.first_air_date || "").slice(0, 4) || null,
      overview: rr.overview?.slice(0, 280) || "",
      similarTo: c.seedReasons.slice(0, 3),
    };
  });

  const sys =
    "You are a discerning, warm film and TV critic helping one user pick what to watch next. Output only valid JSON. Be specific and personal.";

  const usr = `User's taste profile (recent favorites with their notes):\n${JSON.stringify(
    tastePayload,
    null,
    2,
  )}\n\nCandidates to rank (all new to the user):\n${JSON.stringify(
    candidatesPayload,
    null,
    2,
  )}\n\nReturn JSON of the form:\n{\n  "recs": [\n    { "tmdbId": number, "mediaType": "movie"|"tv", "score": 1-100, "reason": "one sentence, specific, <=160 chars" }\n  ]\n}\n\nRules:\n- Pick the strongest ${limit} recommendations.\n- "reason" should reference the user's own taste (e.g., "Same slow-burn dread as Prisoners, with Denis Villeneuve's patience."). No generic adjectives.\n- Order by score descending.\n- Only include candidates from the list above; do not invent titles.`;

  const llmRes = await llmJSON<{
    recs: Array<{ tmdbId: number; mediaType: string; score: number; reason: string }>;
  }>(sys, usr);

  let ranked: Array<{ tmdbId: number; mediaType: TmdbMediaType; score: number; reason: string }>;
  if (llmRes.ok && Array.isArray(llmRes.data?.recs)) {
    ranked = llmRes.data.recs
      .filter(
        (r) =>
          (r.mediaType === "movie" || r.mediaType === "tv") &&
          typeof r.tmdbId === "number",
      )
      .map((r) => ({
        tmdbId: r.tmdbId,
        mediaType: r.mediaType as TmdbMediaType,
        score: Math.max(0, Math.min(100, Math.round(r.score ?? 50))),
        reason: String(r.reason || "").slice(0, 200),
      }));
  } else {
    ranked = top.slice(0, limit).map((c, i) => ({
      tmdbId: c.result.id,
      mediaType: c.result.media_type,
      score: Math.round(90 - i * 2),
      reason: `Because you loved ${c.seedReasons.slice(0, 2).join(" and ")}.`,
    }));
  }

  await db.delete(recsCache);

  const out: Recommendation[] = [];
  for (const r of ranked.slice(0, limit)) {
    try {
      const row = await upsertTitleFromTmdb(r.mediaType, r.tmdbId);
      await db.insert(recsCache).values({
        titleId: row.id,
        reason: r.reason,
        score: r.score,
      });
      out.push({
        tmdbId: row.tmdbId,
        mediaType: row.mediaType as TmdbMediaType,
        title: row.title,
        year: row.year ?? null,
        posterPath: row.posterPath,
        reason: r.reason,
      });
    } catch {
      continue;
    }
  }

  return { recs: out, source: "generated" };
}

async function readCache(limit: number): Promise<Recommendation[]> {
  const cutoff = new Date(Date.now() - CACHE_TTL_HOURS * 60 * 60 * 1000);
  const rows = await db
    .select({ r: recsCache, t: titles })
    .from(recsCache)
    .innerJoin(titles, eq(recsCache.titleId, titles.id))
    .where(gte(recsCache.generatedAt, cutoff))
    .orderBy(desc(recsCache.score))
    .limit(limit)
    .all();

  const entryRows = await db.select().from(entries).all();
  const haveSet = new Set(entryRows.map((e) => e.titleId));

  return rows
    .filter((row) => !haveSet.has(row.t.id) && !row.r.dismissedAt)
    .map((row) => ({
      tmdbId: row.t.tmdbId,
      mediaType: row.t.mediaType as TmdbMediaType,
      title: row.t.title,
      year: row.t.year ?? null,
      posterPath: row.t.posterPath,
      reason: row.r.reason,
    }));
}
