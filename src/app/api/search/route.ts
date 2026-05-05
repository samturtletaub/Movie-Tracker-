import { NextResponse } from "next/server";
import { searchMulti, yearOf, titleOf } from "@/lib/tmdb";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  if (!q) return NextResponse.json({ results: [] });
  try {
    const raw = await searchMulti(q);
    const results = raw
      .filter((r) => r.media_type === "movie" || r.media_type === "tv")
      .slice(0, 24)
      .map((r) => ({
        tmdbId: r.id,
        mediaType: r.media_type as "movie" | "tv",
        title: titleOf(r),
        year: yearOf(r) ?? null,
        posterPath: r.poster_path ?? null,
        overview: r.overview ?? "",
        popularity: r.popularity ?? 0,
      }));
    return NextResponse.json({ results });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message, results: [] },
      { status: 500 },
    );
  }
}
