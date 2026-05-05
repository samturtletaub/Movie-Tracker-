/**
 * Enrich offline-seeded titles with real TMDB data.
 *
 * Walks every title with a negative tmdb_id (synthetic), resolves it via
 * TMDB search, and migrates the existing entry onto the real TMDB title row.
 * Idempotent and safe to re-run.
 */
import { config as loadEnv } from "dotenv";
import { db } from "../src/lib/db";
import { entries, titles, showProgress, recsCache } from "../src/lib/db/schema";
import { and, eq, lt } from "drizzle-orm";
import { upsertTitleFromTmdb } from "../src/lib/titles";
import { searchMovie, searchMulti, searchTv } from "../src/lib/tmdb";

loadEnv({ path: ".env.local" });
loadEnv();

async function resolveTitle(
  rawTitle: string,
  mediaHint: "movie" | "tv",
): Promise<{ id: number; media_type: "movie" | "tv" } | null> {
  if (mediaHint === "movie") {
    const r = await searchMovie(rawTitle);
    if (r[0]) return { id: r[0].id, media_type: "movie" };
  }
  if (mediaHint === "tv") {
    const r = await searchTv(rawTitle);
    if (r[0]) return { id: r[0].id, media_type: "tv" };
  }
  const r = await searchMulti(rawTitle);
  const first = r.find((x) => x.media_type === "movie" || x.media_type === "tv");
  return first ? { id: first.id, media_type: first.media_type as "movie" | "tv" } : null;
}

async function main() {
  if (!process.env.TMDB_API_KEY) {
    console.error("TMDB_API_KEY missing in .env.local.");
    process.exit(1);
  }

  const offline = await db
    .select()
    .from(titles)
    .where(lt(titles.tmdbId, 0))
    .all();

  console.log(`Found ${offline.length} offline titles to enrich.\n`);

  const unresolved: string[] = [];
  let enriched = 0;
  let merged = 0;

  for (const t of offline) {
    try {
      const hit = await resolveTitle(t.title, t.mediaType as "movie" | "tv");
      if (!hit) {
        unresolved.push(`${t.title} [${t.mediaType}]`);
        console.log(`  ? unresolved: "${t.title}"`);
        continue;
      }

      const realTitle = await upsertTitleFromTmdb(hit.media_type, hit.id);

      const offlineEntry = await db
        .select()
        .from(entries)
        .where(eq(entries.titleId, t.id))
        .get();

      const existingRealEntry = await db
        .select()
        .from(entries)
        .where(eq(entries.titleId, realTitle.id))
        .get();

      if (offlineEntry && !existingRealEntry) {
        await db
          .update(entries)
          .set({ titleId: realTitle.id })
          .where(eq(entries.id, offlineEntry.id));
        enriched++;
      } else if (offlineEntry && existingRealEntry) {
        const merged_notes = [existingRealEntry.notes, offlineEntry.notes]
          .filter(Boolean)
          .join(" / ") || null;
        await db
          .update(entries)
          .set({
            notes: merged_notes,
            bucket: existingRealEntry.bucket ?? offlineEntry.bucket,
            status:
              existingRealEntry.status === "watchlist"
                ? offlineEntry.status
                : existingRealEntry.status,
          })
          .where(eq(entries.id, existingRealEntry.id));
        await db.delete(entries).where(eq(entries.id, offlineEntry.id));
        merged++;
      }

      await db.delete(showProgress).where(eq(showProgress.entryId, t.id));
      await db.delete(recsCache).where(eq(recsCache.titleId, t.id));
      await db.delete(titles).where(eq(titles.id, t.id));

      const label = realTitle.year
        ? `${realTitle.title} (${realTitle.year})`
        : realTitle.title;
      console.log(`  ✓ ${t.title}  →  ${label}`);
    } catch (err) {
      console.warn(`  ! error on "${t.title}":`, (err as Error).message);
      unresolved.push(`${t.title} [${t.mediaType}]`);
    }
  }

  console.log(
    `\nDone. Enriched: ${enriched}. Merged (dup): ${merged}. Unresolved: ${unresolved.length}.`,
  );
  if (unresolved.length) {
    console.log("\nUnresolved (kept as offline; remove manually or rename):");
    for (const u of unresolved) console.log(`  - ${u}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
