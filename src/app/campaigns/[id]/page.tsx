import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { JoinCampaignCard } from "@/components/campaigns/JoinCampaignCard";
import { getCurrentUser } from "@/lib/supabase/server";
import { getCampaignDetail, getMyChannels } from "@/lib/data/campaigns";

export const metadata: Metadata = {
  title: "Co-Op Campaign | The Spy Agency",
};

export const dynamic = "force-dynamic";

const REMIX_STATUS: Record<string, string> = {
  queued: "Queued",
  rendering: "Rendering",
  published: "Rendered",
  failed: "Failed",
  draft: "Draft",
};

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  const detail = await getCampaignDetail(id);
  if (!detail?.campaign) notFound();

  const { campaign, participants, isOwner, myParticipation } = detail;
  const channels = user ? await getMyChannels(user.id) : [];

  return (
    <div className="min-h-screen bg-lum-void text-lum-on-surface font-body">
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 pt-28 pb-16">
        <nav className="mb-6 flex items-center gap-2 text-xs text-lum-text-muted">
          <Link href="/campaigns" className="hover:text-lum-text-primary transition-colors">
            Co-Ops
          </Link>
          <span>/</span>
          <span className="text-lum-on-surface-variant">MLS #{campaign.listingNo}</span>
        </nav>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Campaign brief */}
          <div className="lg:col-span-3 space-y-5">
            <div className="space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="px-2.5 py-1 rounded-lg text-[11px] font-semibold uppercase tracking-wider bg-lum-tertiary/15 text-lum-tertiary-bright">
                  {campaign.status}
                </span>
                {campaign.splitNote && (
                  <span className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-lum-high text-lum-on-surface-variant">
                    {campaign.splitNote}
                  </span>
                )}
              </div>
              <h1 className="font-jakarta text-3xl font-extrabold tracking-tight text-lum-text-primary">
                {campaign.title}
              </h1>
              <p className="text-sm text-lum-text-muted">
                MLS #{campaign.listingNo} · {campaign.stylePreset} · {campaign.aspectRatio}
                {campaign.windowStart &&
                  ` · window ${new Date(campaign.windowStart).toLocaleString()} → ${
                    campaign.windowEnd ? new Date(campaign.windowEnd).toLocaleString() : "open"
                  }`}
                {` · slot spacing ${campaign.staggerMinutes}m`}
              </p>
            </div>

            {/* Locked layer */}
            {campaign.modifierPrompt && (
              <div className="glass-card p-5 space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-lum-text-muted flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                  Locked Co-Op Layer — identical in every render
                </p>
                <p className="text-sm font-mono text-lum-on-surface-variant whitespace-pre-wrap">
                  {campaign.modifierPrompt}
                </p>
              </div>
            )}

            {/* Participants */}
            <div className="glass-card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-jakarta text-sm font-bold text-lum-text-primary">
                  Participating Agents
                </h2>
                <span className="text-[11px] text-lum-text-muted">{participants.length} claimed</span>
              </div>
              {participants.length === 0 ? (
                <p className="text-xs text-lum-text-muted">
                  No takers yet — the first agent to join claims the prime slot.
                </p>
              ) : (
                <div className="space-y-3">
                  {participants.map((p) => (
                    <div
                      key={p.userId}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-lum-border-glass/60 px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-lum-text-primary truncate">
                          {p.displayName}
                          {p.userId === campaign.ownerId && (
                            <span className="ml-2 px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider bg-lum-primary/15 text-lum-primary-bright">
                              Listing Agent
                            </span>
                          )}
                        </p>
                        <p className="text-[11px] text-lum-text-muted truncate">
                          {p.brokerage ? `${p.brokerage} · ` : ""}
                          {p.variationNote ?? "Variation pending"}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        {p.scheduledAt && (
                          <p className="text-[11px] text-lum-on-surface-variant">
                            {new Date(p.scheduledAt).toLocaleString()}
                          </p>
                        )}
                        <p className="text-[10px] uppercase tracking-wider text-lum-text-muted">
                          {p.remixStatus ? REMIX_STATUS[p.remixStatus] ?? p.remixStatus : p.platform}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Action rail */}
          <div className="lg:col-span-2 space-y-5">
            {isOwner ? (
              <div className="glass-card p-6 space-y-3">
                <h3 className="font-jakarta text-sm font-bold text-lum-text-primary">Your Campaign</h3>
                <p className="text-[11px] text-lum-text-muted">
                  Share this page with office colleagues, local agents, and influencers. Slots fill on a
                  first-come basis and every render cross-checks for uniqueness before final output.
                </p>
                <p className="text-[11px] text-lum-text-muted">
                  Status controls (close the window, mark active) land in the next pass — for now the
                  campaign stays open until its window ends.
                </p>
              </div>
            ) : myParticipation ? (
              <div className="glass-card p-6 space-y-3 text-center">
                <svg className="w-10 h-10 mx-auto fill-lum-tertiary" viewBox="0 0 24 24">
                  <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm-1.2 14.2l-4-4 1.4-1.4 2.6 2.6 5.6-5.6 1.4 1.4-7 7z" />
                </svg>
                <p className="font-jakarta text-sm font-bold text-lum-text-primary">You&apos;re in</p>
                <p className="text-xs text-lum-text-muted">
                  <span className="text-lum-tertiary-bright font-semibold">
                    {myParticipation.variationNote}
                  </span>
                  {myParticipation.scheduledAt && (
                    <> · slot {new Date(myParticipation.scheduledAt).toLocaleString()}</>
                  )}
                </p>
                <p className="text-[11px] text-lum-text-muted">
                  Status: {myParticipation.remixStatus ? REMIX_STATUS[myParticipation.remixStatus] ?? myParticipation.remixStatus : "queued"}
                </p>
              </div>
            ) : campaign.status === "open" ? (
              user ? (
                <JoinCampaignCard
                  campaignId={campaign.id}
                  defaultHeadline={campaign.title}
                  channels={channels}
                />
              ) : (
                <div className="glass-card p-6 space-y-3 text-center">
                  <p className="text-sm text-lum-text-muted">
                    Sign in as a directory-verified agent to claim your variation.
                  </p>
                  <Link href="/login" className="inline-flex px-5 py-2.5 rounded-xl lum-gradient-btn text-sm font-semibold">
                    Sign In / Register
                  </Link>
                </div>
              )
            ) : (
              <div className="glass-card p-6 text-center">
                <p className="text-sm text-lum-text-muted">This campaign is {campaign.status}.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
