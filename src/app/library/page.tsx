import { listAllEntries } from "@/lib/queries";
import { TitleCard } from "@/components/title-card";
import { SectionHeader } from "@/components/section-header";
import { CardGrid } from "@/components/card-row";
import { EmptyState } from "@/components/empty-state";
import { BUCKET_LABELS, type Bucket } from "@/lib/utils";
import { BucketChip } from "@/components/bucket-chip";

export const dynamic = "force-dynamic";

const ORDER: Bucket[] = ["loved", "liked", "meh", "dnf"];

export default async function LibraryPage() {
  const all = await listAllEntries();
  const watched = all.filter((e) => e.status !== "watchlist");
  const groups = ORDER.map((b) => ({
    bucket: b,
    items: watched.filter((e) => e.bucket === b),
  }));
  const unbucketed = watched.filter((e) => !e.bucket);

  if (!watched.length) {
    return (
      <div className="px-6 py-20">
        <EmptyState
          title="Nothing rated yet"
          description="When you watch something, rate it Loved / Liked / Meh / DNF and it'll appear here."
          actionLabel="Browse watchlist"
          actionHref="/watchlist"
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-14">
      <SectionHeader
        title="Library"
        subtitle={`${watched.length} watched`}
      />

      {groups.map(({ bucket, items }) =>
        items.length ? (
          <section key={bucket} className="mb-14">
            <div className="mb-5 flex items-baseline gap-4">
              <BucketChip bucket={bucket} size="md" />
              <h3 className="font-serif text-2xl italic text-white">
                {BUCKET_LABELS[bucket]}
              </h3>
              <span className="text-sm text-ink-400">{items.length}</span>
            </div>
            <CardGrid>
              {items.map((e, i) => (
                <TitleCard
                  key={e.id}
                  tmdbId={e.title.tmdbId}
                  mediaType={e.title.mediaType as "movie" | "tv"}
                  title={e.title.title}
                  year={e.title.year}
                  posterPath={e.title.posterPath}
                  bucket={bucket}
                  style={{ animationDelay: `${i * 15}ms` }}
                />
              ))}
            </CardGrid>
          </section>
        ) : null,
      )}

      {unbucketed.length ? (
        <section className="mb-14">
          <h3 className="mb-5 font-serif text-2xl italic text-white">Unrated</h3>
          <CardGrid>
            {unbucketed.map((e) => (
              <TitleCard
                key={e.id}
                tmdbId={e.title.tmdbId}
                mediaType={e.title.mediaType as "movie" | "tv"}
                title={e.title.title}
                year={e.title.year}
                posterPath={e.title.posterPath}
              />
            ))}
          </CardGrid>
        </section>
      ) : null}
    </div>
  );
}
