/**
 * Participant branding for the participant layer.
 *
 * `ParticipantBrand` is shaped exactly like what agent onboarding will
 * collect: verified identity from `profiles`, plus brand assets (headshot,
 * logo, accent color) uploaded during onboarding and stored in Supabase
 * Storage. The renderer only ever sees this resolved object, so onboarding
 * can later populate the asset fields (and a brand-kit table) without any
 * changes to the render code.
 *
 * Server-only — uses the service-role client.
 */
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export interface ParticipantBrand {
  /** Display name — profiles.full_name (directory-verified at registration). */
  displayName: string;
  /** Participant's own brokerage (may differ from the listing brokerage). */
  brokerage: string | null;
  /** Contact particulars — onboarding collects these; null until provided. */
  phone: string | null;
  email: string | null;
  /** Headshot URL (background-removed at onboarding) — null until uploaded. */
  headshotUrl: string | null;
  /** Brokerage/personal logo URL — null until uploaded. */
  logoUrl: string | null;
  /** Brand accent color (hex). Brand kits are a paid-tier feature; the
   *  default spy-gold applies until onboarding/branding sets one. */
  accentColor: string;
}

export const DEFAULT_ACCENT = "#d4af6a"; // spy-gold

/**
 * Resolve a participant's brand from their profile. Asset fields come back
 * null until the onboarding flow exists — the renderer degrades gracefully
 * (initials monogram instead of headshot, no logo slot).
 */
export async function resolveParticipantBrand(userId: string): Promise<ParticipantBrand | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("full_name, brokerage, license_no")
    .eq("id", userId)
    .single();
  if (error || !profile) return null;

  // Contact email falls back to the auth account until onboarding collects a
  // public-facing one.
  let email: string | null = null;
  try {
    const { data } = await supabase.auth.admin.getUserById(userId);
    email = data.user?.email ?? null;
  } catch {
    email = null;
  }

  return {
    displayName: profile.full_name || "Agent",
    brokerage: profile.brokerage ?? null,
    phone: null,        // onboarding
    email,
    headshotUrl: null,  // onboarding
    logoUrl: null,      // onboarding
    accentColor: DEFAULT_ACCENT,
  };
}
