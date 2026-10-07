// Supabase Edge Function: analytics-collector
//
// Feeds the leaderboard (Milestone 6). For every published job whose latest
// metrics snapshot is older than METRICS_STALE_MINUTES, polls the provider
// and appends a NEW snapshot row to publish_results (append-only time
// series — the "Conversion Velocity" view diffs consecutive snapshots).
//
// Schedule every 30–60 minutes via Supabase cron calling this function
// with the service-role key (same pattern as publish-dispatcher).
//
// Deploy:  supabase functions deploy analytics-collector
// Secrets: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OUTSTAND_API_KEY

import { createClient } from "jsr:@supabase/supabase-js@2";
import { resolveProvider, secretsFor } from "../_shared/providers/index.ts";

const STALE_MS = Number(Deno.env.get("METRICS_STALE_MINUTES") ?? "45") * 60_000;
const BATCH_SIZE = 50;

Deno.serve(async (req) => {
  const cronSecret = Deno.env.get("DISPATCHER_CRON_SECRET");
  if (cronSecret && req.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Latest metrics snapshot per published job (distinct on keeps one row
  // per job — the most recent collected_at).
  const { data: latest, error } = await supabase
    .from("publish_results")
    .select("id, publish_job_id, provider_post_id, collected_at, publish_jobs!inner(provider, platform, status)")
    .eq("publish_jobs.status", "published")
    .not("provider_post_id", "is", null)
    .order("publish_job_id", { ascending: true })
    .order("collected_at", { ascending: false })
    .limit(BATCH_SIZE * 5); // headroom before the staleness filter

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
  if (!latest || latest.length === 0) {
    return new Response(JSON.stringify({ checked: 0 }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  // De-dupe to one row per job (query ordering guarantees row 0 is latest)
  const seen = new Set<string>();
  const stale = latest.filter((row) => {
    if (seen.has(row.publish_job_id)) return false;
    seen.add(row.publish_job_id);
    return Date.now() - new Date(row.collected_at).getTime() > STALE_MS;
  }).slice(0, BATCH_SIZE);

  let updated = 0, skipped = 0, errors = 0;

  for (const row of stale) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const job = (row as any).publish_jobs;
    const provider = resolveProvider(job.provider);
    if (!provider) { skipped++; continue; }

    const outcome = await provider.collectMetrics(row.provider_post_id, job.platform, secretsFor(job.provider));
    if (!outcome.ok || !outcome.metrics) {
      errors++; // transient failures simply wait for the next collection pass
      continue;
    }

    // Append-only snapshot — leaderboard queries take the latest row per job
    const { error: insertError } = await supabase.from("publish_results").insert({
      publish_job_id: row.publish_job_id,
      provider_post_id: row.provider_post_id,
      metrics: outcome.metrics,
    });
    if (insertError) { errors++; continue; }
    updated++;
  }

  return new Response(
    JSON.stringify({ checked: stale.length, updated, skipped, errors }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
});
