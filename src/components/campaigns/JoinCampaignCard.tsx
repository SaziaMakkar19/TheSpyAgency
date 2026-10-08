"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ModelProviderSelector } from "@/components/studio/ModelProviderSelector";
import { DEFAULT_GENERATION_PROVIDER } from "@/lib/generation/providers";
import { joinCampaign } from "@/app/campaigns/actions";

interface JoinCampaignCardProps {
  campaignId: string;
  defaultHeadline: string;
  channels: { platform: string; label: string }[];
}

/**
 * JoinCampaignCard — buyer's agent claims their variation slot.
 * Picks a headline (their editable layer), the connected channel the
 * render will publish to, and the AI model. The server assigns the
 * unique angle + staggered slot and queues the remix.
 */
export function JoinCampaignCard({ campaignId, defaultHeadline, channels }: JoinCampaignCardProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [headline, setHeadline] = useState(defaultHeadline);
  const [platform, setPlatform] = useState(channels[0]?.platform ?? "instagram");
  const [provider, setProvider] = useState(DEFAULT_GENERATION_PROVIDER);
  const [error, setError] = useState<string | null>(null);
  const [joined, setJoined] = useState<{ scheduledAt: string; variationNote: string } | null>(null);

  const submit = () => {
    setError(null);
    startTransition(async () => {
      const result = await joinCampaign({ campaignId, headline, platform, provider });
      if (result.ok && result.scheduledAt && result.variationNote) {
        setJoined({ scheduledAt: result.scheduledAt, variationNote: result.variationNote });
        router.refresh();
      } else {
        setError(result.error ?? "Could not join the campaign.");
      }
    });
  };

  if (joined) {
    return (
      <div className="glass-card p-6 space-y-3 text-center">
        <svg className="w-10 h-10 mx-auto fill-lum-tertiary" viewBox="0 0 24 24">
          <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm-1.2 14.2l-4-4 1.4-1.4 2.6 2.6 5.6-5.6 1.4 1.4-7 7z" />
        </svg>
        <p className="font-jakarta text-sm font-bold text-lum-text-primary">Variation claimed</p>
        <p className="text-xs text-lum-text-muted">
          <span className="text-lum-tertiary-bright font-semibold">{joined.variationNote}</span>
          {" · "}Slot: {new Date(joined.scheduledAt).toLocaleString()}
        </p>
        <p className="text-[11px] text-lum-text-muted">
          Your remix is queued — the generation handler renders it, then it publishes to your connected
          channel at your slot.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card p-6 space-y-4">
      <h3 className="font-jakarta text-sm font-bold text-lum-text-primary">Join This Co-Op</h3>
      <p className="text-[11px] text-lum-text-muted">
        Claim a unique variation angle and a staggered posting slot. The listing agent&apos;s locked layer
        ships in every render; your headline and angle make it yours.
      </p>

      <label className="block space-y-1.5">
        <span className="text-xs font-semibold uppercase tracking-[0.08em] text-lum-on-surface-variant">Your Headline (editable layer)</span>
        <input
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
          className="w-full rounded-xl bg-lum-surface-high/60 border border-lum-border-glass px-3 py-2.5 text-sm text-lum-text-primary focus:outline-none focus:ring-2 focus:ring-lum-primary/40"
        />
      </label>

      <label className="block space-y-1.5">
        <span className="text-xs font-semibold uppercase tracking-[0.08em] text-lum-on-surface-variant">Publish To</span>
        {channels.length === 0 ? (
          <p className="text-[11px] text-lum-error">
            No connected channels yet — sync a social account from Head Quarters first.
          </p>
        ) : (
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            className="w-full rounded-xl bg-lum-surface-high/60 border border-lum-border-glass px-3 py-2.5 text-sm text-lum-text-primary focus:outline-none focus:ring-2 focus:ring-lum-primary/40"
          >
            {channels.map((c) => (
              <option key={c.platform} value={c.platform}>{c.label}</option>
            ))}
          </select>
        )}
      </label>

      <ModelProviderSelector selected={provider} onChange={setProvider} />

      <button
        onClick={submit}
        disabled={pending || channels.length === 0}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl lum-gradient-btn text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {pending ? "Claiming your variation…" : "Join & Claim Variation"}
      </button>
      {error && <p className="text-xs text-lum-error text-center">{error}</p>}
    </div>
  );
}
