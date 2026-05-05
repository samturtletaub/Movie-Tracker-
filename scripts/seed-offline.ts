/**
 * Offline seed: import movielist.md into the DB WITHOUT hitting TMDB.
 *
 * Useful for getting content in fast when you don't yet have a TMDB API key.
 * Titles get synthetic negative tmdb_ids (derived from a hash) so re-runs
 * are idempotent. Later, `npm run seed` (online) will resolve these into
 * proper TMDB entries with posters, providers, etc.
 */
import fs from "node:fs";
import path from "node:path";
import { db } from "../src/lib/db";
import { entries, titles } from "../src/lib/db/schema";
import { and, eq } from "drizzle-orm";

type Section = "favorites" | "toWatch" | "shows" | null;

interface ParsedLine {
  raw: string;
  title: string;
  notes?: string;
  mediaType: "movie" | "tv";
  status: "watchlist" | "watched";
  bucket: "loved" | "liked" | "meh" | null;
}

function splitTitleNote(raw: string): { title: string; notes?: string } {
  let s = raw.trim().replace(/^[-*]\s*/, "");
  if (!s) return { title: "" };

  const dashIdx = [" - ", " -", "— ", " – "].reduce<number>((acc, sep) => {
    if (acc !== -1) return acc;
    const i = s.indexOf(sep);
    return i >= 2 ? i : -1;
  }, -1);
  let title = s;
  let notes: string | undefined;
  if (dashIdx > 0) {
    title = s.slice(0, dashIdx).trim();
    notes = s.slice(dashIdx).replace(/^[\s\-–—]+/, "").trim();
  }

  const trailingAllCaps = title.match(/\s+([A-Z]{3,}(?:\s+[A-Z]{3,})?)$/);
  if (trailingAllCaps) {
    const tag = trailingAllCaps[1];
    title = title.slice(0, -trailingAllCaps[0].length).trim();
    notes = notes ? `${tag}. ${notes}` : `For ${tag}`;
  }

  title = title.replace(/\s{2,}/g, " ");
  return { title, notes };
}

function parse(md: string): ParsedLine[] {
  const lines = md.split("\n");
  const out: ParsedLine[] = [];
  let section: Section = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (/^#\s+/.test(trimmed)) continue;

    if (/^Favorites:/i.test(trimmed)) {
      section = "favorites";
      continue;
    }
    if (/^To Watch:/i.test(trimmed)) {
      section = "toWatch";
      continue;
    }
    if (/^Shows?\s+to\s+Watch/i.test(trimmed)) {
      section = "shows";
      continue;
    }
    if (!section) continue;
    if (/^[-*]\s*$/.test(trimmed)) continue;

    const { title, notes } = splitTitleNote(trimmed);
    if (!title) continue;

    if (section === "favorites") {
      out.push({ raw: trimmed, title, notes, mediaType: "movie", status: "watched", bucket: "loved" });
    } else if (section === "toWatch") {
      out.push({ raw: trimmed, title, notes, mediaType: "movie", status: "watchlist", bucket: null });
    } else {
      out.push({ raw: trimmed, title, notes, mediaType: "tv", status: "watchlist", bucket: null });
    }
  }
  return out;
}

/** djb2 hash → stable negative int that fits SQLite INTEGER (32-bit signed). */
function synthId(mediaType: string, title: string): number {
  let h = 5381;
  const s = `${mediaType}::${title.toLowerCase().trim()}`;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return -(Math.abs(h) % 2_000_000_000) - 1;
}

async function main() {
  const mdPath = path.join(process.cwd(), "movielist.md");
  if (!fs.existsSync(mdPath)) {
    console.error("movielist.md not found in repo root.");
    process.exit(1);
  }
  const md = fs.readFileSync(mdPath, "utf8");
  const parsed = parse(md);
  console.log(`Parsed ${parsed.length} titles.\n`);

  let added = 0;
  let skipped = 0;

  for (const p of parsed) {
    const tmdbId = synthId(p.mediaType, p.title);

    const existingTitle = await db
      .select()
      .from(titles)
      .where(and(eq(titles.tmdbId, tmdbId), eq(titles.mediaType, p.mediaType)))
      .get();

    let titleRow = existingTitle;
    if (!titleRow) {
      titleRow = await db
        .insert(titles)
        .values({
          tmdbId,
          mediaType: p.mediaType,
          title: p.title,
          year: null,
          posterPath: null,
          backdropPath: null,
          overview: null,
          genresJson: "[]",
          runtime: null,
          numberOfSeasons: null,
          numberOfEpisodes: null,
          providersJson: null,
          tmdbVote: null,
          lastSyncedAt: new Date(0),
        })
        .returning()
        .get();
    }

    const existingEntry = await db
      .select()
      .from(entries)
      .where(eq(entries.titleId, titleRow.id))
      .get();

    if (existingEntry) {
      skipped++;
      continue;
    }

    await db.insert(entries).values({
      titleId: titleRow.id,
      status: p.status,
      bucket: p.bucket,
      notes: p.notes ?? null,
      watchedAt: p.status === "watched" ? new Date() : null,
    });
    added++;

    const badge =
      p.bucket === "loved" ? "LOVED" : p.mediaType === "tv" ? "SHOW " : "WATCH";
    console.log(`  ${badge} ${p.title}${p.notes ? `  — ${p.notes}` : ""}`);
  }

  console.log(`\nDone. Added: ${added}. Already present: ${skipped}.`);
  console.log(
    "\nNote: offline seed — no posters/metadata yet. Add TMDB_API_KEY and run `npm run seed` to enrich.",
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
