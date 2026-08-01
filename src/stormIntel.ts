/**
 * STORM INTELLIGENCE ENGINE
 * ==========================
 *
 * Turns free public weather data into dated, actionable job opportunities for
 * home-service contractors.
 *
 * DESIGN RULE, LEARNED THE HARD WAY:
 * Every number here is either (a) returned by a real API, or (b) a clearly
 * labelled assumption with the assumption exposed to the user. No invented
 * "scores" dressed up as data. If we can't measure it, we say so.
 *
 * DATA SOURCES — all free, no API key, no server required:
 *   - Open-Meteo Geocoding    https://geocoding-api.open-meteo.com/v1/search
 *   - Open-Meteo Forecast     https://api.open-meteo.com/v1/forecast
 *   - Open-Meteo Archive      https://archive-api.open-meteo.com/v1/archive
 *   - NWS Active Alerts       https://api.weather.gov/alerts/active
 *
 * THREE TIME HORIZONS — this is the product:
 *   PAST    (up to 365 days)  storms whose insurance claim window is still open
 *   NOW     (active)          live NWS warnings in the service area
 *   FUTURE  (up to 14 days)   demand spikes you can staff and pre-book for
 */

export type Trade = 'roofing' | 'hvac' | 'plumbing' | 'restoration';

export type Horizon = 'past' | 'now' | 'future';

export type Confidence = 'measured' | 'derived' | 'assumption';

export interface StormEvent {
  id: string;
  /** Date of the peak measurement within the event. */
  date: string;
  /** Human-readable span, e.g. "2026-07-21 → 2026-07-27 (7 days)". */
  dateSpan: string;
  /** Number of consecutive qualifying days in this event. */
  dayCount: number;
  horizon: Horizon;
  /** Days from today to the peak. Negative = past, 0 = today, positive = future. */
  dayOffset: number;
  trade: Trade;
  headline: string;
  /** What was actually measured, with units. */
  measurement: string;
  /** Why this threshold matters, in contractor language. */
  why: string;
  /** What to do about it. */
  action: string;
  severity: 'critical' | 'high' | 'moderate';
  confidence: Confidence;
  /** True for insurable physical damage (wind/hail). Heat and cold create demand, not claims. */
  claimable: boolean;
  /** Only present when a claim deadline actually applies. */
  claimWindowDaysLeft?: number;
}

export interface JobValueEstimate {
  trade: Trade;
  eventCount: number;
  /** Exposed so the user can sanity-check our math instead of trusting a score. */
  assumptions: string[];
  lowUsd: number;
  highUsd: number;
}

export interface ServiceArea {
  query: string;
  name: string;
  state?: string;
  latitude: number;
  longitude: number;
  /** True when the caller supplied coordinates we resolved, false on fallback. */
  resolved: boolean;
}

export interface StormIntelReport {
  area: ServiceArea;
  generatedAt: string;
  events: StormEvent[];
  activeAlerts: ActiveAlert[];
  valueEstimates: JobValueEstimate[];
  dataSources: DataSourceStatus[];
  /** Honest summary of what we could and could not measure. */
  limitations: string[];
}

export interface ActiveAlert {
  id: string;
  event: string;
  severity: string;
  urgency: string;
  headline: string;
  areaDesc: string;
  effective: string;
  expires: string;
}

export interface DataSourceStatus {
  name: string;
  endpoint: string;
  status: 'live' | 'unavailable';
  detail: string;
}

/* ------------------------------------------------------------------ *
 * THRESHOLDS
 *
 * These are published meteorological / industry values, not tuned
 * parameters. They are constants of the physical world and the insurance
 * business, which is exactly why they are safe to hard-code.
 * ------------------------------------------------------------------ */

/** NWS severe thunderstorm wind criterion: 58 mph (50 knots). */
const WIND_SEVERE_MPH = 58;
/** Below severe but enough to lift shingles, tear flashing, drop gutters. */
const WIND_DAMAGING_MPH = 45;
/** Sustained heat where residential AC systems fail in volume. */
const HEAT_AC_STRESS_F = 95;
const HEAT_AC_CRITICAL_F = 100;
/** Furnace demand threshold. */
const COLD_FURNACE_F = 32;
/** Uninsulated pipes are at real freeze risk in sustained low 20s. */
const COLD_PIPE_BURST_F = 20;
/** Heavy rain in a day — basement/drainage/restoration calls. */
const HEAVY_RAIN_MM = 25;

