import type { User } from "@supabase/supabase-js";
import { getSupabaseServer } from "@/lib/supabase/server";

export interface VerificationResult {
  status: "verified" | "unverified" | "ambiguous";
  directoryMlsId?: string;
  brokerage?: string;
  market?: string;
  fullName?: string;
}

/**
 * Milestone 2 verification: match the registrant's email against the
 * realtors directory. Shared team inboxes can match several rows, so on
 * multiple hits we disambiguate by full name; if that fails we report
 * 'ambiguous' instead of guessing. Idempotent — safe to run on every
 * profile load.
 */
export async function verifyAgainstDirectory(user: User): Promise<VerificationResult> {
  const supabase = await getSupabaseServer();
  if (!supabase || !user.email) return { status: "unverified" };

  const { data: matches } = await supabase
    .from("realtors")
    .select('"MemberMlsId","MemberFullName","OfficeName","LocalMarket"')
    .ilike('"MemberEmail"', user.email);

  if (!matches || matches.length === 0) return { status: "unverified" };

  let chosen = matches[0];
  if (matches.length > 1) {
    const metaName = (user.user_metadata?.full_name as string | undefined)?.trim().toLowerCase();
    const byName = metaName
      ? matches.filter((m) => (m["MemberFullName"] ?? "").trim().toLowerCase() === metaName)
      : [];
    if (byName.length === 1) {
      chosen = byName[0];
    } else {
      return { status: "ambiguous" };
    }
  }

  // Persist the link (idempotent; profiles row comes from the auth trigger)
  await supabase
    .from("profiles")
    .update({ directory_mls_id: chosen["MemberMlsId"] })
    .eq("id", user.id);

  return {
    status: "verified",
    directoryMlsId: chosen["MemberMlsId"],
    brokerage: chosen["OfficeName"] ?? undefined,
    market: chosen["LocalMarket"] ?? undefined,
    fullName: chosen["MemberFullName"] ?? undefined,
  };
}
