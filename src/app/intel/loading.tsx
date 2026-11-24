import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

/**
 * Intel feed loading state — mirrors the page chrome and the masonry
 * layout so first paint never looks broken while dossiers load.
 */

const SKELETON_ASPECTS = [
  "aspect-[4/5]",
  "aspect-square",
  "aspect-video",
  "aspect-[9/16]",
  "aspect-[4/5]",
  "aspect-video",
  "aspect-square",
  "aspect-[4/5]",
];

function SkeletonCard({ aspect }: { aspect: string }) {
  return (
    <div className="mb-5 break-inside-avoid">
      <div className="glass-card overflow-hidden">
        <div className={`${aspect} w-full animate-pulse bg-lum-high/60`} />
        <div className="space-y-2.5 p-4">
          <div className="h-4 w-24 animate-pulse rounded bg-lum-high/60" />
          <div className="h-4 w-full animate-pulse rounded bg-lum-high/60" />
          <div className="h-3 w-2/3 animate-pulse rounded bg-lum-high/40" />
        </div>
      </div>
    </div>
  );
}

export default function IntelLoading() {
  return (
    <div className="min-h-screen bg-lum-void text-lum-on-surface font-body">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 pt-28 pb-16">
        {/* Page header skeleton */}
        <div className="mb-8 space-y-3">
          <div className="h-3 w-40 animate-pulse rounded bg-lum-high/60" />
          <div className="h-9 w-72 max-w-full animate-pulse rounded bg-lum-high/60" />
          <div className="h-4 w-full max-w-xl animate-pulse rounded bg-lum-high/40" />
        </div>

        {/* Toolbar skeleton */}
        <div className="mb-6 space-y-4">
          <div className="h-12 w-full animate-pulse rounded-xl bg-lum-high/40" />
          <div className="flex gap-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-7 w-24 animate-pulse rounded-lg bg-lum-high/40"
              />
            ))}
          </div>
        </div>

        {/* Masonry skeleton cards */}
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-5 [column-fill:_balance]">
          {SKELETON_ASPECTS.map((aspect, i) => (
            <SkeletonCard key={i} aspect={aspect} />
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
