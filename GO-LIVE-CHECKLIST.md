# Go-Live Checklist — The Spy Agency

Activate dormant features on production. Everything below is verified against the
current codebase (`main`, post-`178b841`). Keep dormant until each gate is checked.

---

## Gate 1 — Permission first

- [ ] At least one realtor friend has explicitly agreed to receive the brief +
      lead-alert emails for one of their listings
- [ ] You have a **different** MLS# than any used in prior tests (the 24 h
      per-listing email cap remembers earlier sends)

## Gate 2 — Live email rehearsal on localhost

- [ ] In `.env.local`: uncomment `SMTP_USER` (leave all other SMTP lines intact)
- [ ] Restart the dev server: `npm run dev` (env changes need a restart)
- [ ] On `localhost:3000`, scan the **permitted** listing with intent
      **"No, this is not my listing"** + your own email
- [ ] Verify two emails arrive: the brief PDF to you, the lead alert to the agent
      (check spam folders)
- [ ] Supabase → `leads`: the row shows `emailed = true`
- [ ] Comment `SMTP_USER` back out if you're not flipping production the same day

## Gate 3 — Vercel environment variables

Vercel → `thespyagency` project → **Settings → Environment Variables** → add for
the **Production** scope:

| Variable | Value |
|---|---|
| `BRIDGE_API_KEY` | Bridge portal → Server Token (the `eb98…` 32-char token) |
| `BRIDGE_BASE_URL` | `https://api.bridgedataoutput.com/api/v2/OData/bcres` |
| `SMTP_HOST` | from your mail provider |
| `SMTP_PORT` | `465` (or provider's port) |
| `SMTP_USER` | mailbox login |
| `SMTP_PASS` | mailbox password / app password |
| `MAIL_FROM` | the display sender address |

- [ ] All 7 added → **Deployments → ⋯ → Redeploy** (env changes require a rebuild)

### Do NOT add (will break production)

- ❌ `BRIDGE_CLIENT_ID` / `BRIDGE_CLIENT_SECRET` — obsolete, OAuth doesn't work
      with this dataset; the Server Token is the only credential
- ❌ IP Address Allowlist in the Bridge dashboard — Vercel uses dynamic IPs
- ❌ HTTP Referrer Domains in the Bridge dashboard — server-to-server calls send
      no referrer

## Gate 4 — Production verification (thespyagency.com)

- [ ] Scan the permitted MLS# → success panel shows the **real** agent name and
      **no amber "Demo mode" note**
- [ ] "View your report" opens the real PDF (photos, real comps, watermark)
- [ ] Supabase → Storage → `market-briefs` → new folder for that MLS#
- [ ] Footer newsletter signup with your email → row appears in
      `newsletter_subscribers`
- [ ] Agent confirms their two emails arrived

## Safety rails (already on — no action needed)

- Max **5 scans/hour/IP** (rate limit via `leads` table)
- Max **1 email per listing per 24 h** per flow (silent success after that)
- Honeypot field + intent-gate checkboxes on every scan
- Newsletter table: RLS on, no public policies — service-role writes only
- Signed storage URLs expire after 7 days (private bucket)

## Rollback (instant)

- Remove `BRIDGE_API_KEY` → market brief falls back to labeled demo mode
- Remove/blank `SMTP_USER` → all email sends stop (leads still record)
- Or: Vercel → Redeploy the previous deployment