/**
 * Most US property policies require a claim within 1 year of date of loss.
 * This is why historical storms are worth money: the roofs are still claimable.
 */
const CLAIM_WINDOW_DAYS = 365;

/** How far back we pull archive data. */
const LOOKBACK_DAYS = 120;
/** How far forward the free forecast reaches reliably. */
const FORECAST_DAYS = 14;

const MS_PER_DAY = 86_400_000;

function daysBetween(a: Date, b: Date) {
  return Math.round((b.getTime() - a.getTime()) / MS_PER_DAY);
}

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function mphFromKmh(kmh: number) {
  return kmh * 0.621371;
}

function fFromC(c: number) {
  return c * 9 / 5 + 32;
}

/* ------------------------------------------------------------------ *
 * GEOCODING
 * ------------------------------------------------------------------ */

export async function resolveServiceArea(query: string): Promise<ServiceArea> {
  const trimmed = query.trim();
  const url = new URL('https://geocoding-api.open-meteo.com/v1/search');
  url.searchParams.set('name', trimmed);
  url.searchParams.set('count', '1');
  url.searchParams.set('language', 'en');
  url.searchParams.set('format', 'json');

  try {
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`geocoding ${res.status}`);
    const json = await res.json();
    const hit = Array.isArray(json?.results) ? json.results[0] : null;
    if (!hit) throw new Error('no match');
    return {
      query: trimmed,
      name: hit.name,
      state: hit.admin1,
      latitude: hit.latitude,
      longitude: hit.longitude,
      resolved: true,
    };
  } catch {
    return {
      query: trimmed,
      name: trimmed,
      latitude: Number.NaN,
      longitude: Number.NaN,
      resolved: false,
    };
  }
}

/* ------------------------------------------------------------------ *
 * FORWARD-LOOKING DEMAND  (the lead-time advantage)
 * ------------------------------------------------------------------ */

interface DailySeries {
  time: string[];
  temperature_2m_max?: number[];
  temperature_2m_min?: number[];
  wind_gusts_10m_max?: number[];
  precipitation_sum?: number[];
}

async function fetchDaily(
  endpoint: string,
  lat: number,
  lon: number,
  extra: Record<string, string>
): Promise<DailySeries | null> {
  const url = new URL(endpoint);
  url.searchParams.set('latitude', String(lat));
  url.searchParams.set('longitude', String(lon));
  url.searchParams.set(
    'daily',
    'temperature_2m_max,temperature_2m_min,wind_gusts_10m_max,precipitation_sum'
  );
  url.searchParams.set('timezone', 'auto');
  for (const [k, v] of Object.entries(extra)) url.searchParams.set(k, v);

  try {
    const res = await fetch(url.toString());
    if (!res.ok) return null;
    const json = await res.json();
    return (json?.daily ?? null) as DailySeries | null;
  } catch {
    return null;
  }
}

/**
 * A single qualifying day, before clustering.
 */
interface DayHit {
  date: string;
  offset: number;
  /** The measured value that tripped the threshold. */
  value: number;
}

type Category =
  | 'wind_severe'
  | 'wind_damaging'
  | 'heat_critical'
  | 'heat_stress'
  | 'freeze_burst'
  | 'cold_furnace'
  | 'heavy_rain';

/**
 * Groups consecutive qualifying days into one event.
 *
 * This matters: a 6-day heatwave is ONE demand event a contractor staffs for,
 * not six separate opportunities. Reporting it as six inflates every downstream
 * number and makes the tool look like it is padding results.
 */
function clusterConsecutive(hits: DayHit[]): DayHit[][] {
  if (!hits.length) return [];
  const sorted = [...hits].sort((a, b) => a.offset - b.offset);
  const clusters: DayHit[][] = [[sorted[0]]];
  for (let i = 1; i < sorted.length; i++) {
    const prev = clusters[clusters.length - 1];
    if (sorted[i].offset - prev[prev.length - 1].offset <= 1) prev.push(sorted[i]);
    else clusters.push([sorted[i]]);
  }
  return clusters;
}

function spanLabel(cluster: DayHit[]) {
  const first = cluster[0].date;
  const last = cluster[cluster.length - 1].date;
  return cluster.length === 1 ? first : `${first} → ${last} (${cluster.length} days)`;
}

