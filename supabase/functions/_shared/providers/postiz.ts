import type {
  MetricsResult,
  PublishJob,
  PublishOutcome,
  PublishProvider,
  ProviderSecrets,
} from "./types.ts";

/**
 * Postiz adapter — self-hosted (postiz.thespyagency.com), sole posting
 * provider at launch.
 *
 * Postiz concepts mapped to our model:
 *   publish_jobs row      → one Postiz "post" (one entry per channel)
 *   social_accounts.external_ref → Postiz channel id (agents connect their
 *     social accounts on the Postiz instance; we store the channel id)
 *   publish_results.metrics      ← Postiz post analytics (per-post endpoint)
 *
 * NOTE: confirm request/response field names against your instance's API
 * docs — Postiz serves Swagger at https://postiz.thespyagency.com/api/docs.
 * Only this file changes when you verify.
 */
export class PostizProvider implements PublishProvider {
  readonly name = "postiz";

  private static readonly PLATFORMS = new Set([
    "instagram",
    "facebook",
    "linkedin",
    "tiktok",
    "youtube",
  ]);

  supports(platform: string): boolean {
    return PostizProvider.PLATFORMS.has(platform);
  }

  async publish(
    job: PublishJob,
    channelId: string,
    secrets: ProviderSecrets
  ): Promise<PublishOutcome> {
    const base = secrets.base_url ?? "http://localhost:4007/api";
    const scheduled = new Date(job.scheduled_for);
    const body = {
      // Postiz "schedule" type when the job is due later than now,
      // otherwise immediate "post".
      type: scheduled.getTime() > Date.now() ? "schedule" : "post",
      date: scheduled.toISOString(),
      shortLink: false,
      posts: [
        {
          channelId,
          content: [job.payload.headline, job.payload.caption]
            .filter(Boolean)
            .join("\n\n"),
          imageURL: job.payload.media_urls[0],
          // Postiz appends tracking via settings; we keep our own
          // per-agent attribution link in the caption when present.
          ...(job.payload.tracking_url
            ? { link: job.payload.tracking_url }
            : {}),
        },
      ],
    };

    let res: Response;
    try {
      res = await fetch(`${base}/public/v1/posts`, {
        method: "POST",
        headers: {
          Authorization: secrets.api_key, // Postiz user API key (no Bearer prefix)
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
    } catch (e) {
      return { ok: false, retryable: true, error: `network: ${e}` };
    }

    if (res.status === 429 || res.status >= 500) {
      return { ok: false, retryable: true, error: `postiz ${res.status}` };
    }
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      return { ok: false, retryable: false, error: `postiz ${res.status}: ${detail.slice(0, 300)}` };
    }

    const data = await res.json().catch(() => ({}));
    // Postiz returns the created post id (or an array of entry ids)
    const entry = Array.isArray(data) ? data[0] : data;
    return {
      ok: true,
      provider_post_id: entry?.id ?? entry?.postId,
      permalink: entry?.url ?? entry?.postURL,
    };
  }

  /**
   * Per-post analytics. Verify the analytics endpoint on your instance
   * (/api/docs) — if the self-hosted API does not expose per-post metrics,
   * return { ok: false, retryable: false } here and the collector skips
   * gracefully; the leaderboard then waits for that Postiz feature/PR.
   */
  async collectMetrics(
    providerPostId: string,
    _platform: string,
    secrets: ProviderSecrets
  ): Promise<MetricsResult> {
    const base = secrets.base_url ?? "http://localhost:4007/api";
    let res: Response;
    try {
      res = await fetch(`${base}/public/v1/posts/${providerPostId}/analytics`, {
        headers: { Authorization: secrets.api_key },
      });
    } catch (e) {
      return { ok: false, retryable: true, error: `network: ${e}` };
    }

    if (res.status === 404) {
      return { ok: false, retryable: false, error: "analytics not available" };
    }
    if (res.status === 429 || res.status >= 500) {
      return { ok: false, retryable: true, error: `postiz ${res.status}` };
    }
    if (!res.ok) {
      return { ok: false, retryable: false, error: `postiz ${res.status}` };
    }

    const data = await res.json().catch(() => ({}));
    const m = data.metrics ?? data;
    return {
      ok: true,
      metrics: {
        views: m.impressions ?? m.views ?? m.reach,
        likes: m.likes ?? m.reactions,
        comments: m.comments,
        shares: m.shares ?? m.reposts,
        saves: m.saves ?? m.bookmarks,
      },
    };
  }
}
