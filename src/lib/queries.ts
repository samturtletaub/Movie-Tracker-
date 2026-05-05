import { db } from "./db";
import { entries, titles, type Entry, type Title } from "./db/schema";
import { and, desc, eq, inArray } from "drizzle-orm";

export interface TitleEntry {
  entry: Entry | null;
  title: Title;
}

export async function getEntryWithTitle(
  mediaType: "movie" | "tv",
  tmdbId: number,
): Promise<TitleEntry | null> {
  const title = await db
    .select()
    .from(titles)
    .where(and(eq(titles.mediaType, mediaType), eq(titles.tmdbId, tmdbId)))
    .get();
  if (!title) return null;
  const entry =
    (await db.select().from(entries).where(eq(entries.titleId, title.id)).get()) ?? null;
  return { title, entry };
}

export async function listByStatus(
  status: "watchlist" | "watched" | "didnt_finish",
): Promise<Array<Entry & { title: Title }>> {
  const rows = await db
    .select({ entry: entries, title: titles })
    .from(entries)
    .innerJoin(titles, eq(entries.titleId, titles.id))
    .where(eq(entries.status, status))
    .orderBy(desc(entries.updatedAt))
    .all();
  return rows.map((r) => ({ ...r.entry, title: r.title }));
}

export async function listAllEntries(): Promise<Array<Entry & { title: Title }>> {
  const rows = await db
    .select({ entry: entries, title: titles })
    .from(entries)
    .innerJoin(titles, eq(entries.titleId, titles.id))
    .orderBy(desc(entries.updatedAt))
    .all();
  return rows.map((r) => ({ ...r.entry, title: r.title }));
}

export async function listByTitleIds(
  titleIds: number[],
): Promise<Array<Entry & { title: Title }>> {
  if (!titleIds.length) return [];
  const rows = await db
    .select({ entry: entries, title: titles })
    .from(entries)
    .innerJoin(titles, eq(entries.titleId, titles.id))
    .where(inArray(entries.titleId, titleIds))
    .all();
  return rows.map((r) => ({ ...r.entry, title: r.title }));
}

export async function listLoved(): Promise<Array<Entry & { title: Title }>> {
  const rows = await db
    .select({ entry: entries, title: titles })
    .from(entries)
    .innerJoin(titles, eq(entries.titleId, titles.id))
    .where(eq(entries.bucket, "loved"))
    .orderBy(desc(entries.updatedAt))
    .all();
  return rows.map((r) => ({ ...r.entry, title: r.title }));
}
