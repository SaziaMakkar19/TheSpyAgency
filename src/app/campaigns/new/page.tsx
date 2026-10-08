import type { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { CampaignForm } from "@/components/campaigns/CampaignForm";
import { getCurrentUser } from "@/lib/supabase/server";
import { getInviteOptions } from "@/lib/data/campaigns";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Open a Co-Op Campaign | The Spy Agency",
  description: "Create a co-op campaign: locked modifier layer, posting window, and directory-based invites.",
};

export const dynamic = "force-dynamic";

export default async function NewCampaignPage() {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen bg-lum-void text-lum-on-surface font-body">
      <Navbar />

      <main className="max-w-3xl mx-auto px-6 pt-28 pb-16">
        <div className="mb-8 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-lum-primary-bright">
            The Spy Agency / Co-Ops / New
          </p>
          <h1 className="font-jakarta text-3xl sm:text-4xl font-extrabold tracking-tight text-lum-text-primary">
            Open a Co-Op Campaign
          </h1>
          <p className="max-w-2xl text-sm text-lum-text-muted">
            Your listing, amplified by the network — each joining agent renders a unique variation and
            posts on their own staggered slot.
          </p>
        </div>

        {!user ? (
          <div className="glass-card p-10 text-center space-y-4">
            <p className="text-sm text-lum-text-muted">
              Sign in as a directory-verified agent to open a campaign.
            </p>
            <Link href="/login" className="inline-flex px-5 py-3 rounded-xl lum-gradient-btn text-sm font-semibold">
              Sign In / Register
            </Link>
          </div>
        ) : (
          <CampaignForm inviteOptions={await getInviteOptions()} />
        )}
      </main>

      <Footer />
    </div>
  );
}
