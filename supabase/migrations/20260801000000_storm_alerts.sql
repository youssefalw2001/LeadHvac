-- Storm alert subscriptions.
--
-- The scan is free. This is the thing people pay for: they should not have to
-- remember to check. When 1.5" hail lands in their ZIP at 4am, they get woken up.

create table if not exists public.storm_alert_subscriptions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- contact
  email text,
  phone text,
  business_name text,

  -- what they cover
  trade text not null,
  area_label text not null,
  latitude double precision not null,
  longitude double precision not null,
  radius_miles integer not null default 25,

  -- what wakes them up. defaults are the industry claim thresholds.
  min_hail_inches numeric(4,2) not null default 1.00,
  min_wind_mph integer not null default 58,
  notify_on_forecast boolean not null default true,

  -- plan gating
  plan text not null default 'free',        -- free | alerts | territory
  active boolean not null default true,

  -- dedupe: never send the same storm day twice
  last_notified_event_date date,
  last_notified_at timestamptz,

  constraint storm_alert_contact_present check (
    email is not null or phone is not null
  ),
  constraint storm_alert_radius_sane check (radius_miles between 1 and 100),
  constraint storm_alert_plan_valid check (plan in ('free', 'alerts', 'territory'))
);

create index if not exists storm_alert_active_idx
  on public.storm_alert_subscriptions (active, plan)
  where active = true;

create index if not exists storm_alert_geo_idx
  on public.storm_alert_subscriptions (latitude, longitude);

-- Log of what we actually sent. Without this you cannot answer "did my alert
-- fire?", which is the first question every paying customer asks.
create table if not exists public.storm_alert_deliveries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  subscription_id uuid not null references public.storm_alert_subscriptions (id) on delete cascade,
  event_date date not null,
  channel text not null,                    -- email | sms
  headline text not null,
  hail_inches numeric(4,2),
  wind_mph integer,
  nearest_miles numeric(6,2),
  report_count integer,
  status text not null default 'sent',      -- sent | failed
  error_detail text,
  unique (subscription_id, event_date, channel)
);

create index if not exists storm_alert_deliveries_sub_idx
  on public.storm_alert_deliveries (subscription_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Row Level Security
--
-- The browser uses the anon key, so it must only ever be able to INSERT a
-- subscription. It must never be able to read the subscriber list (that is a
-- customer list and a phone-number leak), and never update plan or delete.
-- All reading and sending happens in the Edge Function under the service role,
-- which bypasses RLS.
-- ---------------------------------------------------------------------------

alter table public.storm_alert_subscriptions enable row level security;
alter table public.storm_alert_deliveries enable row level security;

drop policy if exists "anon can subscribe" on public.storm_alert_subscriptions;
create policy "anon can subscribe"
  on public.storm_alert_subscriptions
  for insert
  to anon, authenticated
  with check (
    -- a new signup is always free and active; paid plans are set server-side
    plan = 'free'
    and active = true
    and last_notified_event_date is null
    and last_notified_at is null
  );

-- Deliberately no select / update / delete policies for anon.
-- No policy means no access, which is what we want.

create or replace function public.touch_storm_alert_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists storm_alert_touch on public.storm_alert_subscriptions;
create trigger storm_alert_touch
  before update on public.storm_alert_subscriptions
  for each row execute function public.touch_storm_alert_updated_at();
