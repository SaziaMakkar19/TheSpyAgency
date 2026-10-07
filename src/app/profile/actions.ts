"use server";

import { getCurrentUser, getSupabaseServer } from "@/lib/supabase/server";
import { revokeAccount, syncChannelsFromPostiz } from "@/lib/social/channels";
import { revalidatePath } from "next/cache";

export interface ActionResult {
  ok: boolean;
  message: string;
}

/** Re-sync channels from the Postiz instance into social_accounts. */
export async function syncChannelsAction(): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "You must be signed in." };

  try {
    const { added, total } = await syncChannelsFromPostiz(user.id);
    revalidatePath("/profile");
    return {
      ok: true,
      message:
        added > 0
          ? `${added} new channel${added === 1 ? "" : "s"} connected (${total} found in Postiz).`
          : `Up to date — ${total} channel${total === 1 ? "" : "s"} found in Postiz.`,
    };
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : "Sync failed.",
    };
  }
}

/** Soft-revoke a connected account. */
export async function revokeAccountAction(accountId: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "You must be signed in." };

  try {
    await revokeAccount(user.id, accountId);
    revalidatePath("/profile");
    return { ok: true, message: "Account disconnected." };
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : "Disconnect failed.",
    };
  }
}

/** Read-only check used by the page to decide between panel vs sign-in gate. */
export async function getSessionState(): Promise<{ signedIn: boolean; email?: string }> {
  const supabase = await getSupabaseServer();
  if (!supabase) return { signedIn: false };
  const user = await getCurrentUser();
  return { signedIn: Boolean(user), email: user?.email ?? undefined };
}
