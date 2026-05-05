import Link from "next/link";
import Image from "next/image";
import { posterUrl } from "@/lib/tmdb";
import { cn, type Bucket } from "@/lib/utils";
import { BucketChip } from "./bucket-chip";
import { Tv, Film } from "lucide-react";

export interface TitleCardProps {
  tmdbId: number;
  mediaType: "movie" | "tv";
  title: string;
  year?: number | null;
  posterPath?: string | null;
  bucket?: Bucket | null;
  reason?: string | null;
  badge?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function TitleCard({
  tmdbId,
  mediaType,
  title,
  year,
  posterPath,
  bucket,
  reason,
  badge,
  className,
  style,
}: TitleCardProps) {
  const href = `/title/${mediaType}/${tmdbId}`;
  const poster = posterUrl(posterPath, "w500");

  return (
    <Link
      href={href}
      className={cn(
        "group relative block shrink-0 animate-fade-up",
        className,
      )}
      style={style}
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-ink-800 ring-1 ring-white/5 transition-all duration-300 group-hover:ring-amber/40 group-hover:-translate-y-1">
        {poster ? (
          <Image
            src={poster}
            alt={title}
            fill
            sizes="(max-width:640px) 40vw, (max-width:1024px) 20vw, 200px"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-ink-400">
            {mediaType === "tv" ? <Tv className="h-8 w-8" /> : <Film className="h-8 w-8" />}
          </div>
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-scrim-bottom opacity-80" />
        {bucket ? (
          <div className="absolute left-2 top-2">
            <BucketChip bucket={bucket} />
          </div>
        ) : null}
        {badge ? (
          <div className="absolute right-2 top-2 rounded-full bg-ink-900/80 px-2 py-0.5 text-[10px] uppercase tracking-widest text-amber-soft">
            {badge}
          </div>
        ) : null}
      </div>
      <div className="mt-3 px-0.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-serif text-lg italic leading-tight text-white line-clamp-2">
            {title}
          </h3>
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-xs text-ink-400">
          {year ? <span>{year}</span> : null}
          <span className="inline-flex items-center gap-1">
            {mediaType === "tv" ? (
              <Tv className="h-3 w-3" />
            ) : (
              <Film className="h-3 w-3" />
            )}
            {mediaType === "tv" ? "Series" : "Film"}
          </span>
        </div>
        {reason ? (
          <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-ink-300">
            {reason}
          </p>
        ) : null}
      </div>
    </Link>
  );
}
