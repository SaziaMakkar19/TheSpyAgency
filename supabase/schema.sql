-- The Spy Agency — Supabase schema (Milestone 3/5 merge)
-- Run in the Supabase SQL editor. RLS is enabled with anon read on published
-- posts; writes go through the authenticated role.

create extension if not exists "uuid-ossp";

-- ── users (extends Supabase auth.users) ─────────────────────────────
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  brokerage   text,
  license_no  text,
  role        text not null default 'free' check (role in ('anonymous','free','pro','brokerage','admin')),
  credits     integer not null default 1000,       -- GPU render credits
  design_md   jsonb,                               -- generated during registration
  created_at  timestamptz not null default now()
);

-- ── realtor directory: ALIGN with the EXISTING `realtors` table ──────
-- The project database already holds the imported directory as
-- public.realtors (MemberMlsId PK … LocalMarket) plus the sync-tracking
-- table realtor_outreach_state. We adopt it as the agent directory
-- instead of creating a parallel table. This block only adds indexes,
-- the link from profiles, and RLS.
-- Plain index (NOT unique): realtors share office/team emails, so the
-- same address legitimately appears on multiple rows. The verification
-- match disambiguates by full name when it gets more than one hit.
create index if not exists realtors_email_idx
  on public.realtors (lower("MemberEmail"))
  where "MemberEmail" is not null and "MemberEmail" <> '';
create index if not exists realtors_office_idx on public.realtors ("OfficeMlsId");
create index if not exists realtors_market_idx on public.realtors ("LocalMarket");
create index if not exists realtors_name_idx on public.realtors ("MemberLastName", "MemberFirstName");

-- Link verified registrants to their directory record (text PK).
alter table public.profiles
  add column if not exists directory_mls_id text references public.realtors("MemberMlsId");

-- The campaign-invitation picker and verification match run as logged-in
-- users. (anon select kept so the legacy Vercel app keeps working —
-- tighten to authenticated once the old app is retired.)
alter table public.realtors enable row level security;
create policy "realtors_read" on public.realtors
  for select using (true);

-- ── gallery posts ("The Feed") ──────────────────────────────────────
create table if not exists public.posts (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid references public.profiles(id) on delete set null,
  title        text not null,
  prompt       text not null,
  negative_prompt text,
  ai_model     text not null default 'gemini-2.5-flash-image', -- what context/model was used
  style_preset text not null default 'Cinematic Luxury',
  aspect_ratio text not null default '4:5',
  tags         text[] not null default '{}',
  price        numeric(14,2),
  address      text,
  listing_no   text,
  is_pro_only  boolean not null default false,     -- prompt copy gated for Pro
  published    boolean not null default true,
  likes_count  integer not null default 0,
  remix_count  integer not null default 0,
  created_at   timestamptz not null default now()
);
create index if not exists posts_published_idx on public.posts (published, created_at desc);
create index if not exists posts_tags_idx on public.posts using gin (tags);

-- ── images (renders belonging to a post) ────────────────────────────
create table if not exists public.images (
  id          uuid primary key default uuid_generate_v4(),
  post_id     uuid not null references public.posts(id) on delete cascade,
  storage_path text not null,                      -- Supabase Storage path
  layer       text not null default 'render',      -- render | locked_compliance | overlay
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);
create index if not exists images_post_idx on public.images (post_id);

-- ── remixes (studio sessions) ───────────────────────────────────────
create table if not exists public.remixes (
  id             uuid primary key default uuid_generate_v4(),
  source_post_id uuid references public.posts(id) on delete set null,
  user_id        uuid references public.profiles(id) on delete set null,
  prompt         text not null,
  co_op_modifier text,                             -- co-op layer prompt (locked)
  style_preset   text not null default 'Cinematic Luxury',
  aspect_ratio   text not null default '4:5',
  headline       text,                             -- editable agent layer
  locked_geometry boolean not null default true,   -- MLS Master Geometry layer
  status         text not null default 'draft' check (status in ('draft','queued','rendering','published','failed')),
  credits_spent  integer not null default 0,
  created_at     timestamptz not null default now()
);
create index if not exists remixes_user_idx on public.remixes (user_id);