function eventsFromSeries(
  daily: DailySeries,
  today: Date,
  horizon: Horizon
): StormEvent[] {
  const dates = daily.time ?? [];
  const hits: Record<Category, DayHit[]> = {
    wind_severe: [],
    wind_damaging: [],
    heat_critical: [],
    heat_stress: [],
    freeze_burst: [],
    cold_furnace: [],
    heavy_rain: [],
  };

  for (let i = 0; i < dates.length; i++) {
    const date = dates[i];
    const offset = daysBetween(today, new Date(`${date}T12:00:00Z`));
    const push = (c: Category, value: number) => hits[c].push({ date, offset, value });

    const gustKmh = daily.wind_gusts_10m_max?.[i];
    if (typeof gustKmh === 'number') {
      const mph = mphFromKmh(gustKmh);
      if (mph >= WIND_SEVERE_MPH) push('wind_severe', mph);
      else if (mph >= WIND_DAMAGING_MPH) push('wind_damaging', mph);
    }

    const maxC = daily.temperature_2m_max?.[i];
    if (typeof maxC === 'number') {
      const f = fFromC(maxC);
      if (f >= HEAT_AC_CRITICAL_F) push('heat_critical', f);
      else if (f >= HEAT_AC_STRESS_F) push('heat_stress', f);
    }

    const minC = daily.temperature_2m_min?.[i];
    if (typeof minC === 'number') {
      const f = fFromC(minC);
      if (f <= COLD_PIPE_BURST_F) push('freeze_burst', f);
      else if (f <= COLD_FURNACE_F) push('cold_furnace', f);
    }

    const rainMm = daily.precipitation_sum?.[i];
    if (typeof rainMm === 'number' && rainMm >= HEAVY_RAIN_MM) push('heavy_rain', rainMm);
  }

  const out: StormEvent[] = [];

  const emit = (
    category: Category,
    cluster: DayHit[],
    build: (peak: number, days: number, peakDate: string) => Omit<
      StormEvent,
      | 'id'
      | 'date'
      | 'horizon'
      | 'dayOffset'
      | 'confidence'
      | 'dateSpan'
      | 'dayCount'
      | 'claimable'
      | 'claimWindowDaysLeft'
    >
  ) => {
    const isLow = category === 'freeze_burst' || category === 'cold_furnace';
    const peakHit = cluster.reduce((best, h) =>
      isLow ? (h.value < best.value ? h : best) : h.value > best.value ? h : best
    );
    const built = build(peakHit.value, cluster.length, peakHit.date);
    // Claim windows only apply to insurable physical damage (wind/hail).
    const claimable = category === 'wind_severe' || category === 'wind_damaging';
    const claimLeft = CLAIM_WINDOW_DAYS + peakHit.offset;
    out.push({
      ...built,
      id: `${category}-${cluster[0].date}`,
      date: peakHit.date,
      dateSpan: spanLabel(cluster),
      dayCount: cluster.length,
      horizon,
      dayOffset: peakHit.offset,
      confidence: 'measured',
      claimable,
      claimWindowDaysLeft:
        claimable && horizon === 'past' && claimLeft > 0 ? claimLeft : undefined,
    });
  };

  for (const cluster of clusterConsecutive(hits.wind_severe)) {
    emit('wind_severe', cluster, (peak, days) => ({
      trade: 'roofing',
      headline:
        horizon === 'past'
          ? 'Severe wind event — roofs still inside claim window'
          : 'Severe wind event forecast',
      measurement: `Peak gusts ${peak.toFixed(0)} mph over ${days} day${days === 1 ? '' : 's'} (NWS severe threshold ${WIND_SEVERE_MPH} mph)`,
      why: 'Gusts at or above the severe threshold lift shingles, tear flashing and pull gutters. This damage is usually insurable.',
      action:
        horizon === 'past'
          ? 'Canvass these dates. Most homeowners have no idea they have claimable damage until someone inspects the roof.'
          : 'Pre-book inspection slots and line up crews before the phones start ringing.',
      severity: 'critical',
    }));
  }

  for (const cluster of clusterConsecutive(hits.wind_damaging)) {
    emit('wind_damaging', cluster, (peak, days) => ({
      trade: 'roofing',
      headline: 'Damaging wind — roof and gutter work likely',
      measurement: `Peak gusts ${peak.toFixed(0)} mph over ${days} day${days === 1 ? '' : 's'} (damage threshold ~${WIND_DAMAGING_MPH} mph)`,
      why: 'Below severe criteria but routinely enough for lifted shingles, bent flashing and detached gutters.',
      action: 'Worth a targeted door-knock or postcard drop offering free roof and gutter inspections.',
      severity: 'moderate',
    }));
  }

  for (const cluster of clusterConsecutive(hits.heat_critical)) {
    emit('heat_critical', cluster, (peak, days, peakDate) => ({
      trade: 'hvac',
      headline:
        days > 2 ? 'Extended heatwave — AC failure surge' : 'Extreme heat — AC failure surge',
      measurement: `Peak ${peak.toFixed(0)}°F on ${peakDate}, ${days} day${days === 1 ? '' : 's'} above ${HEAT_AC_CRITICAL_F}°F`,
      why: 'Older condensers fail under sustained extreme load. Emergency volume spikes and price sensitivity drops.',
      action:
        horizon === 'future'
          ? `Stock capacitors and contactors now, extend hours, and text your maintenance list before day one.`
          : 'Follow up with anyone you could not get to during this stretch — many are still running a marginal system.',
      severity: 'critical',
    }));
  }

  for (const cluster of clusterConsecutive(hits.heat_stress)) {
    emit('heat_stress', cluster, (peak, days) => ({
      trade: 'hvac',
      headline: 'Heat stress — tune-up and repair demand',
      measurement: `Peak ${peak.toFixed(0)}°F over ${days} day${days === 1 ? '' : 's'} (stress threshold ${HEAT_AC_STRESS_F}°F)`,
      why: 'The first hot stretch of a season is when neglected systems announce themselves.',
      action: 'Push tune-up offers to your existing list before competitors book out.',
      severity: 'high',
    }));
  }

  for (const cluster of clusterConsecutive(hits.freeze_burst)) {
    emit('freeze_burst', cluster, (peak, days) => ({
      trade: 'plumbing',
      headline: 'Hard freeze — burst pipe risk',
      measurement: `Low of ${peak.toFixed(0)}°F over ${days} day${days === 1 ? '' : 's'} (burst risk below ~${COLD_PIPE_BURST_F}°F)`,
      why: 'Uninsulated and exterior-wall pipes fail in the sustained low 20s. Bursts become water damage jobs.',
      action:
        horizon === 'future'
          ? 'Send freeze-prevention tips now. It books insulation work and earns goodwill before the emergency calls land.'
          : 'Check for slow leaks that started during this freeze and have not surfaced yet.',
      severity: 'critical',
    }));
  }

  for (const cluster of clusterConsecutive(hits.cold_furnace)) {
    emit('cold_furnace', cluster, (peak, days) => ({
      trade: 'hvac',
      headline: 'Freezing temps — heating demand',
      measurement: `Low of ${peak.toFixed(0)}°F over ${days} day${days === 1 ? '' : 's'} (freezing at ${COLD_FURNACE_F}°F)`,
      why: 'The first freeze of a season reliably produces no-heat calls from systems that sat unused all summer.',
      action: 'Promote furnace checks, prioritising homes with systems you already know are aging.',
      severity: 'moderate',
    }));
  }

  for (const cluster of clusterConsecutive(hits.heavy_rain)) {
    const total = cluster.reduce((a, h) => a + h.value, 0);
    emit('heavy_rain', cluster, (peak, days) => ({
      trade: 'restoration',
      headline: 'Heavy rainfall — water intrusion and drainage',
      measurement: `${total.toFixed(0)} mm (${(total / 25.4).toFixed(1)} in) across ${days} day${days === 1 ? '' : 's'}, peak ${(peak / 25.4).toFixed(1)} in`,
      why: 'Heavy rainfall drives basement seepage, sump failures and roof-leak discovery.',
      action: 'Target drainage, sump pump and leak-detection offers in low-lying parts of your area.',
      severity: total >= HEAVY_RAIN_MM * 3 ? 'high' : 'moderate',
    }));
  }

  return out;
}

