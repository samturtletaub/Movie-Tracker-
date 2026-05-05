import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { showProgress } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const entryId = Number(searchParams.get("entryId"));
  if (!Number.isFinite(entryId)) return NextResponse.json({ progress: [] });
  const rows = await db
    .select()
    .from(showProgress)
    .where(eq(showProgress.entryId, entryId))
    .all();
  return NextResponse.json({ progress: rows });
}

const schema = z.object({
  entryId: z.number().int().positive(),
  season: z.number().int().nonnegative(),
  episodesWatched: z.number().int().nonnegative(),
  totalEpisodes: z.number().int().nonnegative().nullable().optional(),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const { entryId, season, episodesWatched, totalEpisodes } = parsed.data;

  const existing = await db
    .select()
    .from(showProgress)
    .where(and(eq(showProgress.entryId, entryId), eq(showProgress.season, season)))
    .get();

  if (existing) {
    const row = await db
      .update(showProgress)
      .set({
        episodesWatched,
        totalEpisodes: totalEpisodes ?? existing.totalEpisodes ?? null,
        updatedAt: new Date(),
      })
      .where(eq(showProgress.id, existing.id))
      .returning()
      .get();
    return NextResponse.json({ ok: true, row });
  }

  const row = await db
    .insert(showProgress)
    .values({
      entryId,
      season,
      episodesWatched,
      totalEpisodes: totalEpisodes ?? null,
    })
    .returning()
    .get();
  return NextResponse.json({ ok: true, row });
}
