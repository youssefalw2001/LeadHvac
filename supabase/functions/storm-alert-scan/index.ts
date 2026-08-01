/**
 * STORM ALERT SCAN
 * ================
 *
 * Runs on a schedule (suggested: hourly). For every active subscription it
 * checks NOAA Storm Prediction Center reports against that subscriber's
 * thresholds, and notifies once per storm day.
 *
 * This is the paid product. The scan on the website is free; not having to
 * remember to check is what people pay for.
 *
 * Deploy:
 *   supabase functions deploy storm-alert-scan
 *
 * Schedule (hourly) with pg_cron in the SQL editor:
 *   select cron.schedule(
 *     'storm-alert-scan', '0 * * * *',
 *     $$ select net.http_post(
 *          url := 'https://<project>.supabase.co/functions/v1/storm-alert-scan',
 *          headers := '{"Authorization":"Bearer <service-role-key>"}'::jsonb
 *        ) $$
 *   );
 *
 * Required env (set with `supabase secrets set`):
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY   (injected automatically)
 *   RESEND_API_KEY        optional — enables email
 *   ALERT_FROM_EMAIL      optional — required if RESEND_API_KEY is set
 *   TWILIO_ACCOUNT_SID    optional — enables SMS
 *   TWILIO_AUTH_TOKEN     optional
 *   TWILIO_FROM_NUMBER    optional
 *
 * Only the specific variables above are read. Nothing enumerates the
 * environment.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const ALERT_FROM_EMAIL = Deno.env.get('ALERT_FROM_EMAIL');
const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID');
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN');
const TWILIO_FROM_NUMBER = Deno.env.get('TWILIO_FROM_NUMBER');

/** How many days back to look each run. Small, because this runs hourly. */
const SCAN_DAYS = 3;
const EARTH_RADIUS_MILES = 3958.8;

interface Subscription {
  id: string;
  email: string | null;
  phone: string | null;
  business_name: string | null;
  trade: string;
  area_label: string;
  latitude: number;
  longitude: number;
  radius_miles: number;
  min_hail_inches: number;
  min_wind_mph: number;
  plan: string;
  last_notified_event_date: string | null;
}

interface SpcHit {
  date: string;
  kind: 'hail' | 'wind' | 'torn';
  hailInches?: number;
  windMph?: number;
  location: string;
  state: string;
  latitude: number;
  longitude: number;
  comments: string;
  distanceMiles: number;
}

function haversineMiles(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_MILES * Math.asin(Math.sqrt(a));
}

function spcTag(d: Date) {
  return (
    String(d.getUTCFullYear()).slice(2) +
    String(d.getUTCMonth() + 1).padStart(2, '0') +
    String(d.getUTCDate()).padStart(2, '0')
  );
}

function parseSpcCsv(text: string): string[][] {
  const rows: string[][] = [];
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('Time,')) continue;
    const cells: string[] = [];
    let cur = '';
    let quoted = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (quoted) {
        if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
        else if (c === '"') quoted = false;
        else cur += c;
      } else if (c === '"') quoted = true;
      else if (c === ',') { cells.push(cur); cur = ''; }
      else cur += c;
    }
    cells.push(cur);
    if (cells.length >= 7) rows.push(cells);
  }
  return rows;
}

/** One fetch per day per kind, cached across subscribers in the same run. */
const spcCache = new Map<string, SpcHit[]>();

