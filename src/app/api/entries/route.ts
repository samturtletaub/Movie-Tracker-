import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { entries, titles } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { upsertTitleFromTmdb } from "@/lib/titles";

const schema = z.object({
  mediaType: z.enum(["movie", "tv"]),
  tmdbId: z.number().int().positive(),
  entryId: z.number().int().positive().nullable().optional(),
  titleId: z.number().int().positive().nullable().optional(),
  status: z.enum(["watchlist", "watched", "didnt_finish"]).nullable().optional(),
  bucket: z.enum(["loved", "liked", "meh", "dnf"]).nullable().optional(),
  notes: z.string().max(5000).nullable().optional(),
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { mediaType, tmdbId, bucket, notes } = parsed.data;
  let { status } = parsed.data;

  const isOffline = tmdbId < 0;
  let title = isOffline
    ? (await db
        .select()
        .from(titles)
        .where(and(eq(titles.tmdbId, tmdbId), eq(titles.mediaType, mediaType)))
        .get()) ?? null
    : null;

  if (!title) {
    if (isOffline) {
      return NextResponse.json(
        { error: "Offline title not found in library." },
        { status: 404 },
      );
    }
    try {
      title = await upsertTitleFromTmdb(mediaType, tmdbId);
    } catch (err) {
      return NextResponse.json(
        { error: `TMDB fetch failed: ${(err as Error).message}` },
        { status: 500 },
      );
    }
  }

  if (bucket) {
    status = bucket === "dnf" ? "didnt_finish" : "watched";
  }

  const existing = await db
    .select()
    .from(entries)
    .where(eq(entries.titleId, title.id))
    .get();

  if (status === null && !bucket) {
    if (existing) await db.delete(entries).where(eq(entries.id, existing.id));
    return NextResponse.json({ ok: true, deleted: true });
  }

  const finalStatus =
    status ?? existing?.status ?? (bucket === "dnf" ? "didnt_finish" : "watched");

  if (existing) {
    const row = await db
      .update(entries)
      .set({
        status: finalStatus,
        bucket: bucket !== undefined ? bucket : existing.bucket,
        notes: notes !== undefined ? notes : existing.notes,
        watchedAt:
          finalStatus === "watched" && !existing.watchedAt
            ? new Date()
            : existing.watchedAt,
        updatedAt: new Date(),
      })
      .where(eq(entries.id, existing.id))
      .returning()
      .get();
    return NextResponse.json({ ok: true, entry: row });
  }

  const row = await db
    .insert(entries)
    .values({
      titleId: title.id,
      status: finalStatus,
      bucket: bucket ?? null,
      notes: notes ?? null,
      watchedAt: finalStatus === "watched" ? new Date() : null,
    })
    .returning()
    .get();

  return NextResponse.json({ ok: true, entry: row });
}

const deleteSchema = z.object({ titleId: z.number().int().positive() });

export async function DELETE(req: Request) {
  const body = await req.json();
  const parsed = deleteSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  await db.delete(entries).where(eq(entries.titleId, parsed.data.titleId));
  return NextResponse.json({ ok: true });
}