/* ------------------------------------------------------------------ *
 * ACTIVE NWS ALERTS
 * ------------------------------------------------------------------ */

const ALERT_PATTERN = /thunderstorm|hail|wind|flood|tornado|winter|freeze|heat|ice|snow/i;

async function fetchActiveAlerts(lat: number, lon: number): Promise<ActiveAlert[]> {
  const url = new URL('https://api.weather.gov/alerts/active');
  url.searchParams.set('point', `${lat.toFixed(4)},${lon.toFixed(4)}`);
  try {
    const res = await fetch(url.toString(), {
      headers: { Accept: 'application/geo+json' },
    });
    if (!res.ok) return [];
    const json = await res.json();
    const features = Array.isArray(json?.features) ? json.features : [];
    return features
      .map((f: any) => f?.properties)
      .filter((p: any) => p && ALERT_PATTERN.test(String(p.event ?? '')))
      .slice(0, 12)
      .map((p: any, i: number) => ({
        id: String(p.id ?? `alert-${i}`),
        event: String(p.event ?? 'Weather alert'),
        severity: String(p.severity ?? 'Unknown'),
        urgency: String(p.urgency ?? 'Unknown'),
        headline: String(p.headline ?? p.event ?? ''),
        areaDesc: String(p.areaDesc ?? ''),
        effective: String(p.effective ?? ''),
        expires: String(p.expires ?? p.ends ?? ''),
      }));
  } catch {
    return [];
  }
}

