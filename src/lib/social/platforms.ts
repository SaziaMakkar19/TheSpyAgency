/** Launch platform set — X intentionally excluded (future premium tier). */
export const CONNECTABLE_PLATFORMS = [
  { platform: "instagram", label: "Instagram", hint: "Feed posts, Reels, Stories" },
  { platform: "facebook", label: "Facebook", hint: "Pages and profiles" },
  { platform: "tiktok", label: "TikTok", hint: "Videos via Postiz" },
  { platform: "linkedin", label: "LinkedIn", hint: "Profiles and pages" },
  { platform: "youtube", label: "YouTube", hint: "Shorts and videos" },
] as const;

/** Normalizes Postiz channel types to our platform names. */
export function normalizePlatform(raw: string): string | null {
  const p = raw.toLowerCase();
  if (p.includes("instagram")) return "instagram";
  if (p.includes("facebook")) return "facebook";
  if (p.includes("tiktok")) return "tiktok";
  if (p.includes("linkedin")) return "linkedin";
  if (p.includes("youtube") || p.includes("google")) return "youtube";
  return null;
}

/** Postiz OAuth connect URL for a platform, derived from POSTIZ_BASE_URL. */
export function postizConnectUrl(platform: string): string {
  const base = (
    process.env.POSTIZ_BASE_URL ?? "http://localhost:4007/api"
  ).replace(/\/api\/?$/, "");
  return `${base}/integrations/social/${platform}`;
}
