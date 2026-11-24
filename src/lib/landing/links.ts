/**
 * Landing links — shareable co-branded page URLs (/l/<token>).
 *
 * One row per link a participant generates. The token is the attribution
 * key: every showing request created through the page is credited to the
 * link's owner — never to the listing brokerage (Friday-brief rule).
 *
 * Access pattern:
 *  - create/list: signed-in owner via the cookie session client (RLS:
 *    landing_links_owner_all).
 *  - resolve for the PUBLIC page: service-role admin client (visitors are
 *    anonymous; the page itself is the public surface).
 */
import { randomBytes } from "crypto";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface LandingLink {
  id: string;
  token: string;
  user_id: string;
  listing_no: string;
  campaign_id: string | null;
  clicks: number;
  created_at: string;
}

/** URL-safe 12-char token (nanoid-style, no dependency). */
export function newToken(): string {
  return randomBytes(9).toString("base64url");
}

/** Create a link for the signed-in owner (RLS enforces user_id = auth.uid()). */
export async function createLandingLink(
  supabase: SupabaseClient,
  opts: { userId: string; listingNo: string; campaignId?: string | null },
): Promise<LandingLink> {
  const { data, error } = await supabase
    .from("landing_links")
    .insert({
      token: newToken(),
      user_id: opts.userId,
      listing_no: opts.listingNo,
      campaign_id: opts.campaignId ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data as LandingLink;
}

/** Resolve a token for the public landing page, counting the click. */
export async function resolveLandingLink(token: string): Promise<LandingLink | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("landing_links")
    .select()
    .eq("token", token)
    .single();
  if (error || !data) return null;

  // Best-effort click count — never block the page on it.
  supabase
    .from("landing_links")
    .update({ clicks: (data.clicks ?? 0) + 1 })
    .eq("id", data.id)
    .then(() => {});

  return data as LandingLink;
}
