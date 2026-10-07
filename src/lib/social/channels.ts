import { getSupabaseServer } from "@/lib/supabase/server";
import { normalizePlatform } from "./platforms";

export interface ConnectedAccount {
  id: string;
  platform: string;
  accountLabel: string;
  externalRef: string;
  connectedAt: string;
}

/** Connected (non-revoked) social accounts for a user. */
export async function getConnectedAccounts(
  userId: string
): Promise<ConnectedAccount[]> {
  const supabase = await getSupabaseServer();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("social_accounts")
    .select("id, platform, account_label, external_ref, connected_at")
    .eq("user_id", userId)
    .is("revoked_at", null)
    .order("connected_at", { ascending: false });

  if (error) return [];
  return (data ?? []).map((row) => ({
    id: row.id,
    platform: row.platform,
    accountLabel: row.account_label ?? row.external_ref,
    externalRef: row.external_ref,
    connectedAt: row.connected_at,
  }));
}

/**
 * Pull channels from the Postiz instance (GET /public/v1/channels) and
 * upsert them into social_accounts for this user.
 *
 * Returns { added, total } or throws with a readable message.
 *
 * NOTE: confirm the response shape on your instance
 * (http://localhost:5000/api/docs) — the mapping below tolerates common
 * variants (id/type, id/provider, name/username/label).
 */
export async function syncChannelsFromPostiz(
  userId: string
): Promise<{ added: number; total: number }> {
  const apiKey = process.env.POSTIZ_API_KEY;
  const base = process.env.POSTIZ_BASE_URL ?? "http://localhost:5000/api";
  if (!apiKey) {
    throw new Error("POSTIZ_API_KEY is not set (server-side env).");
  }

  const res = await fetch(`${base}/public/v1/channels`, {
    headers: { Authorization: apiKey },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Postiz channels request failed: ${res.status}`);
  }

  const body = await res.json().catch(() => ({}));
  const channels: unknown[] = Array.isArray(body)
    ? body
    : ((body as { channels?: unknown[] })?.channels ?? []);

  const supabase = await getSupabaseServer();
  if (!supabase) throw new Error("Supabase is not configured.");

  // Existing refs for this user, so sync is idempotent
  const { data: existing } = await supabase
    .from("social_accounts")
    .select("external_ref")
    .eq("user_id", userId)
    .eq("provider", "postiz")
    .is("revoked_at", null);
  const known = new Set((existing ?? []).map((r) => r.external_ref));

  let added = 0;
  for (const raw of channels) {
    const ch = raw as Record<string, unknown>;
    const ref = String(ch.id ?? ch.channelId ?? "");
    const type = String(ch.type ?? ch.provider ?? ch.providerEnum ?? "");
    const platform = normalizePlatform(type);
    if (!ref || !platform || known.has(ref)) continue;

    const label =
      String(ch.name ?? ch.username ?? ch.label ?? ch.displayName ?? "") ||
      `${platform} channel`;

    const { error } = await supabase.from("social_accounts").insert({
      user_id: userId,
      provider: "postiz",
      platform,
      account_label: label,
      external_ref: ref,
    });
    if (!error) added++;
  }

  return { added, total: channels.length };
}

/** Soft-revoke a connected account (campaigns can't target it anymore). */
export async function revokeAccount(
  userId: string,
  accountId: string
): Promise<void> {
  const supabase = await getSupabaseServer();
  if (!supabase) throw new Error("Supabase is not configured.");
  const { error } = await supabase
    .from("social_accounts")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", accountId)
    .eq("user_id", userId); // RLS double-guard
  if (error) throw new Error(error.message);
}
