-- Stripe billing for storm alerts.
--
-- Design rule: the browser never sets `plan`. Only the Stripe webhook can,
-- running under the service role. Otherwise anyone could POST themselves a
-- paid plan with the public anon key.

alter table public.storm_alert_subscriptions
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists current_period_end timestamptz,
  add column if not exists cancel_at_period_end boolean not null default false;

create unique index if not exists storm_alert_stripe_sub_idx
  on public.storm_alert_subscriptions (stripe_subscription_id)
  where stripe_subscription_id is not null;

create index if not exists storm_alert_stripe_customer_idx
  on public.storm_alert_subscriptions (stripe_customer_id)
  where stripe_customer_id is not null;

-- ---------------------------------------------------------------------------
-- Idempotency for webhooks.
--
-- Stripe retries deliveries and can send the same event more than once. Without
-- this table a retry could double-apply a change. Insert-first, and if the
-- insert conflicts we know we already processed it.
-- ---------------------------------------------------------------------------
create table if not exists public.stripe_events (
  id text primary key,                     -- Stripe's event id (evt_...)
  type text not null,
  received_at timestamptz not null default now(),
  payload jsonb
);

alter table public.stripe_events enable row level security;
-- No policies: only the service role (which bypasses RLS) touches this.

-- ---------------------------------------------------------------------------
-- Tighten the anon insert policy.
--
-- The original policy allowed anon to insert with plan='free'. Now that paid
-- plans exist, also block anon from seeding any Stripe identifiers, so a
-- crafted request cannot attach itself to someone else's customer record.
-- ---------------------------------------------------------------------------
drop policy if exists "anon can subscribe" on public.storm_alert_subscriptions;
create policy "anon can subscribe"
  on public.storm_alert_subscriptions
  for insert
  to anon, authenticated
  with check (
    plan = 'free'
    and active = true
    and last_notified_event_date is null
    and last_notified_at is null
    and stripe_customer_id is null
    and stripe_subscription_id is null
    and current_period_end is null
    and cancel_at_period_end = false
  );

-- Deliberately still no select / update / delete policy for anon.
