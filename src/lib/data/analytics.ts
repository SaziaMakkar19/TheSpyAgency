import { getSupabaseBrowser } from "@/lib/supabase/client";

/** One row per agent on the co-op leaderboard. */
export interface LeaderboardEntry {
  agentName: string;
  brokerage: string;
  posts: number;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  attributedLeads: number; // click-throughs on per-agent tracking URLs
  score: number;
}

/** One metrics snapshot for a published post (a publish_results row). */
export interface MetricsSnapshot {
  publishJobId: string;
  postLabel: string;
  collectedAt: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
}

/** Consecutive-snapshot deltas — the "Conversion Velocity" series. */
export interface VelocityPoint {
  collectedAt: string;
  viewsDelta: number;
  likesDelta: number;
  sharesDelta: number;
}

// ── Seed standings — stand in until publish_results has real snapshots ──

export const SEED_LEADERBOARD: LeaderboardEntry[] = [
  { agentName: "Elena Vance", brokerage: "The Agency • Beverly Hills Estates", posts: 6, views: 41230, likes: 3210, comments: 184, shares: 412, attributedLeads: 23, score: 94 },
  { agentName: "Marcus Sterling", brokerage: "Sterling Luxury Group", posts: 5, views: 33780, likes: 2544, comments: 141, shares: 365, attributedLeads: 19, score: 87 },
  { agentName: "Priya Nair", brokerage: "Royal LePage Sussex", posts: 4, views: 28910, likes: 2102, comments: 128, shares: 290, attributedLeads: 17, score: 81 },
  { agentName: "Lena Kowalski", brokerage: "eXp Realty", posts: 4, views: 24150, likes: 1876, comments: 97, shares: 248, attributedLeads: 14, score: 74 },
  { agentName: "David Chang", brokerage: "rennie • Downtown", posts: 3, views: 18220, likes: 1340, comments: 88, shares: 176, attributedLeads: 11, score: 66 },
  { agentName: "Sofia Marchetti", brokerage: "Macdonald Realty", posts: 3, views: 12480, likes: 890, comments: 52, shares: 118, attributedLeads: 8, score: 54 },
  { agentName: "James Okafor", brokerage: "Sutton Group", posts: 2, views: 8430, likes: 512, comments: 31, shares: 64, attributedLeads: 5, score: 41 },
];

const T0 = Date.now() - 5 * 3600_000;
const seedSnapshots = (jobId: string, label: string, baseViews: number, growth: number): MetricsSnapshot[] =>
  Array.from({ length: 6 }, (_, i) => ({
    publishJobId: jobId,
    postLabel: label,
    collectedAt: new Date(T0 + i * 3600_000).toISOString(),
    views: Math.round(baseViews * (1 + growth * i)),
    likes: Math.round(baseViews * 0.08 * (1 + growth * 1.4 * i)),
    comments: Math.round(baseViews * 0.008 * (1 + growth * i)),
    shares: Math.round(baseViews * 0.015 * (1 + growth * 1.2 * i)),
  }));

export const SEED_SNAPSHOTS: MetricsSnapshot[] = [
  ...seedSnapshots("job-spy-91823-ig", "OFF-MARKET BEL AIR TROPHY RESIDENCE", 5200, 0.42),
  ...seedSnapshots("job-spy-88710-ig", "DRONE ASCENT — OCEANFRONT COMPOUND", 3100, 0.35),
  ...seedSnapshots("job-spy-22031-ig", "SKY SUITE PENTHOUSE — BLUE HOUR", 1800, 0.28),
];

// ── Supabase-backed readers (fall back to seed when unconfigured) ──

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  const supabase = getSupabaseBrowser();
  if (!supabase) return SEED_LEADERBOARD;

  // Aggregate the latest snapshot per job, rolled up per agent.
  const { data, error } = await supabase
    .from("publish_results")
    .select("metrics, publish_jobs!inner(user_id, status)")
    .eq("publish_jobs.status", "published")
    .order("collected_at", { ascending: false })
    .limit(500);

  if (error || !data || data.length === 0) return SEED_LEADERBOARD;

  // Latest snapshot per job (rows arrive newest-first)
  const latestByJob = new Map<string, { userId: string; metrics: Record<string, number> }>();
  for (const row of data) {
    const jobId = (row.publish_jobs as { user_id?: string }).user_id ?? "unknown";
    if (latestByJob.has(jobId)) continue;
    latestByJob.set(jobId, {
      userId: jobId,
      metrics: (row.metrics as Record<string, number>) ?? {},
    });
  }

  // Resolve agent identities
  const userIds = [...new Set([...latestByJob.values()].map((v) => v.userId))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, brokerage")
    .in("id", userIds);

  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));
  const totals = new Map<string, LeaderboardEntry>();

  for (const { userId, metrics } of latestByJob.values()) {
    const p = profileById.get(userId);
    const name = p?.full_name ?? "Unknown Agent";
    const existing = totals.get(userId) ?? {
      agentName: name,
      brokerage: p?.brokerage ?? "",
      posts: 0,
      views: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      attributedLeads: 0,
      score: 0,
    };
    existing.posts += 1;
    existing.views += metrics.views ?? 0;
    existing.likes += metrics.likes ?? 0;
    existing.comments += metrics.comments ?? 0;
    existing.shares += metrics.shares ?? 0;
    totals.set(userId, existing);
  }

  const entries = [...totals.values()].map((e) => ({
    ...e,
    // Reach-weighted composite: views 50%, engagement 30%, leads 20%
    score: Math.round(
      Math.min(100, (e.views / 500) * 0.5 + ((e.likes + e.comments * 3 + e.shares * 4) / 50) * 0.3 + e.attributedLeads * 2 * 0.2)
    ),
  }));

  return entries.sort((a, b) => b.score - a.score);
}

export async function getSnapshots(): Promise<MetricsSnapshot[]> {
  const supabase = getSupabaseBrowser();
  if (!supabase) return SEED_SNAPSHOTS;

  const { data, error } = await supabase
    .from("publish_results")
    .select("publish_job_id, metrics, collected_at")
    .eq("publish_jobs.status", "published")
    .order("collected_at", { ascending: true })
    .limit(1000);

  if (error || !data || data.length === 0) return SEED_SNAPSHOTS;

  return data.map((row) => ({
    publishJobId: row.publish_job_id,
    postLabel: row.publish_job_id, // swap for post title via join when posts ↔ jobs link is added
    collectedAt: row.collected_at,
    views: row.metrics?.views ?? 0,
    likes: row.metrics?.likes ?? 0,
    comments: row.metrics?.comments ?? 0,
    shares: row.metrics?.shares ?? 0,
  }));
}

/** Diff consecutive snapshots into velocity points. */
export function computeVelocity(snapshots: MetricsSnapshot[]): VelocityPoint[] {
  return snapshots.slice(1).map((snap, i) => ({
    collectedAt: snap.collectedAt,
    viewsDelta: Math.max(0, snap.views - snapshots[i].views),
    likesDelta: Math.max(0, snap.likes - snapshots[i].likes),
    sharesDelta: Math.max(0, snap.shares - snapshots[i].shares),
  }));
}
