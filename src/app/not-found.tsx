import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-6 text-center">
      <div className="mb-4 font-serif text-6xl italic text-amber">404</div>
      <h1 className="font-serif text-3xl italic text-white">Reel not found</h1>
      <p className="mt-3 text-ink-300">
        We couldn&apos;t find that title. It may not be in your library yet.
      </p>
      <Link
        href="/search"
        className="mt-6 inline-flex rounded-full bg-amber px-5 py-2 text-sm font-medium text-ink-950 hover:bg-amber-soft"
      >
        Search TMDB
      </Link>
    </div>
  );
}
