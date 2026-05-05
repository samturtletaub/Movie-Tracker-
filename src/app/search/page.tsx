import { SearchClient } from "./search-client";

export const dynamic = "force-dynamic";

export default function SearchPage() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-14">
      <SearchClient />
    </div>
  );
}
