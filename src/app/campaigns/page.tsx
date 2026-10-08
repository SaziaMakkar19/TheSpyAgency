import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { getCurrentUser } from "@/lib/supabase/server";
import { getCampaignBoard } from "@/lib/data/campaigns";

export const metadata: Metadata = {
  title: "Co-Op Campaigns | The Spy Agency",
  description:
    "Listing agents open co-op campaigns; verified agents claim unique variations and post on a staggered timeline.",
};

export const dynamic = "force-dynamic";

const STATUS_STYLE: Record<string, string> = {
  open: "bg-lum-tertiary/15 text-lum-tertiary-bright",
  active: "bg-lum-primary/15 text-lum-primary-bright",
  closed: "bg-lum-surface-high text-lum-text-muted",
  draft: "bg-lum-surface-high text-lum-text-muted",
};

export default async function CampaignsPage() {
  const user = await getCurrentUser();
  const { mine, open, joinedIds } = await getCampaignBoard(user?.id ?? null);

  return (
    <div className="min-h-screen bg-lum-void text-lum-on-surface font-body">
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 pt-28 pb-16">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-lum-primary-bright">
              The Spy Agency / Co-Ops
            </p>
            <h1 className="font-jakarta text-3xl sm:text-4xl font-extrabold tracking-tight text-lum-text-primary">
              Co-Op Campaigns
            </h1>
            <p className="max-w-2xl text-sm text-lum-text-muted">
              Listing agents open a campaign and invite the network. Verified agents claim a unique
              variation and a staggered posting slot — one listing, many voices, no duplicate posts.
            </p>
          </div>
          {user && (
            <Link
              href="/campaigns/new"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl lum-gradient-btn text-sm font-semibold"
            >
              + Open a Campaign
            </Link>
          )}
        </div>

        {!user && (
          <div className="glass-card p-6 mb-8 text-center space-y-3">
            <p className="text-sm text-lum-text-muted">
              Browse the open co-ops below — sign in to join one or open your own.
            </p>
            <Link href="/login" className="inline-flex px-5 py-2.5 rounded-xl lum-gradient-btn text-sm font-semibold">
              Sign In / Register
            </Link>
          </div>
        )}

        {/* My campaigns */}
        {user && (
          <section className="mb-10">
            <h2 className="font-jakarta text-lg font-bold text-lum-text-primary mb-4">Your Campaigns</h2>
            {mine.length === 0 ? (
              <div className="glass-card p-8 text-center text-sm text-lum-text-muted">
                You haven&apos;t opened a campaign yet — your active listing can be here in two minutes.
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {mine.map((c) => (
                  <Link key={c.id} href={`/campaigns/${c.id}`} className="glass-card p-5 space-y-3 hover:border-lum-border-glow transition-all block">
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${STATUS_STYLE[c.status]}`}>
                        {c.status}
                      </span>
                      <span className="text-[11px] text-lum-text-muted">{c.participantCount} joined</span>
                    </div>
                    <h3 className="font-jakarta text-[15px] font-semibold text-lum-text-primary leading-snug">
                      {c.title}
                    </h3>
                    <p className="text-[11px] text-lum-text-muted">
                      MLS #{c.listingNo}
                      {c.windowStart && ` · opens ${new Date(c.windowStart).toLocaleDateString()}`}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Open co-ops */}
        <section>
          <h2 className="font-jakarta text-lg font-bold text-lum-text-primary mb-4">Open Co-Ops To Join</h2>
          {open.length === 0 ? (
            <div className="glass-card p-8 text-center text-sm text-lum-text-muted">
              No open campaigns right now — the network is warming up.
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {open.map((c) => (
                <div key={c.id} className="glass-card p-5 space-y-3 hover:border-lum-border-glow transition-all">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-lum-tertiary/15 text-lum-tertiary-bright">
                      Open
                    </span>
                    <span className="text-[11px] text-lum-text-muted">{c.participantCount} joined</span>
                  </div>
                  <h3 className="font-jakarta text-[15px] font-semibold text-lum-text-primary leading-snug">
                    {c.title}
                  </h3>
                  <p className="text-[11px] text-lum-text-muted">
                    MLS #{c.listingNo}
                    {c.splitNote ? ` · ${c.splitNote}` : ""}
                    {c.windowStart && ` · opens ${new Date(c.windowStart).toLocaleDateString()}`}
                  </p>
                  {c.inviteScope.brokerages?.length ? (
                    <p className="text-[11px] text-lum-text-muted truncate">
                      Invited: {c.inviteScope.brokerages.slice(0, 2).join(", ")}
                      {c.inviteScope.brokerages.length > 2 ? ` +${c.inviteScope.brokerages.length - 2}` : ""}
                    </p>
                  ) : null}
                  {joinedIds.has(c.id) ? (
                    <span className="inline-block px-3 py-1.5 rounded-lg text-xs font-semibold bg-lum-tertiary/15 text-lum-tertiary-bright">
                      ✓ Joined
                    </span>
                  ) : (
                    <Link href={`/campaigns/${c.id}`} className="inline-block px-4 py-2 rounded-lg lum-gradient-btn text-xs font-semibold">
                      View & Join
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
