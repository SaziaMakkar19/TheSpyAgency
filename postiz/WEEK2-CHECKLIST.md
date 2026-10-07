# Week-2 Checklist — Postiz Goes Public (Tunnel + Subdomain + Real Accounts)

Goal: `postiz.thespyagency.com` serves the **local** Postiz container via
Cloudflare Tunnel, OAuth apps point at the subdomain, and the full loop
(registration → connect account → campaign post → analytics) is verified
from a phone on cellular data.

Estimated time: 60–90 minutes, mostly waiting for DNS/propagation.

---

## A. Cloudflare Tunnel (public HTTPS → local Postiz)

Prerequisite: thespyagency.com uses Cloudflare DNS (Dashboard → add site,
free plan; update nameservers at your registrar if prompted).

- [ ] **Install cloudflared on the gaming machine**
      `winget install --id Cloudflare.cloudflared`
- [ ] **Authenticate:** `cloudflared tunnel login`
      (picks your Cloudflare account; authorizes the domain)
- [ ] **Create the tunnel:** `cloudflared tunnel create postiz`
      → prints a Tunnel ID like `7f4c…`. Save it.
- [ ] **Create the DNS route:**
      `cloudflared tunnel route dns postiz postiz.thespyagency.com`
      (creates the CNAME automatically in Cloudflare)
- [ ] **Write the config:** copy `postiz/cloudflared-config.yml` to
      `C:\Users\<you>\.cloudflared\config.yml`, fill in `<TUNNEL-ID>`
      and the credentials path printed at tunnel creation
- [ ] **Start it:** `cloudflared tunnel run postiz`
      → confirm `Connected` in the log
- [ ] **(Recommended) Run as a Windows service** so it survives reboots:
      `cloudflared service install`

## B. Point Postiz at the subdomain

- [ ] In `postiz\.env`: set `FRONTEND_URL=https://postiz.thespyagency.com`
      (compose maps MAIN_URL / NEXT_PUBLIC_BACKEND_URL from it)
- [ ] Recreate the container so env applies:
      `docker compose up -d --force-recreate postiz`
- [ ] **Verify HTTPS works:** open `https://postiz.thespyagency.com` on your
      phone on cellular (Wi-Fi off) → Postiz login page loads
- [ ] **Existing data intact?** Log in as admin — your earlier localhost
      account, channels, and scheduled posts should all be there
      (Postgres volume persists; only the URL changed)

## C. Update the five OAuth app redirect URLs

Rule: wherever the platform app asks for a redirect/callback URL, use
`https://postiz.thespyagency.com/integrations/social/<platform>`.

- [ ] **Meta (Instagram + Facebook)** — developers.facebook.com → your app →
      Facebook Login → Settings: change Valid OAuth Redirect URI to
      `https://postiz.thespyagency.com/integrations/social/facebook`
      (covers both IG and FB channels)
- [ ] **TikTok** — developers.tiktok.com → your app → Redirect URL:
      `https://postiz.thespyagency.com/integrations/social/tiktok`
- [ ] **LinkedIn** — linkedin.com/developers → Auth tab → Authorized redirect
      URLs: `https://postiz.thespyagency.com/integrations/social/linkedin`
- [ ] **YouTube/Google** — console.cloud.google.com → APIs & Services →
      Credentials → your OAuth client → Authorized redirect URIs:
      `https://postiz.thespyagency.com/integrations/social/youtube`
- [ ] **Connect one test account per platform** in Postiz
      (Profile → Add channel) to prove each OAuth app works end-to-end

Optional but recommended this week: submit the Meta app for **App Review**
(start with `instagram_basic`, `pages_manage_posts`, `instagram_content_publish`).
Review is tied to your live domain and takes days — start it before you need it.
Have ready: privacy policy URL (`https://thespyagency.com/privacy`),
terms URL, a screen recording of the connect flow.

## D. Repoint the site's dispatcher at the public Postiz

- [ ] Root `.env.local` (and Vercel env vars): set
      `POSTIZ_BASE_URL=https://postiz.thespyagency.com/api`
- [ ] Set Supabase Edge Function secrets:
      `supabase secrets set POSTIZ_API_KEY=<your postiz api key>`
      `supabase secrets set POSTIZ_BASE_URL=https://postiz.thespyagency.com/api`
- [ ] **Deploy the functions** (no longer need local `functions serve`):
      `supabase functions deploy publish-dispatcher`
      `supabase functions deploy analytics-collector`
- [ ] Set the cron schedules (Supabase Dashboard → Database → Cron, every
      minute for dispatcher, every 30–60 min for collector) calling the
      function URLs with the service-role key

## E. Full-loop verification from a phone on cellular

Prerequisite: the site is deployed to Vercel (a localhost site can't be
reached from cellular). If not deployed yet, skip to E-last.

- [ ] Phone on cellular: open `https://thespyagency.com` → **Intel** gallery
      loads → tap a dossier → **Remix This Post**
- [ ] Register / log in (Supabase Auth)
- [ ] Connect an Instagram account in the user profile → you are redirected
      to Postiz at the subdomain → authorize → returned to the site
- [ ] Queue a remix in the Studio → confirm a row appears in `remixes`
- [ ] SQL Editor: insert a test job (or let the campaign scheduler write one):
      ```sql
      insert into public.publish_jobs (user_id, social_account_id, provider, platform, payload, scheduled_for)
      select p.id, s.id, 'postiz', 'instagram',
             jsonb_build_object('caption','Week-2 test post from The Spy Agency','headline','TEST','media_urls',array[]::text[]),
             now()
      from profiles p join social_accounts s on s.user_id = p.id
      where p.id = auth.uid() limit 1;
      ```
- [ ] Within a minute: `select status, attempts from publish_jobs order by created_at desc`
      → expect `dispatched` → `published`
- [ ] Check Postiz dashboard (phone, cellular, subdomain) → post is there
- [ ] `select * from publish_results order by collected_at desc` → after the
      collector runs, a second snapshot with `metrics` appears
- [ ] `/analytics` → the leaderboard shows your test agent with live numbers

## F. Rollback notes

- Tunnel down = subdomain unreachable, nothing else breaks; `cloudflared tunnel run postiz` restores it
- OAuth misbehaving on one platform = that platform's redirect URL is stale; recheck step C
- `dispatch` failing with 401 = Postiz API key missing from Supabase secrets (step D)
