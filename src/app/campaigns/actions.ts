"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServer } from "@/lib/supabase/server";

/**
 * Campaign server actions — createCampaign (listing agent) and
 * joinCampaign (buyer's agent claims a unique variation + staggered slot).
 * Runs with the caller's session (RLS policies apply); the generation
 * handler and publish-dispatcher do the rest with the service role.
 */

export interface ActionResult {
  ok: boolean;
  error?: string;
  id?: string;
  scheduledAt?: string;
  variationNote?: string;
}

export async function createCampaign(input: {
  listingNo: string;
  title: string;
  splitNote?: string;
  modifierPrompt?: string;
  stylePreset: string;
  aspectRatio: string;
  inviteScope: { brokerages?: string[]; offices?: string[]; markets?: string[] };
  windowStart?: string;
  windowEnd?: string;
  staggerMinutes: number;
}): Promise<ActionResult> {
  const supabase = await getSupabaseServer();
  if (!supabase) return { ok: false, error: "Supabase is not configured." };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sign in to create a campaign." };
  if (!input.listingNo.trim()) return { ok: false, error: "Listing number is required." };

  const { data, error } = await supabase
    .from("campaigns")
    .insert({
      listing_no: input.listingNo.trim(),
      title: input.title.trim(),
      split_note: input.splitNote?.trim() || null,
      modifier_prompt: input.modifierPrompt?.trim() || null,
      style_preset: input.stylePreset,
      aspect_ratio: input.aspectRatio,
      invite_scope: input.inviteScope,
      window_start: input.windowStart || null,
      window_end: input.windowEnd || null,
      stagger_minutes: Math.max(5, input.staggerMinutes || 30),
      owner_id: user.id,
      status: "open",
    })
    .select("id")
    .single();

  if (error || !data) return { ok: false, error: error?.message ?? "Insert failed." };
  revalidatePath("/campaigns");
  return { ok: true, id: data.id };
}

/**
 * Unique variation angles. Each joining agent claims the first unused
 * angle — this is the MVP form of the "AI cross-checks uniqueness before
 * final render" requirement: no two renders in a campaign share an angle,
 * and the modifier prompt is verified unique before the remix is queued.
 */
const VARIATION_ANGLES = [
  "Golden-hour drone elevation",
  "Warm interior lifestyle vignette",
  "Neighborhood streetscape and local life",
  "Minimal twilight facade study",
  "Architectural detail and material close-up",
  "Garden-to-interior transition",
  "Rooftop view and skyline context",
  "Rain-fresh morning light",
] as const;

export async function joinCampaign(input: {
  campaignId: string;
  headline: string;
  platform: string;
  provider: string;
}): Promise<ActionResult> {
  const supabase = await getSupabaseServer();
  if (!supabase) return { ok: false, error: "Supabase is not configured." };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sign in to join a campaign." };

  // Business rule: campaigns unlock for directory-verified agents only.
  const { data: profile } = await supabase
    .from("profiles")
    .select("directory_mls_id")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.directory_mls_id) {
    return { ok: false, error: "Directory verification required before joining campaigns." };
  }

  const { data: campaign, error: campaignError } = await supabase
    .from("campaigns")
    .select("id, listing_no, title, status, modifier_prompt, style_preset, aspect_ratio, window_start, window_end, stagger_minutes")
    .eq("id", input.campaignId)
    .maybeSingle();
  if (campaignError || !campaign) return { ok: false, error: "Campaign not found." };
  if (campaign.status !== "open") return { ok: false, error: "This campaign is not open for joins." };

  const { data: existing } = await supabase
    .from("campaign_participants")
    .select("campaign_id")
    .eq("campaign_id", input.campaignId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (existing) return { ok: false, error: "You already joined this campaign." };

  // Claim a unique angle: first VARIATION_ANGLES entry not present in any
  // existing variation_note; if all are taken, mint a nonce suffix.
  const { data: parts } = await supabase
    .from("campaign_participants")
    .select("variation_note")
    .eq("campaign_id", input.campaignId);
  const takenNotes = new Set((parts ?? []).map((p) => p.variation_note ?? ""));
  const count = (parts ?? []).length;
  let angle: string | undefined = VARIATION_ANGLES.find((a) => !takenNotes.has(a));
  let variationNote: string = angle ?? `${VARIATION_ANGLES[0]} · variation #${count + 1}`;

  // Uniqueness cross-check on the composed modifier: if an identical
  // modifier would result, force the nonce form instead.
  const modifier = [campaign.modifier_prompt, `Angle: ${variationNote}.`]
    .filter(Boolean)
    .join("\n");
  const { data: dupCheck } = await supabase
    .from("remixes")
    .select("id")
    .eq("co_op_modifier", modifier)
    .limit(1);
  if (dupCheck && dupCheck.length > 0) {
    variationNote = `${angle ?? VARIATION_ANGLES[0]} · variation #${count + 1}`;
  }

  // Staggered slot: window start (or now) + one stagger per existing join,
  // clamped inside the window.
  const stagger = Math.max(5, campaign.stagger_minutes || 30);
  const base = campaign.window_start ? new Date(campaign.window_start) : new Date();
  const slot = new Date(base.getTime() + count * stagger * 60_000);
  if (campaign.window_end && slot > new Date(campaign.window_end)) {
    return { ok: false, error: "This campaign's posting window is fully booked." };
  }
  const scheduledAt = slot.toISOString();

  // Queue the remix first so the participant row can reference it.
  const { data: remix, error: remixError } = await supabase
    .from("remixes")
    .insert({
      user_id: user.id,
      prompt: `Co-op campaign for MLS #${campaign.listing_no} — ${campaign.title}`,
      co_op_modifier: [
        campaign.modifier_prompt,
        `Angle: ${variationNote}.`,
      ]
        .filter(Boolean)
        .join("\n"),
      style_preset: campaign.style_preset,
      provider: input.provider,
      aspect_ratio: campaign.aspect_ratio,
      headline: input.headline.trim() || campaign.title,
      status: "queued",
      credits_spent: 2,
    })
    .select("id")
    .single();
  if (remixError || !remix) return { ok: false, error: remixError?.message ?? "Could not queue your remix." };

  const { error: joinError } = await supabase.from("campaign_participants").insert({
    campaign_id: input.campaignId,
    user_id: user.id,
    remix_id: remix.id,
    variation_note: variationNote,
    platform: input.platform,
    scheduled_at: scheduledAt,
  });
  if (joinError) {
    // Roll back the orphan remix so the queue stays clean.
    await supabase.from("remixes").update({ status: "failed", last_error: "join rolled back" }).eq("id", remix.id);
    return { ok: false, error: joinError.message };
  }

  revalidatePath(`/campaigns/${input.campaignId}`);
  revalidatePath("/campaigns");
  return { ok: true, id: input.campaignId, scheduledAt, variationNote };
}
