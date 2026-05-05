export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-20">
      <div className="h-10 w-48 animate-pulse rounded bg-white/5" />
      <div className="mt-10 grid grid-cols-2 gap-5 md:grid-cols-4 lg:grid-cols-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="aspect-[2/3] animate-pulse rounded-xl bg-white/[0.04]" />
        ))}
      </div>
    </div>
  );
}
