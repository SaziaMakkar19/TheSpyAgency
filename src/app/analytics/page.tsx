import type { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard";
import { getLeaderboard, getSnapshots } from "@/lib/data/analytics";

export const metadata: Metadata = {
  title: "Performance — Co-Op Analytics | The Spy Agency",
  description:
    "Co-op leaderboard and per-post conversion velocity across your viral listing campaigns.",
};

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const [leaderboard, snapshots] = await Promise.all([
    getLeaderboard(),
    getSnapshots(),
  ]);

  return (
    <div className="min-h-screen bg-lum-void text-lum-on-surface font-body">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 pt-28 pb-16">
        <div className="mb-8 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-lum-primary-bright">
            The Spy Agency / Performance Metrics
          </p>
          <h1 className="font-jakarta text-3xl sm:text-4xl font-extrabold tracking-tight text-lum-text-primary">
            Campaign Analytics &amp; Co-Op Attribution
          </h1>
          <p className="max-w-2xl text-sm text-lum-text-muted">
            Which posts are pulling reach, which agents are converting it into
            buyer leads, and how fast each post is moving right now.
          </p>
        </div>

        <AnalyticsDashboard leaderboard={leaderboard} snapshots={snapshots} />
      </main>

      <Footer />
    </div>
  );
}