async function fetchSpcDay(kind: 'hail' | 'wind' | 'torn', date: Date): Promise<SpcHit[]> {
  const tag = spcTag(date);
  const key = `${kind}-${tag}`;
  const cached = spcCache.get(key);
  if (cached) return cached;

  const iso = date.toISOString().slice(0, 10);
  let out: SpcHit[] = [];
  try {
    const res = await fetch(`https://www.spc.noaa.gov/climo/reports/${tag}_rpts_${kind}.csv`);
    if (res.ok) {
      const text = await res.text();
      if (!text.trimStart().startsWith('<')) {
        out = parseSpcCsv(text)
          .map((cells) => {
            const [, magnitude, location, , state, latRaw, lonRaw, ...rest] = cells;
            const latitude = Number(latRaw);
            const longitude = Number(lonRaw);
            if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
            const hit: SpcHit = {
              date: iso,
              kind,
              location: location?.trim() ?? '',
              state: state?.trim() ?? '',
              latitude,
              longitude,
              comments: rest.join(',').trim(),
              distanceMiles: 0,
            };
            if (kind === 'hail') {
              const h = Number(magnitude);
              if (!Number.isFinite(h)) return null;
              hit.hailInches = h / 100;
            } else if (kind === 'wind') {
              const m = String(magnitude).trim().toUpperCase().match(/^G?(\d+(?:\.\d+)?)$/);
              if (m) hit.windMph = Number(m[1]);
            }
            return hit;
          })
          .filter((x): x is SpcHit => x !== null);
      }
    }
  } catch (_) {
    // A single failed day must not abort the run.
  }
  spcCache.set(key, out);
  return out;
}

interface Trigger {
  eventDate: string;
  headline: string;
  hailInches?: number;
  windMph?: number;
  nearestMiles: number;
  reportCount: number;
  sampleComment?: string;
}

function findTrigger(sub: Subscription, hits: SpcHit[]): Trigger | null {
  const inRange = hits
    .map((h) => ({ ...h, distanceMiles: haversineMiles(sub.latitude, sub.longitude, h.latitude, h.longitude) }))
    .filter((h) => h.distanceMiles <= sub.radius_miles);
  if (!inRange.length) return null;

  // Newest storm day first, so we alert on the freshest event.
  const byDate = new Map<string, typeof inRange>();
  for (const h of inRange) {
    if (!byDate.has(h.date)) byDate.set(h.date, []);
    byDate.get(h.date)!.push(h);
  }
  const dates = [...byDate.keys()].sort((a, b) => b.localeCompare(a));

  for (const date of dates) {
    // Never notify the same storm day twice.
    if (sub.last_notified_event_date && date <= sub.last_notified_event_date) continue;

    const list = byDate.get(date)!;
    const hail = list.map((h) => h.hailInches ?? 0);
    const wind = list.map((h) => h.windMph ?? 0);
    const maxHail = Math.max(0, ...hail);
    const maxWind = Math.max(0, ...wind);
    const tornado = list.some((h) => h.kind === 'torn');

    const hailHit = maxHail >= Number(sub.min_hail_inches);
    const windHit = maxWind >= Number(sub.min_wind_mph);
    if (!hailHit && !windHit && !tornado) continue;

    const nearest = Math.min(...list.map((h) => h.distanceMiles));
    const parts: string[] = [];
    if (hailHit) parts.push(`${maxHail.toFixed(2)}" hail`);
    if (windHit) parts.push(`${maxWind} mph wind`);
    if (tornado) parts.push('tornado reported');

    return {
      eventDate: date,
      headline: `${parts.join(' + ')} within ${nearest.toFixed(0)} mi of ${sub.area_label}`,
      hailInches: hailHit ? maxHail : undefined,
      windMph: windHit ? maxWind : undefined,
      nearestMiles: nearest,
      reportCount: list.length,
      sampleComment: list.find((h) => h.comments && h.comments.length > 12)?.comments,
    };
  }
  return null;
}

function buildBody(sub: Subscription, t: Trigger) {
  const claimDaysLeft =
    365 - Math.floor((Date.now() - new Date(`${t.eventDate}T12:00:00Z`).getTime()) / 86_400_000);
  const lines = [
    `${t.headline}.`,
    `Date of loss: ${t.eventDate}. ${t.reportCount} NOAA report(s).`,
    t.hailInches ? `Max hail: ${t.hailInches.toFixed(2)}".` : '',
    t.windMph ? `Max wind: ${t.windMph} mph.` : '',
    `Claim window: about ${claimDaysLeft} days remaining.`,
    t.sampleComment ? `NOAA observation: "${t.sampleComment}"` : '',
    '',
    'Source: NOAA Storm Prediction Center. Reports are preliminary.',
  ].filter(Boolean);
  return lines.join('\n');
}

