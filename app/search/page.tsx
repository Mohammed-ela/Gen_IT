import { Suspense } from "react";
import SearchPageClient from "@/components/search/SearchPageClient";

export const dynamic = "force-dynamic";

function SearchPageFallback() {
  return (
    <div className="container-dashboard px-4 sm:px-6 py-6 sm:py-8">
      <div className="mb-6 max-w-3xl">
        <div
          className="h-8 w-64 rounded-lg animate-pulse"
          style={{ backgroundColor: "hsl(var(--surface))" }}
        />
        <div
          className="mt-3 h-4 w-full max-w-2xl rounded-lg animate-pulse"
          style={{ backgroundColor: "hsl(var(--surface))" }}
        />
      </div>
      <div className="grid gap-6 xl:grid-cols-[18rem_minmax(0,1fr)]">
        <div
          className="rounded-2xl border p-4 min-h-[28rem]"
          style={{
            backgroundColor: "hsl(var(--surface))",
            borderColor: "hsl(var(--border-subtle))",
          }}
        />
        <div className="space-y-3 max-w-5xl">
          {[...Array(4)].map((_, index) => (
            <div
              key={index}
              className="h-28 rounded-2xl animate-pulse"
              style={{ backgroundColor: "hsl(var(--surface))" }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchPageFallback />}>
      <SearchPageClient />
    </Suspense>
  );
}
