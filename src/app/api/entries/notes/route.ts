import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { entries } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const schema = z.object({
  entryId: z.number().int().positive(),
  notes: z.string().max(5000).nullable(),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const row = await db
    .update(entries)
    .set({ notes: parsed.data.notes, updatedAt: new Date() })
    .where(eq(entries.id, parsed.data.entryId))
    .returning()
    .get();
  return NextResponse.json({ ok: true, entry: row });
}
