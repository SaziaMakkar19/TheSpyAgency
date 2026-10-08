import { getSupabaseServer } from "@/lib/supabase/server";

/**
 * Campaign data layer — server-side reads for the Co-Ops screens.
 * Shapes match the Milestone 4 campaigns tables in supabase/schema.sql.
 */

export interface CampaignInviteScope {
  brokerages?: string[];
  offices?: string[];
  markets?: string[];
}

export interface Campaign {
  id: string;
  listingNo: string;
  title: string;
  status: "draft" | "open" | "active" | "closed";
  splitNote?: string;
  modifierPrompt?: string;
  stylePreset: string;
  aspectRatio: string;
  inviteScope: CampaignInviteScope;
  windowStart?: string;
  windowEnd?: string;
  staggerMinutes: number;
  ownerId?: string;
  ownerName?: string;
  participantCount: number;
  createdAt: string;
}

export interface CampaignParticipant {
  campaignId: string;
  userId: string;
  scheduledAt?: string;
  variationNote?: string;
  platform: string;
  remixId?: string;
  remixStatus?: string;
  displayName?: string;
  brokerage?: string;
}

export interface InviteOptions {
  brokerages: string[];
  offices: string[];
  markets: string[];
}

function mapCampaign(row: any, participantCount = 0): Campaign {
  return {
    id: row.id,
    listingNo: row.listing_no,
    title: row.title || `MLS #${row.listing_no}`,
    status: row.status,
    splitNote: row.split_note ?? undefined,
    modifierPrompt: row.modifier_prompt ?? undefined,
    stylePreset: row.style_preset,
    aspectRatio: row.aspect_ratio,
    inviteScope: (row.invite_scope ?? {}) as CampaignInviteScope,
    windowStart: row.window_start ?? undefined,
    windowEnd: row.window_end ?? undefined,
    staggerMinutes: row.stagger_minutes ?? 30,
    ownerId: row.owner_id ?? undefined,
    ownerName: row.owner?.full_name || undefined,
    participantCount,
    createdAt: row.created_at,
  };
}

/** Board view: my campaigns + open co-ops I could join. */
export async function getCampaignBoard(userId: string | null): Promise<{
  mine: Campaign[];
  open: Campaign[];
  joinedIds: Set<string>;
}> {
  const supabase = await getSupabaseServer();
  if (!supabase) return { mine: [], open: [], joinedIds: new Set() };

  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("*, owner:profiles!campaigns_owner_id_fkey(full_name)")
    .order("created_at", { ascending: false })
    .limit(100);
  const { data: participants } = await supabase
    .from("campaign_participants")
    .select("campaign_id, user_id");

  const joinedIds = new Set(
    (participants ?? []).filter((p) => p.user_id === userId).map((p) => p.campaign_id)
  );
  const countByCampaign = new Map<string, number>();
  for (const p of participants ?? []) {
    countByCampaign.set(p.campaign_id, (countByCampaign.get(p.campaign_id) ?? 0) + 1);
  }

  const mine: Campaign[] = [];
  const open: Campaign[] = [];
  for (const row of campaigns ?? []) {
    const c = mapCampaign(row, countByCampaign.get(row.id) ?? 0);
    if (userId && row.owner_id === userId) mine.push(c);
    else if (row.status === "open") open.push(c);
  }
  return { mine, open, joinedIds };
}

/** Detail view: one campaign with its participants and remix statuses. */
export async function getCampaignDetail(id: string): Promise<{
  campaign: Campaign | null;
  participants: CampaignParticipant[];
  isOwner: boolean;
  myParticipation: CampaignParticipant | null;
} | null> {
  const supabase = await getSupabaseServer();
  if (!supabase) return null;

  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id ?? null;

  const { data: row } = await supabase
    .from("campaigns")
    .select("*, owner:profiles!campaigns_owner_id_fkey(full_name)")
    .eq("id", id)
    .maybeSingle();
  if (!row) return { campaign: null, participants: [], isOwner: false, myParticipation: null };

  const { data: parts } = await supabase
    .from("campaign_participants")
    .select("campaign_id, user_id, scheduled_at, variation_note, platform, remix_id")
    .eq("campaign_id", id)
    .order("scheduled_at", { ascending: true });

  const remixIds = (parts ?? []).map((p) => p.remix_id).filter(Boolean);
  const { data: remixes } = remixIds.length
    ? await supabase.from("remixes").select("id, status").in("id", remixIds)
    : { data: [] as any[] };
  const statusById = new Map((remixes ?? []).map((r) => [r.id, r.status]));

  // Directory attribution for each participant (name + brokerage).
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, directory_mls_id")
    .in("id", (parts ?? []).map((p) => p.user_id));
  const mlsIds = (profiles ?? []).map((p) => p.directory_mls_id).filter(Boolean);
  const { data: realtors } = mlsIds.length
    ? await supabase
        .from("realtors")
        .select('"MemberMlsId", "MemberFullName", "OfficeName"')
        .in('"MemberMlsId"', mlsIds)
    : { data: [] as any[] };
  const realtorByMls = new Map((realtors ?? []).map((r) => [r.MemberMlsId, r]));

  const participants: CampaignParticipant[] = (parts ?? []).map((p) => {
    const profile = (profiles ?? []).find((pr) => pr.id === p.user_id);
    const realtor = profile?.directory_mls_id
      ? realtorByMls.get(profile.directory_mls_id)
      : undefined;
    return {
      campaignId: p.campaign_id,
      userId: p.user_id,
      scheduledAt: p.scheduled_at ?? undefined,
      variationNote: p.variation_note ?? undefined,
      platform: p.platform,
      remixId: p.remix_id ?? undefined,
      remixStatus: p.remix_id ? statusById.get(p.remix_id) : undefined,
      displayName: realtor?.MemberFullName || profile?.full_name || "Agent",
      brokerage: realtor?.OfficeName ?? undefined,
    };
  });

  const campaign = mapCampaign(row, participants.length);
  const myParticipation = participants.find((p) => p.userId === userId) ?? null;
  return { campaign, participants, isOwner: userId !== null && row.owner_id === userId, myParticipation };
}

/** Distinct invite-scope options from the realtor directory. */
export async function getInviteOptions(): Promise<InviteOptions> {
  const empty = { brokerages: [] as string[], offices: [] as string[], markets: [] as string[] };
  const supabase = await getSupabaseServer();
  if (!supabase) return empty;

  const run = async (column: string) => {
    const { data } = await supabase
      .from("realtors")
      .select(column)
      .not(column, "is", null)
      .limit(2000);
    const rows = (data ?? []) as unknown as Record<string, unknown>[];
    return [...new Set(rows.map((r) => r[column]).filter(Boolean))].sort() as string[];
  };

  return {
    brokerages: await run("OfficeName"),
    offices: await run("OfficeName"),
    markets: await run("LocalMarket"),
  };
}

/** The signed-in agent's connected channels (for the join form's platform pick). */
export async function getMyChannels(userId: string): Promise<{ platform: string; label: string }[]> {
  const supabase = await getSupabaseServer();
  if (!supabase) return [];
  const { data } = await supabase
    .from("social_accounts")
    .select("platform")
    .eq("user_id", userId)
    .is("revoked_at", null)
    .order("platform");
  const seen = new Set<string>();
  return (data ?? []).flatMap((r) => {
    if (seen.has(r.platform)) return [];
    seen.add(r.platform);
    return [{ platform: r.platform, label: r.platform[0].toUpperCase() + r.platform.slice(1) }];
  });
}
