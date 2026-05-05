import { listByStatus } from "@/lib/queries";
import { TitleCard } from "@/components/title-card";
import { SectionHeader } from "@/components/section-header";
import { CardGrid } from "@/components/card-row";
import { EmptyState } from "@/components/empty-state";

export const dynamic = "force-dynamic";

export default async function WatchlistPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const sp = await searchParams;
  const typeFilter = sp.type === "movie" || sp.type === "tv" ? sp.type : null;

  const all = await listByStatus("watchlist");
  const filtered = typeFilter
    ? all.filter((e) => e.title.mediaType === typeFilter)
    : all;

  const movieCount = all.filter((e) => e.title.mediaType === "movie").length;
  const tvCount = all.filter((e) => e.title.mediaType === "tv").length;

  return (
    <div className="mx-auto max-w-7xl px-6 py-14">
      <SectionHeader
        title="Watchlist"
        subtitle={`${all.length} titles queued up`}
        action={
          <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] p-1 text-xs">
            <FilterChip href="/watchlist" active={!typeFilter} label={`All ${all.length}`} />
            <FilterChip href="/watchlist?type=movie" active={typeFilter === "movie"} label={`Movies ${movieCount}`} />
            <FilterChip href="/watchlist?type=tv" active={typeFilter === "tv"} label={`Shows ${tvCount}`} />
          </div>
        }
      />

      {filtered.length ? (
        <CardGrid>
          {filtered.map((e, i) => (
            <TitleCard
              key={e.id}
              tmdbId={e.title.tmdbId}
              mediaType={e.title.mediaType as "movie" | "tv"}
              title={e.title.title}
              year={e.title.year}
              posterPath={e.title.posterPath}
              style={{ animationDelay: `${i * 20}ms` }}
            />
          ))}
        </CardGrid>
      ) : (
        <EmptyState
          title="Nothing queued yet"
          description="Search TMDB and add titles to your watchlist."
          actionLabel="Search titles"
          actionHref="/search"
        />
      )}
    </div>
  );
}

function FilterChip({
  href,
  active,
  label,
}: {
  href: string;
  active: boolean;
  label: string;
}) {
  return (
    <a
      href={href}
      className={
        "inline-flex items-center rounded-full px-3 py-1.5 uppercase tracking-widest transition-colors " +
        (active
          ? "bg-amber text-ink-950"
          : "text-ink-300 hover:text-white hover:bg-white/5")
      }
    >
      {label}
    </a>
  );
}