/* ------------------------------------------------------------------ *
 * JOB VALUE — assumptions exposed, never hidden behind a score
 * ------------------------------------------------------------------ */

/**
 * Default average ticket per trade. These are STARTING POINTS the contractor is
 * expected to overwrite with their own real average ticket — which is the only
 * number that makes the estimate meaningful.
 *
 * Multiplying two wide guessed ranges together compounds the error and produces
 * a spread so wide it destroys credibility. So we use a single average ticket
 * and a modest confidence band instead.
 */
export const DEFAULT_AVG_TICKET: Record<Trade, number> = {
  roofing: 12_000,
  hvac: 1_500,
  plumbing: 900,
  restoration: 4_000,
};

/**
 * Expected jobs won per event, by severity. Deliberately conservative —
 * inflated conversion assumptions are how a projection becomes a fantasy.
 */
const JOBS_BY_SEVERITY: Record<StormEvent['severity'], number> = {
  critical: 2,
  high: 1,
  moderate: 0.5,
};

/** Confidence band applied around the point estimate. */
const BAND = 0.5;

export interface ValueParams {
  avgTicket?: Partial<Record<Trade, number>>;
}

export function estimateValue(
  events: StormEvent[],
  params: ValueParams = {}
): JobValueEstimate[] {
  const byTrade = new Map<Trade, StormEvent[]>();
  for (const e of events) {
    if (!byTrade.has(e.trade)) byTrade.set(e.trade, []);
    byTrade.get(e.trade)!.push(e);
  }

  const out: JobValueEstimate[] = [];
  for (const [trade, list] of byTrade) {
    const ticket = params.avgTicket?.[trade] ?? DEFAULT_AVG_TICKET[trade];
    const expectedJobs = list.reduce((a, e) => a + JOBS_BY_SEVERITY[e.severity], 0);
    const point = expectedJobs * ticket;
    const isCustom = params.avgTicket?.[trade] != null;

    out.push({
      trade,
      eventCount: list.length,
      assumptions: [
        `${list.length} qualifying event${list.length === 1 ? '' : 's'} measured from weather data (consecutive days grouped into one event)`,
        `Expected jobs: ${expectedJobs.toFixed(1)} — counting 2 per critical event, 1 per high, 0.5 per moderate`,
        `Average ticket: $${ticket.toLocaleString()}${isCustom ? ' (your number)' : ' (default — change this to your real average)'}`,
        `Range is the point estimate ±${BAND * 100}%`,
        'The weather is measured. The job count and ticket size are assumptions.',
      ],
      lowUsd: Math.round(point * (1 - BAND)),
      highUsd: Math.round(point * (1 + BAND)),
    });
  }
  return out.sort((a, b) => b.lowUsd - a.lowUsd);
}

/* ------------------------------------------------------------------ *
 * MAIN ENTRY POINT
 * ------------------------------------------------------------------ */

