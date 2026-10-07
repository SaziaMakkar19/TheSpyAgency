// Supabase Edge Function: publish-dispatcher
//
// Drains the provider-neutral publish_jobs queue:
//   1. Atomically claims due jobs (queued + scheduled_for <= now)
//   2. Routes each to the adapter named by publish_jobs.provider
//   3. On success: status=published + row in publish_results
//      On failure: exponential backoff re-queue, max 5 attempts → failed
//
// Schedule it to run every minute (Supabase Dashboard → Database →
// Cron, or pg_cron calling net.http_post to the function URL with the
// service-role key in Authorization).
//
// Deploy:  supabase functions deploy publish-dispatcher
// Secrets: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OUTSTAND_API_KEY
// Optional: OUTSTAND_BASE_URL (defaults to https://api.outstand.so/v1)

import { createClient } from "jsr:@supabase/supabase-js@2";
import { resolveProvider, secretsFor } from "../_shared/providers/index.ts";

const MAX_ATTEMPTS = 5;
const BATCH_SIZE = 20;

function backoffSeconds(attempts: number): number {
  return Math.min(3600, 60 * 2 ** attempts); // 2m, 4m, 8m, 16m, 32m… capped at 1h
}

Deno.serve(async (req) => {
  // Simple shared-secret gate for cron invocations
  const cronSecret = Deno.env.get("DISPATCHER_CRON_SECRET");
  if (cronSecret && req.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const now = new Date().toISOString();

  // ── 1. Claim due jobs atomically ─────────────────────────────────
  // Two-step: select candidate ids, then conditional UPDATE … WHERE
  // status='queued'. The UPDATE count tells us what we actually claimed,
  // so concurrent dispatcher runs never process the same job.
  const { data: due } = await supabase
    .from("publish_jobs")
    .select("id")
    .eq("status", "queued")
    .lte("scheduled_for", now)
    .order("scheduled_for", { ascending: true })
    .limit(BATCH_SIZE);

  if (!due || due.length === 0) {
    return new Response(JSON.stringify({ claimed: 0 }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const ids = due.map((j) => j.id);
  const { data: claimed, error: claimError } = await supabase
    .from("publish_jobs")
    .update({ status: "dispatched", dispatched_at: now, attempts: 0 }) // attempts incremented below per-job
    .in("id", ids)
    .eq("status", "queued")
    .select("id, user_id, provider, platform, payload, scheduled_for, attempts");

  if (claimError) {
    return new Response(JSON.stringify({ error: claimError.message }), { status: 500 });
  }
  if (!claimed || claimed.length === 0) {
    return new Response(JSON.stringify({ claimed: 0, note: "lost claim race" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  // ── 2. Dispatch each claimed job ─────────────────────────────────
  let published = 0, requeued = 0, failed = 0;

  for (const job of claimed) {
    const attempts = job.attempts + 1;

    // Load the connected account for the provider-side reference
    const { data: account } = await supabase
      .from("social_accounts")
      .select("external_ref, revoked_at")
      .eq("user_id", job.user_id)
      .eq("provider", job.provider)
      .eq("platform", job.platform)
      .is("revoked_at", null)
      .maybeSingle();

    const provider = resolveProvider(job.provider);
    let outcome;

    if (!provider) {
      outcome = { ok: false, retryable: false, error: `unknown provider: ${job.provider}` };
    } else if (!provider.supports(job.platform)) {
      outcome = { ok: false, retryable: false, error: `${job.provider} does not support ${job.platform}` };
    } else if (!account) {
      outcome = { ok: false, retryable: false, error: "no connected social account" };
    } else {
      outcome = await provider.publish(
        {
          id: job.id,
          platform: job.platform,
          payload: job.payload,
          scheduled_for: job.scheduled_for,
        },
        account.external_ref,
        secretsFor(job.provider)
      );
    }

    // ── 3. Record outcome ──────────────────────────────────────────
    if (outcome.ok) {
      await supabase
        .from("publish_jobs")
        .update({ status: "published", published_at: new Date().toISOString(), attempts })
        .eq("id", job.id);
      await supabase.from("publish_results").insert({
        publish_job_id: job.id,
        provider_post_id: outcome.provider_post_id ?? null,
        permalink: outcome.permalink ?? null,
        metrics: {},
      });
      published++;
    } else if (attempts < MAX_ATTEMPTS && outcome.retryable !== false) {
      const retryAt = new Date(Date.now() + backoffSeconds(attempts) * 1000).toISOString();
      await supabase
        .from("publish_jobs")
        .update({ status: "queued", attempts, scheduled_for: retryAt })
        .eq("id", job.id);
      requeued++;
    } else {
      await supabase
        .from("publish_jobs")
        .update({ status: "failed", attempts })
        .eq("id", job.id);
      console.error(`job ${job.id} failed: ${outcome.error}`);
      failed++;
    }
  }

  return new Response(
    JSON.stringify({ claimed: claimed.length, published, requeued, failed }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
});
