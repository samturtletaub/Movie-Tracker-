/**
 * One-off fix script: corrects title-matching issues from the fuzzy
 * enrich pass. Looks up each listed TMDB id and re-points the entry
 * onto the correct title, deleting the wrong/offline title row.
 */
import { config as loadEnv } from "dotenv";
import { db } from "../src/lib/db";
import { entries, titles } from "../src/lib/db/schema";
import { and, eq, like, or } from "drizzle-orm";
import { upsertTitleFromTmdb } from "../src/lib/titles";

loadEnv({ path: ".env.local" });
loadEnv();

interface Fix {
  match: string | string[];
  mediaType: "movie" | "tv";
  tmdbId: number;
  label: string;
}

const FIXES: Fix[] = [
  { match: "Goodwill Hunting", mediaType: "movie", tmdbId: 489, label: "Good Will Hunting (1997)" },
  { match: "Silver Lining Playbook", mediaType: "movie", tmdbId: 82693, label: "Silver Linings Playbook (2012)" },
  { match: "Wolf of wallstreet", mediaType: "movie", tmdbId: 106646, label: "The Wolf of Wall Street (2013)" },
  { match: "New knives out", mediaType: "movie", tmdbId: 661374, label: "Glass Onion: A Knives Out Mystery (2022)" },
  { match: "Nuremberg- new Russell Crowe movie", mediaType: "movie", tmdbId: 1035259, label: "Nuremberg (2025)" },

  { match: ["Seven", "Scream 7"], mediaType: "movie", tmdbId: 807, label: "Se7en (1995)" },
  { match: ["Prestige"], mediaType: "movie", tmdbId: 1124, label: "The Prestige (2006)" },
  { match: ["Brutalist"], mediaType: "movie", tmdbId: 549509, label: "The Brutalist (2024)" },
  { match: ["Django"], mediaType: "movie", tmdbId: 68718, label: "Django Unchained (2012)" },
];

async function main() {
  if (!process.env.TMDB_API_KEY) {
    console.error("TMDB_API_KEY missing.");
    process.exit(1);
  }

  let fixed = 0;
  const missing: string[] = [];

  for (const fix of FIXES) {
    const matches = Array.isArray(fix.match) ? fix.match : [fix.match];

    const wrongTitleRow = await db
      .select()
      .from(titles)
      .where(or(...matches.map((m) => eq(titles.title, m))))
      .get();

    if (!wrongTitleRow) {
      missing.push(`${matches[0]} (not in DB)`);
      continue;
    }

    const entry = await db
      .select()
      .from(entries)
      .where(eq(entries.titleId, wrongTitleRow.id))
      .get();

    const correct = await upsertTitleFromTmdb(fix.mediaType, fix.tmdbId);

    if (entry) {
      const existing = await db
        .select()
        .from(entries)
        .where(eq(entries.titleId, correct.id))
        .get();

      if (existing && existing.id !== entry.id) {
        const merged = [existing.notes, entry.notes].filter(Boolean).join(" / ") || null;
        await db
          .update(entries)
          .set({
            notes: merged,
            bucket: existing.bucket ?? entry.bucket,
            status: existing.status === "watchlist" ? entry.status : existing.status,
          })
          .where(eq(entries.id, existing.id));
        await db.delete(entries).where(eq(entries.id, entry.id));
      } else {
        await db
          .update(entries)
          .set({ titleId: correct.id })
          .where(eq(entries.id, entry.id));
      }
    }

    if (wrongTitleRow.id !== correct.id) {
      await db.delete(titles).where(eq(titles.id, wrongTitleRow.id));
    }

    console.log(`  ✓ ${matches[0]}  →  ${fix.label}`);
    fixed++;
  }

  console.log(`\nFixed ${fixed} titles.`);
  if (missing.length) {
    console.log("\nNot found in DB (skipped):");
    for (const m of missing) console.log(`  - ${m}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
