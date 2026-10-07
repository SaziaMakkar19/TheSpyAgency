#!/usr/bin/env node
/**
 * Local end-to-end test for the stripe-webhook Edge Function.
 *
 * What it verifies:
 *   1. invoice.paid          → 200, allowance granted, ledger row written
 *   2. checkout.session.completed → 200, top-up credits granted
 *   3. tampered payload      → 400 (signature rejected)
 *   4. duplicate delivery    → 200 with { duplicate: true } (no double-grant)
 *
 * Setup:
 *   1. supabase start
 *   2. Apply supabase/schema.sql to the local DB, and create a test profile:
 *        insert into profiles (id, full_name, brokerage, role, credits)
 *        values ('00000000-0000-0000-0000-0000000000aa', 'Test Agent', 'Test Realty', 'pro', 100);
 *   3. Insert the matching subscription row for allowance tests.
 *   4. Serve the function locally:
 *        supabase functions serve stripe-webhook --no-verify-jwt \
 *          --env-file .env.local
 *      with .env.local containing:
 *        SUPABASE_URL=http://127.0.0.1:54321
 *        SUPABASE_SERVICE_ROLE_KEY=<service_role key from `supabase status`>
 *        STRIPE_WEBHOOK_SECRET=test_whsec_local
 *   5. node supabase/functions/stripe-webhook/test-local.mjs
 *
 * Usage: node test-local.mjs [function-url]
 *   Defaults to http://127.0.0.1:54321/functions/v1/stripe-webhook
 */

import { createHmac, timingSafeEqual } from "node:crypto";

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? "test_whsec_local";
const FUNCTION_URL =
  process.argv[2] ?? "http://127.0.0.1:54321/functions/v1/stripe-webhook";

// Must match the seeded test rows (see Setup above)
const TEST_USER_ID = "00000000-0000-0000-0000-0000000000aa";
const TEST_SUBSCRIPTION_ID = "sub_test_12345";
const NOW = Math.floor(Date.now() / 1000);

// ── Stripe-style signing (mirrors what the Stripe dashboard/test tool does) ──

function signPayload(payload, timestamp = NOW) {
  const signed = `${timestamp}.${payload}`;
  const sig = createHmac("sha256", WEBHOOK_SECRET).update(signed).digest("hex");
  return `t=${timestamp},v1=${sig}`;
}

async function post(payload, { sign = true, mutate } = {}) {
  let body = JSON.stringify(payload);
  if (mutate) body = body.replace(mutate.from, mutate.to); // tamper after signing
  const headers = { "Content-Type": "application/json" };
  if (sign) headers["stripe-signature"] = signPayload(body);
  const res = await fetch(FUNCTION_URL, { method: "POST", headers, body });
  return { status: res.status, json: await res.json().catch(() => ({})) };
}

// ── Mock events ──────────────────────────────────────────────────────────────

const invoicePaid = {
  id: "evt_test_invoice_0001",
  type: "invoice.paid",
  data: {
    object: {
      id: "in_test_0001",
      number: "TEST-0001",
      subscription: TEST_SUBSCRIPTION_ID,
      lines: { data: [{ period: { end: NOW + 30 * 24 * 3600 } }] },
    },
  },
};

const checkoutCompleted = {
  id: "evt_test_checkout_0001",
  type: "checkout.session.completed",
  data: {
    object: {
      id: "cs_test_0001",
      payment_intent: "pi_test_0001",
      metadata: { user_id: TEST_USER_ID, credit_product_id: "topup_500" },
    },
  },
};

// ── Assertions ───────────────────────────────────────────────────────────────

let pass = 0, fail = 0;
function check(name, cond, detail = "") {
  if (cond) { pass++; console.log(`  ✓ ${name}`); }
  else { fail++; console.error(`  ✗ ${name} ${detail}`); }
}

console.log(`Testing webhook at ${FUNCTION_URL}\n`);

// 1. Monthly allowance
console.log("invoice.paid → allowance grant");
const r1 = await post(invoicePaid);
check("status 200", r1.status === 200, `got ${r1.status}: ${JSON.stringify(r1.json)}`);
check("not flagged duplicate", r1.json.duplicate !== true);

// 2. Top-up
console.log("\ncheckout.session.completed → top-up grant");
const r2 = await post(checkoutCompleted);
check("status 200", r2.status === 200, `got ${r2.status}: ${JSON.stringify(r2.json)}`);

// 3. Tampered payload must be rejected
console.log("\ntampered payload → signature rejection");
const r3 = await post(checkoutCompleted, { mutate: { from: "topup_500", to: "topup_5000" } });
check("status 400", r3.status === 400, `got ${r3.status}`);

// 4. Unsigned payload must be rejected
const r3b = await fetch(FUNCTION_URL, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(invoicePaid),
});
check("unsigned → 400", r3b.status === 400, `got ${r3b.status}`);

// 5. Duplicate delivery must not double-grant
console.log("\nreplay same invoice.paid event → idempotent duplicate");
const r4 = await post(invoicePaid);
check("status 200", r4.status === 200);
check("flagged duplicate", r4.json.duplicate === true, JSON.stringify(r4.json));

// 6. Balance sanity via service key (optional — skips gracefully)
console.log("\nledger balance check");
const SUPABASE_URL = process.env.SUPABASE_URL ?? "http://127.0.0.1:54321";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (SERVICE_KEY) {
  const { data: profile } = await fetch(
    `${SUPABASE_URL}/rest/v1/profiles?id=eq.${TEST_USER_ID}&select=credits`,
    { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` } }
  ).then((r) => r.json());
  // 100 seed + 1000 allowance + 500 top-up = 1600 (duplicate ignored)
  check("credits = 1600 (no double-grant)", profile?.[0]?.credits === 1600,
    `got ${profile?.[0]?.credits}`);

  const { data: ledger } = await fetch(
    `${SUPABASE_URL}/rest/v1/credit_ledger?user_id=eq.${TEST_USER_ID}&select=entry_type,amount,reference&order=created_at`,
    { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` } }
  ).then((r) => r.json());
  check("allowance_grant row exists", ledger?.some((l) => l.entry_type === "allowance_grant" && l.amount === 1000));
  check("topup_purchase row exists", ledger?.some((l) => l.entry_type === "topup_purchase" && l.amount === 500));
  check("exactly 2 ledger rows (dedup worked)", ledger?.length === 2, `got ${ledger?.length}`);
} else {
  console.log("  (skipped — set SUPABASE_SERVICE_ROLE_KEY to verify balances)");
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
