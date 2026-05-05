"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-6 text-center">
      <div className="mb-4 font-serif text-6xl italic text-crimson">!</div>
      <h1 className="font-serif text-3xl italic text-white">Scene cut short</h1>
      <p className="mt-3 max-w-md text-sm text-ink-300">{error.message}</p>
      <button
        onClick={reset}
        className="mt-6 inline-flex rounded-full bg-amber px-5 py-2 text-sm font-medium text-ink-950 hover:bg-amber-soft"
      >
        Try again
      </button>
    </div>
  );
}
