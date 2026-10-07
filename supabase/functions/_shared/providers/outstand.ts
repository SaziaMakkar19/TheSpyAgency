import type { PublishJob, PublishOutcome, PublishProvider, ProviderSecrets } from "./types.ts";

/**
 * Outstand adapter — usage-based publishing, unlimited connected accounts.
 *
 * NOTE: confirm the exact endpoint shape and field names against the
 * Outstand API docs before going live; the path/fields below are the
 * conventional shape and are isolated here so only this file changes.
 */
export class OutstandProvider implements PublishProvider {
  readonly name = "outstand";

  private static readonly PLATFORMS = new Set([
    "instagram",
    "facebook",
    "tiktok",
    "linkedin",
    "youtube",
    "threads",
    "pinterest",
    "bluesky",
  ]);

  supports(platform: string): boolean {
    return OutstandProvider.PLATFORMS.has(platform);
  }

  async publish(
    job: PublishJob,
    accountRef: string,
    secrets: ProviderSecrets
  ): Promise<PublishOutcome> {
    const base = secrets.base_url ?? "https://api.outstand.so/v1";
    const body = {
      account: accountRef,                     // social_accounts.external_ref
      platform: job.platform,
      text: [job.payload.headline, job.payload.caption]
        .filter(Boolean)
        .join("\n\n"),
      media: job.payload.media_urls,
      link: job.payload.tracking_url,
      alt_text: job.payload.alt_text,
      // Outstand schedules natively; we dispatch at scheduled_for ourselves,
      // but passing it through keeps timing honest if we ever hand off scheduling.
      scheduled_at: job.scheduled_for,
    };

    let res: Response;
    try {
      res = await fetch(`${base}/posts`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secrets.api_key}`,
          "Content-Type": "application/json",
          "Idempotency-Key": job.id,           // provider-side duplicate guard
        },
        body: JSON.stringify(body),
      });
    } catch (e) {
      return { ok: false, retryable: true, error: `network: ${e}` };
    }

    if (res.status === 429 || res.status >= 500) {
      return { ok: false, retryable: true, error: `outstand ${res.status}` };
    }
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      return { ok: false, retryable: false, error: `outstand ${res.status}: ${detail.slice(0, 300)}` };
    }

    const data = await res.json().catch(() => ({}));
    return {
      ok: true,
      provider_post_id: data.id ?? data.post_id,
      permalink: data.url ?? data.permalink,
    };
  }

  /**
   * Fetch per-post metrics. Confirm the analytics endpoint shape against
   * the Outstand docs — field names below follow the common convention
   * (impressions/reach → views, engagement buckets).
   */
  async collectMetrics(
    providerPostId: string,
    _platform: string,
    secrets: ProviderSecrets
  ): Promise<import("./types.ts").MetricsResult> {
    const base = secrets.base_url ?? "https://api.outstand.so/v1";
    let res: Response;
    try {
      res = await fetch(`${base}/posts/${providerPostId}/analytics`, {
        headers: { Authorization: `Bearer ${secrets.api_key}` },
      });
    } catch (e) {
      return { ok: false, retryable: true, error: `network: ${e}` };
    }

    if (res.status === 429 || res.status >= 500) {
      return { ok: false, retryable: true, error: `outstand ${res.status}` };
    }
    if (!res.ok) {
      return { ok: false, retryable: res.status === 404, error: `outstand ${res.status}` };
    }

    const data = await res.json().catch(() => ({}));
    const m = data.metrics ?? data;
    return {
      ok: true,
      metrics: {
        views: m.impressions ?? m.views ?? m.reach,
        likes: m.likes,
        comments: m.comments,
        shares: m.shares ?? m.retweets,
        saves: m.saves ?? m.bookmarks,
      },
    };
  }
}
