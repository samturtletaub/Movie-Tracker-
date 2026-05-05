import Image from "next/image";
import { backdropUrl } from "@/lib/tmdb";
import { cn } from "@/lib/utils";

export function BackdropHero({
  backdropPath,
  title,
  year,
  tagline,
  children,
  height = "tall",
  className,
}: {
  backdropPath?: string | null;
  title: string;
  year?: number | null;
  tagline?: string | null;
  children?: React.ReactNode;
  height?: "short" | "tall";
  className?: string;
}) {
  const src = backdropUrl(backdropPath, "original");
  return (
    <section
      className={cn(
        "relative w-full overflow-hidden",
        height === "tall" ? "h-[72vh] min-h-[520px]" : "h-[46vh] min-h-[360px]",
        className,
      )}
    >
      {src ? (
        <Image
          src={src}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center opacity-75"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-ink-800 via-ink-900 to-ink-950" />
      )}
      <div className="pointer-events-none absolute inset-0 bg-scrim-bottom" />
      <div className="pointer-events-none absolute inset-0 bg-scrim-left" />

      <div className="relative z-10 flex h-full flex-col justify-end px-6 pb-12 md:px-16 md:pb-16">
        <div className="max-w-3xl animate-fade-up">
          <div className="mb-3 text-[11px] uppercase tracking-[0.3em] text-amber-soft/80">
            {year ? year : "Featured"}
          </div>
          <h1 className="font-serif text-5xl italic leading-[1.05] text-white md:text-7xl">
            {title}
          </h1>
          {tagline ? (
            <p className="mt-4 max-w-2xl text-base text-ink-200 md:text-lg">
              {tagline}
            </p>
          ) : null}
          {children ? <div className="mt-6">{children}</div> : null}
        </div>
      </div>
    </section>
  );
}