async function sendEmail(to: string, subject: string, body: string) {
  if (!RESEND_API_KEY || !ALERT_FROM_EMAIL) throw new Error('email not configured');
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: ALERT_FROM_EMAIL,
      to,
      subject,
      text: body,
    }),
  });
  if (!res.ok) throw new Error(`resend ${res.status}`);
}

async function sendSms(to: string, body: string) {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_FROM_NUMBER) {
    throw new Error('sms not configured');
  }
  const form = new URLSearchParams({ To: to, From: TWILIO_FROM_NUMBER, Body: body.slice(0, 600) });
  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: form,
    }
  );
  if (!res.ok) throw new Error(`twilio ${res.status}`);
}

Deno.serve(async (req) => {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return new Response(JSON.stringify({ error: 'missing supabase config' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const dryRun = new URL(req.url).searchParams.get('dry_run') === '1';
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  const { data: subs, error } = await supabase
    .from('storm_alert_subscriptions')
    .select('*')
    .eq('active', true)
    .in('plan', ['alerts', 'territory']);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const subscriptions = (subs ?? []) as Subscription[];

  // Pull the SPC window once, shared across all subscribers.
  const hits: SpcHit[] = [];
  for (let i = 0; i <= SCAN_DAYS; i++) {
    const date = new Date(Date.now() - i * 86_400_000);
    for (const kind of ['hail', 'wind', 'torn'] as const) {
      hits.push(...(await fetchSpcDay(kind, date)));
    }
  }

  let notified = 0;
  let failed = 0;
  const results: unknown[] = [];

  for (const sub of subscriptions) {
    const trigger = findTrigger(sub, hits);
    if (!trigger) continue;

    const subject = `Storm alert: ${trigger.headline}`;
    const body = buildBody(sub, trigger);

    if (dryRun) {
      results.push({ subscription: sub.id, would_send: subject });
      notified++;
      continue;
    }

    const channels: ('email' | 'sms')[] = [];
    if (sub.email && RESEND_API_KEY) channels.push('email');
    if (sub.phone && TWILIO_ACCOUNT_SID) channels.push('sms');

    let anySent = false;
    for (const channel of channels) {
      try {
        if (channel === 'email') await sendEmail(sub.email!, subject, body);
        else await sendSms(sub.phone!, body);
        anySent = true;
        await supabase.from('storm_alert_deliveries').insert({
          subscription_id: sub.id,
          event_date: trigger.eventDate,
          channel,
          headline: trigger.headline,
          hail_inches: trigger.hailInches ?? null,
          wind_mph: trigger.windMph ?? null,
          nearest_miles: trigger.nearestMiles,
          report_count: trigger.reportCount,
          status: 'sent',
        });
      } catch (e) {
        failed++;
        await supabase.from('storm_alert_deliveries').insert({
          subscription_id: sub.id,
          event_date: trigger.eventDate,
          channel,
          headline: trigger.headline,
          status: 'failed',
          error_detail: String(e).slice(0, 400),
        });
      }
    }

    // Only advance the watermark if something actually went out, otherwise a
    // transient provider outage would silently swallow the alert forever.
    if (anySent) {
      notified++;
      await supabase
        .from('storm_alert_subscriptions')
        .update({
          last_notified_event_date: trigger.eventDate,
          last_notified_at: new Date().toISOString(),
        })
        .eq('id', sub.id);
    }
  }

  return new Response(
    JSON.stringify({
      ok: true,
      dry_run: dryRun,
      subscriptions_checked: subscriptions.length,
      spc_reports_scanned: hits.length,
      notified,
      failed,
      results: dryRun ? results : undefined,
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );
});
