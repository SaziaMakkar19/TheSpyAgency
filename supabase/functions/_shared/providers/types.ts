// Provider adapter contract for the publish queue.
// A new provider = one new file implementing PublishProvider, plus a line
// in providers/index.ts. The dispatcher never changes.

export interface PublishJobPayload {
  caption: string;
  media_urls: string[];      // Supabase Storage / CDN URLs
  tracking_url?: string;     // per-agent attribution link
  headline?: string;
  alt_text?: string;
}

export interface PublishJob {
  id: string;
  platform: string;          // instagram, facebook, tiktok, linkedin, youtube…
  payload: PublishJobPayload;
  scheduled_for: string;
}

export interface PublishOutcome {
  ok: boolean;
  provider_post_id?: string;
  permalink?: string;
  error?: string;
  retryable?: boolean;       // false → fail the job immediately
}

/** Normalized per-post metrics, stored in publish_results.metrics. */
export interface PostMetrics {
  views?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  saves?: number;
  [key: string]: number | string | undefined;
}

export interface MetricsResult {
  ok: boolean;
  metrics?: PostMetrics;
  error?: string;
  retryable?: boolean;
}

export interface ProviderSecrets {
  api_key: string;
  base_url?: string;
}

export interface PublishProvider {
  readonly name: string;
  /** Whether this adapter can publish to the given platform. */
  supports(platform: string): boolean;
  publish(job: PublishJob, accountRef: string, secrets: ProviderSecrets): Promise<PublishOutcome>;
  /** Fetch per-post metrics for an already-published post. */
  collectMetrics(providerPostId: string, platform: string, secrets: ProviderSecrets): Promise<MetricsResult>;
}
