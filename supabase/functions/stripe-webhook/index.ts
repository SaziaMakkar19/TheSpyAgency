// Supabase Edge Function: stripe-webhook
//
// Handles the two billing events behind the subscription + top-up model:
//   invoice.paid          → grant the plan's monthly credit allowance
//   checkout.session.completed → grant a credit_products top-up pack
//
// Idempotent: every event is recorded by Stripe event id in credit_ledger.reference,
// so retries and duplicate deliveries never double-grant credits.
//
// Deploy:
//   supabase functions deploy stripe-webhook
//   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
//   # then register the endpoint in the Stripe dashboard:
//   # https://<project>.supabase.co/functions/v1/stripe-webhook
//
// Required env (auto-provided in Supabase Edge Runtime): SUPABASE_URL,
// SUPABASE_SERVICE_ROLE_KEY, STRIPE_WEBHOOK_SECRET.

import { createClient } from "jsr:@supabase/supabase-js@2";

// ── Stripe signature verification (HMAC-SHA256, zero dependencies) ──

async function verifyStripeSignature(
  payload: string,
  signatureHeader: string,
  webhookSecret: string
): Promise<{ valid: boolean; eventId?: string }> {
  const parts = Object.fromEntries(
    signatureHeader.split(",").map((kv) => {
      const [k, v] = kv.split("=");
      return [k.trim(), v];
    })
  );
  const timestamp = parts["t"];
  const signature = parts["v1"];
  if (!timestamp || !signature) return { valid: false };

  // Reject events older than 5 minutes (replay protection)
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) {
    return { valid: false };
  }

  const signedPayload = `${timestamp}.${payload}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(webhookSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const mac = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(signedPayload)
  );
  const expected = Array.from(new Uint8Array(mac))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // Constant-time compare
  if (expected.length !== signature.length) return { valid: false };
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  if (diff !== 0) return { valid: false };

  try {
    const event = JSON.parse(payload);
    return { valid: true, eventId: event.id as string };
  } catch {
    return { valid: false };
  }
}

// ── Credit grant helper (ledger-first, cache second) ─────────────────

async function grantCredits(
  supabase: ReturnType<typeof createClient>,
  opts: {
    userId: string;
    entryType: "allowance_grant" | "topup_purchase";
    amount: number;
    reference: string; // Stripe event id — idempotency key
    note: string;
  }
): Promise<Response | null> {
  // Idempotency: one ledger row per Stripe event
  const { data: existing } = await supabase
    .from("credit_ledger")
    .select("id")
    .eq("user_id", opts.userId)
    .eq("reference", opts.reference)
    .maybeSingle();
  if (existing) {
    return new Response(JSON.stringify({ received: true, duplicate: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("credits")
    .eq("id", opts.userId)
    .single();
  if (!profile) {
    return new Response(JSON.stringify({ error: "profile not found" }), { status: 404 });
  }

  const balanceAfter = (profile.credits ?? 0) + opts.amount;

  const { error: ledgerError } = await supabase.from("credit_ledger").insert({
    user_id: opts.userId,
    entry_type: opts.entryType,
    amount: opts.amount,
    balance_after: balanceAfter,
    reference: opts.reference,
    note: opts.note,
  });
  if (ledgerError) {
    return new Response(JSON.stringify({ error: ledgerError.message }), { status: 500 });
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ credits: balanceAfter, low_credit_notified_at: null })
    .eq("id", opts.userId);
  if (profileError) {
    return new Response(JSON.stringify({ error: profileError.message }), { status: 500 });
  }

  return null; // success — continue
}

// ── Handler ──────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!webhookSecret) {
    return new Response("STRIPE_WEBHOOK_SECRET not set", { status: 500 });
  }

  const payload = await req.text();
  const signature = req.headers.get("stripe-signature") ?? "";

  const { valid, eventId } = await verifyStripeSignature(payload, signature, webhookSecret);
  if (!valid || !eventId) {
    return new Response("Invalid signature", { status: 400 });
  }

  const event = JSON.parse(payload);
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // ── invoice.paid → monthly allowance ──
  if (event.type === "invoice.paid") {
    const invoice = event.data.object;
    const stripeSubId = invoice.subscription as string | null;
    if (!stripeSubId) return new Response(JSON.stringify({ received: true }), { status: 200 });

    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("user_id, plan_id, status")
      .eq("stripe_subscription_id", stripeSubId)
      .single();
    if (!subscription) {
      return new Response(JSON.stringify({ error: "subscription not found" }), { status: 404 });
    }

    const { data: plan } = await supabase
      .from("subscription_plans")
      .select("credit_allowance, name")
      .eq("id", subscription.plan_id)
      .single();
    if (!plan) return new Response(JSON.stringify({ error: "plan not found" }), { status: 404 });

    const result = await grantCredits(supabase, {
      userId: subscription.user_id,
      entryType: "allowance_grant",
      amount: plan.credit_allowance,
      reference: eventId,
      note: `${plan.name} monthly allowance (invoice ${invoice.number ?? invoice.id})`,
    });
    if (result) return result;

    await supabase
      .from("subscriptions")
      .update({ status: "active", current_period_end: new Date(invoice.lines?.data?.[0]?.period?.end * 1000 ?? Date.now()).toISOString() })
      .eq("stripe_subscription_id", stripeSubId);
  }

  // ── checkout.session.completed → credit top-up ──
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const productId = session.metadata?.credit_product_id as string | undefined;
    const userId = session.metadata?.user_id as string | undefined;
    if (!productId || !userId) {
      return new Response(JSON.stringify({ received: true, skipped: "no metadata" }), { status: 200 });
    }

    const { data: product } = await supabase
      .from("credit_products")
      .select("credits")
      .eq("id", productId)
      .single();
    if (!product) return new Response(JSON.stringify({ error: "product not found" }), { status: 404 });

    const result = await grantCredits(supabase, {
      userId,
      entryType: "topup_purchase",
      amount: product.credits,
      reference: eventId,
      note: `Top-up pack ${productId} (payment ${session.payment_intent ?? session.id})`,
    });
    if (result) return result;
  }

  return new Response(JSON.stringify({ received: true, event: event.type }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
