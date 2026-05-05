import { listAllEntries } from "@/lib/queries";
import { SectionHeader } from "@/components/section-header";
import { parseGenres } from "@/lib/titles";
import { formatRuntime, BUCKET_LABELS, type Bucket } from "@/lib/utils";
import { EmptyState } from "@/components/empty-state";
import { StatsCharts } from "@/components/stats-charts";

export const dynamic = "force-dynamic";

export default async function StatsPage() {
  const all = await listAllEntries();
  const watched = all.filter((e) => e.status === "watched");

  if (!watched.length) {
    return (
      <div className="px-6 py-20">
        <EmptyState
          title="No stats yet"
          description="Rate a few titles to see your taste profile come to life."
          actionLabel="Library"
          actionHref="/library"
        />
      </div>
    );
  }

  const totalRuntime = watched.reduce(
    (sum, e) => sum + (e.title.runtime ?? 0),
    0,
  );

  const byBucket: Record<Bucket, number> = {
    loved: 0,
    liked: 0,
    meh: 0,
    dnf: 0,
  };
  for (const e of all) {
    if (e.bucket) byBucket[e.bucket as Bucket] += 1;
  }
  const bucketData = (Object.keys(byBucket) as Bucket[]).map((b) => ({
    name: BUCKET_LABELS[b],
    value: byBucket[b],
    bucket: b,
  }));

  const genreCounts = new Map<string, number>();
  for (const e of watched) {
    const gs = parseGenres(e.title.genresJson);
    for (const g of gs) genreCounts.set(g, (genreCounts.get(g) ?? 0) + 1);
  }
  const genreData = [...genreCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, value]) => ({ name, value }));

  const decadeCounts = new Map<string, number>();
  for (const e of watched) {
    if (!e.title.year) continue;
    const dec = `${Math.floor(e.title.year / 10) * 10}s`;
    decadeCounts.set(dec, (decadeCounts.get(dec) ?? 0) + 1);
  }
  const decadeData = [...decadeCounts.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([name, value]) => ({ name, value }));

  const moviesWatched = watched.filter((e) => e.title.mediaType === "movie").length;
  const showsWatched = watched.filter((e) => e.title.mediaType === "tv").length;

  return (
    <div className="mx-auto max-w-6xl px-6 py-14">
      <SectionHeader title="Stats" subtitle="Your cinematic fingerprint" />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatBlock label="Watched" value={watched.length.toString()} />
        <StatBlock label="Movies" value={moviesWatched.toString()} />
        <StatBlock label="Shows" value={showsWatched.toString()} />
        <StatBlock
          label="Runtime"
          value={totalRuntime ? formatRuntime(totalRuntime) : "—"}
          hint="movie minutes only"
        />
      </div>

      <StatsCharts
        bucketData={bucketData}
        genreData={genreData}
        decadeData={decadeData}
      />
    </div>
  );
}

function StatBlock({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
      <div className="text-[11px] uppercase tracking-[0.25em] text-ink-400">
        {label}
      </div>
      <div className="mt-2 font-serif text-4xl italic text-white">{value}</div>
      {hint ? <div className="mt-1 text-xs text-ink-400">{hint}</div> : null}
    </div>
  );
}