-- ── campaigns (Milestone 4: co-op scheduling) ───────────────────────
create table if not exists public.campaigns (
  id          uuid primary key default uuid_generate_v4(),
  listing_no  text not null,
  owner_id    uuid references public.profiles(id) on delete set null,
  status      text not null default 'open' check (status in ('draft','open','active','closed')),
  split_note  text,                                -- e.g. "50/50 Co-Op"
  created_at  timestamptz not null default now()
);

create table if not exists public.campaign_participants (
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  claimed_template_id uuid,
  scheduled_at timestamptz,
  primary key (campaign_id, user_id)
);

-- ── RLS ─────────────────────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.images enable row level security;
alter table public.remixes enable row level security;

-- Anyone can browse published posts; only the author (or admin) writes.
create policy "posts_public_read" on public.posts
  for select using (published = true or auth.uid() = user_id);
create policy "posts_author_insert" on public.posts
  for insert with check (auth.uid() = user_id);
create policy "posts_author_update" on public.posts
  for update using (auth.uid() = user_id);

create policy "images_public_read" on public.images for select using (true);

-- Remixes: users manage their own sessions.
create policy "remixes_owner_all" on public.remixes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "profiles_public_read" on public.profiles for select using (true);
create policy "profiles_owner_update" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- ── Storage bucket for listing renders ──────────────────────────────
insert into storage.buckets (id, name, public)
values ('listing-renders', 'listing-renders', true)
on conflict (id) do nothing;

-- ── Billing: minimum monthly subscription + Stripe credit top-ups ────
-- Model: every Pro/Brokerage subscriber pays a base monthly plan that
-- includes a credit allowance. When the allowance runs low or is spent,
-- users buy top-up packs via Stripe. All movement lands in credit_ledger.

create table if not exists public.subscription_plans (
  id           text primary key,                  -- 'pro', 'brokerage'
  name         text not null,
  price_monthly numeric(10,2) not null,
  credit_allowance integer not null,              -- granted per billing cycle
  topup_bonus  integer not null default 0
);

create table if not exists public.subscriptions (
  id                   uuid primary key default uuid_generate_v4(),
  user_id              uuid not null references public.profiles(id) on delete cascade,
  plan_id              text not null references public.subscription_plans(id),
  stripe_subscription_id text unique,
  status               text not null default 'active' check (status in ('active','past_due','canceled','trialing')),
  current_period_end   timestamptz,
  created_at           timestamptz not null default now()
);
create index if not exists subscriptions_user_idx on public.subscriptions (user_id);

-- Top-up packs purchasable from the billing UI (Stripe PaymentIntents).
create table if not exists public.credit_products (
  id            text primary key,                 -- 'topup_500', 'topup_2000'
  credits       integer not null,
  price_cents   integer not null,
  stripe_price_id text unique
);

-- Immutable double-entry-style ledger; profiles.credits is a cached balance.
create table if not exists public.credit_ledger (
  id           bigint generated always as identity primary key,
  user_id      uuid not null references public.profiles(id) on delete cascade,
  entry_type   text not null check (entry_type in ('allowance_grant','topup_purchase','spend','refund','adjustment')),
  amount       integer not null,                  -- + grants, − spends
  balance_after integer not null,
  reference    text,                              -- stripe_payment_intent_id, remix_id, …
  note         text,
  created_at   timestamptz not null default now()
);
create index if not exists credit_ledger_user_idx on public.credit_ledger (user_id, created_at desc);

-- Low-credit state for "running low or completed" top-up prompts.
alter table public.profiles
  add column if not exists low_credit_notified_at timestamptz;

alter table public.credit_ledger enable row level security;
create policy "ledger_owner_read" on public.credit_ledger
  for select using (auth.uid() = user_id);

alter table public.subscriptions enable row level security;
create policy "subscriptions_owner_read" on public.subscriptions
  for select using (auth.uid() = user_id);

