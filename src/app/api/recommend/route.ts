import { NextResponse } from "next/server";
import { getRecommendations } from "@/lib/recommend";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const refresh = searchParams.get("refresh") === "1";
  try {
    const { recs, source } = await getRecommendations({ refresh });
    return NextResponse.json({ recs, source });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message, recs: [] },
      { status: 500 },
    );
  }
}
