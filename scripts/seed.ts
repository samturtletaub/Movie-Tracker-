/**
 * Parse movielist.md and seed the local DB with titles + entries.
 *
 * Strategy: search TMDB for each line, pick the top-ranked match (by popularity),
 * and create an entry with the appropriate status + bucket + notes.
 *
 * Idempotent: re-running won't duplicate entries (unique index on title_id).
 */
import { config as loadEnv } from "dotenv";
import fs from "node:fs";
import path from "node:path";

loadEnv({ path: ".env.local" });
loadEnv();

import { db } from "../src/lib/db";
import { entries, titles } from "../src/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { upsertTitleFromTmdb } from "../src/lib/titles";
import { searchMovie, searchMulti, searchTv, yearOf } from "../src/lib/tmdb";

type MediaHint = "movie" | "tv" | "auto";

interface ParsedLine {
  raw: string;
  title: string;
  notes?: string;
  mediaHint: MediaHint;
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
  type Section = "favorites" | "toWatch" | "shows" | null;
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

    const bulletOnly = /^[-*]\s*$/.test(trimmed);
    if (bulletOnly) continue;

    const { title, notes } = splitTitleNote(trimmed);
    if (!title) continue;

    if (section === "favorites") {
      out.push({
        raw: trimmed,
        title,
        notes,
        mediaHint: "auto",
        status: "watched",
        bucket: "loved",
      });
    } else if (section === "toWatch") {
      out.push({
        raw: trimmed,
        title,
        notes,
        mediaHint: "movie",
        status: "watchlist",
        bucket: null,
      });
    } else {
      out.push({
        raw: trimmed,
        title,
        notes,
        mediaHint: "tv",
        status: "watchlist",
        bucket: null,
      });
    }
  }
  return out;
}

async function resolve(entry: ParsedLine) {
  const { title, mediaHint } = entry;
  if (mediaHint === "movie") {
    const results = await searchMovie(title);
    return results[0] ? { ...results[0], media_type: "movie" as const } : null;
  }
  if (mediaHint === "tv") {
    const results = await searchTv(title);
    return results[0] ? { ...results[0], media_type: "tv" as const } : null;
  }
  const results = await searchMulti(title);
  const filtered = results.filter(
    (r) => r.media_type === "movie" || r.media_type === "tv",
  );
  return filtered[0] ?? null;
}

async function main() {
  if (!process.env.TMDB_API_KEY) {
    console.error(
      "TMDB_API_KEY is not set. Copy .env.local.example → .env.local and fill it in.",
    );
    process.exit(1);
  }

  const mdPath = path.join(process.cwd(), "movielist.md");
  if (!fs.existsSync(mdPath)) {
    console.error("movielist.md not found in repo root.");
    process.exit(1);
  }
  const md = fs.readFileSync(mdPath, "utf8");
  const parsed = parse(md);
  console.log(`Parsed ${parsed.length} lines.\n`);

  const unmatched: ParsedLine[] = [];
  let added = 0;
  let skipped = 0;

  for (const p of parsed) {
    try {
      const hit = await resolve(p);
      if (!hit) {
        unmatched.push(p);
        console.log(`  ? unmatched: "${p.title}"`);
        continue;
      }
      const mediaType = hit.media_type as "movie" | "tv";
      const titleRow = await upsertTitleFromTmdb(mediaType, hit.id);

      const existing = await db
        .select()
        .from(entries)
        .where(eq(entries.titleId, titleRow.id))
        .get();

      if (existing) {
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
      const label = titleRow.year ? `${titleRow.title} (${titleRow.year})` : titleRow.title;
      const badge =
        p.status === "watched" ? "LOVED" : p.mediaHint === "tv" ? "SHOW " : "WATCH";
      console.log(`  ${badge} ${label}${p.notes ? `  — ${p.notes}` : ""}`);
    } catch (err) {
      console.warn(`  ! error for "${p.title}":`, (err as Error).message);
      unmatched.push(p);
    }
  }

  console.log(
    `\nDone. Added: ${added}. Already present: ${skipped}. Unmatched: ${unmatched.length}.`,
  );
  if (unmatched.length) {
    console.log("\nUnmatched lines (skipped — add manually if desired):");
    for (const u of unmatched) console.log(`  - ${u.raw}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