-- Seed plan + top-up catalog (adjust prices to your Pricing page).
insert into public.subscription_plans (id, name, price_monthly, credit_allowance)
values ('pro', 'Pro Agent', 49.00, 1000),
       ('brokerage', 'Brokerage Level', 199.00, 5000)
on conflict (id) do nothing;

insert into public.credit_products (id, credits, price_cents)
values ('topup_500', 500, 1500),
       ('topup_2000', 2000, 4500),
       ('topup_5000', 5000, 9000)
on conflict (id) do nothing;

-- ── Social accounts & provider-neutral posting queue ────────────────
-- Posting/analytics providers are swappable (Outstand today, maybe
-- Zernio/Ayrshare tomorrow as account-volume costs dictate). The app
-- only ever writes to these two tables; a provider adapter (Edge
-- Function) drains the queue and reports back via publish_results.

-- OAuth-connected social identities, one row per (agent, platform).
create table if not exists public.social_accounts (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  provider     text not null check (provider in ('postiz','outstand','ayrshare','zernio','meta','tiktok','linkedin','youtube')), -- posting provider OR direct platform
  platform     text not null check (platform in ('instagram','facebook','tiktok','linkedin','youtube','threads','pinterest','bluesky','x')),
  account_label text,                              -- e.g. "@elenavance.realtor"
  external_ref text not null,                      -- provider's account/profile id
  scopes       text[] not null default '{}',
  connected_at timestamptz not null default now(),
  revoked_at   timestamptz,
  unique (user_id, provider, platform, external_ref)
);
create index if not exists social_accounts_user_idx on public.social_accounts (user_id) where revoked_at is null;

-- Provider-neutral job queue. One remix/publish = one job per platform.
create table if not exists public.publish_jobs (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  remix_id     uuid references public.remixes(id) on delete set null,
  campaign_id  uuid references public.campaigns(id) on delete set null,
  social_account_id uuid references public.social_accounts(id) on delete cascade,
  provider     text not null default 'postiz',     -- routing hint for the adapter
  platform     text not null,
  payload      jsonb not null,                     -- caption, media refs, tracking_url
  scheduled_for timestamptz not null,              -- co-op stagger lives here
  status       text not null default 'queued' check (status in ('queued','held','dispatched','published','failed','canceled')),
  attempts     integer not null default 0,
  idempotency_key text unique,                     -- safe retries from the offset scheduler
  dispatched_at timestamptz,
  published_at timestamptz,
  created_at   timestamptz not null default now()
);
create index if not exists publish_jobs_drain_idx on public.publish_jobs (status, scheduled_for) where status = 'queued';

-- Results returned by whichever provider executed the job. This is the
-- table your analytics collector reads for the leaderboard — so provider
-- swaps never touch Milestone 6.
create table if not exists public.publish_results (
  id           uuid primary key default uuid_generate_v4(),
  publish_job_id uuid not null references public.publish_jobs(id) on delete cascade,
  provider_post_id text,                           -- id at the provider/social platform
  permalink    text,
  metrics      jsonb not null default '{}',        -- views, likes, comments, shares
  collected_at timestamptz not null default now()
);
create index if not exists publish_results_job_idx on public.publish_results (publish_job_id);

alter table public.social_accounts enable row level security;
alter table public.publish_jobs enable row level security;

create policy "social_accounts_owner_all" on public.social_accounts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "publish_jobs_owner_read" on public.publish_jobs
  for select using (auth.uid() = user_id);

-- ── Postiz migration (idempotent — for databases created before Postiz) ──
-- Postiz is the sole launch posting provider.
alter table public.publish_jobs alter column provider set default 'postiz';
alter table public.social_accounts drop constraint if exists social_accounts_provider_check;
alter table public.social_accounts add constraint social_accounts_provider_check
  check (provider in ('postiz','outstand','ayrshare','zernio','meta','tiktok','linkedin','youtube'));

-- ── Auth: auto-create a profile row for every new registered user ────
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