export async function buildStormIntelReport(query: string): Promise<StormIntelReport> {
  const area = await resolveServiceArea(query);
  const today = new Date();
  today.setUTCHours(12, 0, 0, 0);

  const sources: DataSourceStatus[] = [];
  const limitations: string[] = [];

  if (!area.resolved) {
    return {
      area,
      generatedAt: new Date().toISOString(),
      events: [],
      activeAlerts: [],
      valueEstimates: [],
      dataSources: [
        {
          name: 'Open-Meteo Geocoding',
          endpoint: 'geocoding-api.open-meteo.com',
          status: 'unavailable',
          detail: `Could not resolve "${query}" to coordinates. Try "City, State".`,
        },
      ],
      limitations: ['Location could not be resolved, so no weather data was retrieved.'],
    };
  }

  sources.push({
    name: 'Open-Meteo Geocoding',
    endpoint: 'geocoding-api.open-meteo.com',
    status: 'live',
    detail: `${area.name}${area.state ? `, ${area.state}` : ''} at ${area.latitude.toFixed(3)}, ${area.longitude.toFixed(3)}`,
  });

  const past = new Date(today.getTime() - LOOKBACK_DAYS * MS_PER_DAY);
  // Archive lags ~5 days behind real time.
  const archiveEnd = new Date(today.getTime() - 5 * MS_PER_DAY);

  const [forecast, archive, alerts] = await Promise.all([
    fetchDaily('https://api.open-meteo.com/v1/forecast', area.latitude, area.longitude, {
      forecast_days: String(FORECAST_DAYS),
    }),
    fetchDaily('https://archive-api.open-meteo.com/v1/archive', area.latitude, area.longitude, {
      start_date: isoDate(past),
      end_date: isoDate(archiveEnd),
    }),
    fetchActiveAlerts(area.latitude, area.longitude),
  ]);

  const events: StormEvent[] = [];

  if (forecast) {
    events.push(...eventsFromSeries(forecast, today, 'future'));
    sources.push({
      name: 'Open-Meteo Forecast',
      endpoint: 'api.open-meteo.com/v1/forecast',
      status: 'live',
      detail: `${FORECAST_DAYS}-day forward outlook — gusts, temperature extremes, precipitation`,
    });
  } else {
    sources.push({
      name: 'Open-Meteo Forecast',
      endpoint: 'api.open-meteo.com/v1/forecast',
      status: 'unavailable',
      detail: 'Forecast request failed.',
    });
    limitations.push('Forward-looking demand alerts unavailable — forecast request failed.');
  }

  if (archive) {
    events.push(...eventsFromSeries(archive, today, 'past'));
    sources.push({
      name: 'Open-Meteo Archive',
      endpoint: 'archive-api.open-meteo.com/v1/archive',
      status: 'live',
      detail: `${LOOKBACK_DAYS}-day lookback — past storms still inside the ${CLAIM_WINDOW_DAYS}-day claim window`,
    });
  } else {
    sources.push({
      name: 'Open-Meteo Archive',
      endpoint: 'archive-api.open-meteo.com/v1/archive',
      status: 'unavailable',
      detail: 'Archive request failed.',
    });
    limitations.push('Historical storm lookback unavailable — archive request failed.');
  }

  sources.push({
    name: 'NWS Active Alerts',
    endpoint: 'api.weather.gov/alerts/active',
    status: 'live',
    detail: `${alerts.length} active weather alert${alerts.length === 1 ? '' : 's'} for this point`,
  });

  limitations.push(
    'Hail size is not available from these free endpoints. Hail is the single biggest driver of roof claims, so treat wind as a proxy and confirm hail locally.',
    'Archive data lags roughly 5 days behind today.',
    'Wind gusts are measured at the nearest grid point, not at each address. Treat them as area-level, not property-level.',
    'Dollar figures combine measured weather with assumed close rates and ticket sizes. Substitute your own numbers.'
  );

  events.sort((a, b) => {
    const sev = { critical: 0, high: 1, moderate: 2 };
    if (sev[a.severity] !== sev[b.severity]) return sev[a.severity] - sev[b.severity];
    return Math.abs(a.dayOffset) - Math.abs(b.dayOffset);
  });

  return {
    area,
    generatedAt: new Date().toISOString(),
    events,
    activeAlerts: alerts,
    valueEstimates: estimateValue(events),
    dataSources: sources,
    limitations,
  };
}

export const THRESHOLDS = {
  WIND_SEVERE_MPH,
  WIND_DAMAGING_MPH,
  HEAT_AC_STRESS_F,
  HEAT_AC_CRITICAL_F,
  COLD_FURNACE_F,
  COLD_PIPE_BURST_F,
  HEAVY_RAIN_MM,
  CLAIM_WINDOW_DAYS,
  LOOKBACK_DAYS,
  FORECAST_DAYS,
};
