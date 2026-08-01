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

export type Trade =
  | 'roofing'
  | 'hvac'
  | 'plumbing'
  | 'restoration'
  | 'tree_service'
  | 'gutters'
  | 'solar'
  | 'windows_glass'
  | 'fencing'
  | 'painting'
  | 'concrete'
  | 'landscaping'
  | 'pest'
  | 'snow_ice'
  | 'air_quality'
  | 'foundation'
  // Recovered from the original realSignals industry list, which had these and
  // the rewrite dropped them.
  | 'electrical'
  | 'garage_doors';

export const TRADE_LABELS: Record<Trade, string> = {
  roofing: 'Roofing',
  hvac: 'HVAC',
  plumbing: 'Plumbing',
  restoration: 'Restoration',
  tree_service: 'Tree service',
  gutters: 'Gutters',
  solar: 'Solar',
  windows_glass: 'Windows & glass',
  fencing: 'Fencing',
  painting: 'Painting',
  concrete: 'Concrete & masonry',
  landscaping: 'Landscaping & irrigation',
  pest: 'Pest control',
  snow_ice: 'Snow & ice',
  air_quality: 'Air quality & duct',
  foundation: 'Foundation',
  electrical: 'Electrical',
  garage_doors: 'Garage doors',
};

export type Horizon = 'past' | 'now' | 'future';

import {
  fetchSpcReports,
  groupByStormDay,
  HAIL_CLAIMABLE_INCHES,
  type SpcStormDay,
} from './spcReports';

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
  /**
   * The specific jobs to sell off this event. "HVAC demand" is not actionable;
   * "AC capacitor and contactor replacement" is what you stock the truck with.
   */
  services: string[];
  /**
   * True when this is the first qualifying event of its kind after a long gap.
   * This matters more than magnitude: the first 100F day after a mild spring
   * breaks every marginal compressor at once, because they have all sat unused.
   * The tenth 100F day breaks far fewer, because the weak ones already failed.
   */
  firstOfSeason?: boolean;
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
  /** Ground-truth NOAA damage reports, grouped by storm day. The best evidence we have. */
  stormDays: SpcStormDay[];
  /** Stretches of good weather — for trades that need to WORK, not chase. */
  workWindows: WorkWindow[];
  /** Honest summary of what we could and could not measure. */
  limitations: string[];
}

/**
 * The inverse signal. Painters, concrete crews and roof installers do not need
 * to know when it stormed — they need to know when they can actually work.
 * Nobody sells this, and every one of those trades schedules around it manually.
 */
export interface WorkWindow {
  startDate: string;
  endDate: string;
  days: number;
  trades: Trade[];
  detail: string;
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
/** Service radius for NOAA ground-truth reports. A typical single-crew territory. */
const SPC_RADIUS_MILES = 40;
/** SPC lookback. One request per day per kind, so keep this interactive-friendly. */
const SPC_LOOKBACK_DAYS = 60;
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

interface GeoCandidate {
  name: string;
  admin1?: string;
  country_code?: string;
  population?: number;
  latitude: number;
  longitude: number;
}

/** Full state names and abbreviations, so we can detect "city state" input. */
const US_STATE_TOKENS = new Set([
  'al','ak','az','ar','ca','co','ct','de','fl','ga','hi','id','il','in','ia','ks','ky','la','me','md',
  'ma','mi','mn','ms','mo','mt','ne','nv','nh','nj','nm','ny','nc','nd','oh','ok','or','pa','ri','sc',
  'sd','tn','tx','ut','vt','va','wa','wv','wi','wy','dc',
  'alabama','alaska','arizona','arkansas','california','colorado','connecticut','delaware','florida',
  'georgia','hawaii','idaho','illinois','indiana','iowa','kansas','kentucky','louisiana','maine',
  'maryland','massachusetts','michigan','minnesota','mississippi','missouri','montana','nebraska',
  'nevada','ohio','oklahoma','oregon','pennsylvania','tennessee','texas','utah','vermont','virginia',
  'washington','wisconsin','wyoming',
]);

/**
 * Picks the best candidate rather than blindly taking the first.
 *
 * Open-Meteo returns matches in its own order, which is how a search for
 * "Bronx" resolved to Bronx, IDAHO (population ~0) instead of the Bronx in New
 * York. Preferring US results and then population fixes that class of error,
 * which would otherwise silently produce a report for the wrong place.
 */
function pickBestCandidate(results: GeoCandidate[]): GeoCandidate | null {
  if (!results.length) return null;
  return results
    .slice()
    .sort((a, b) => {
      const usA = a.country_code === 'US' ? 1 : 0;
      const usB = b.country_code === 'US' ? 1 : 0;
      if (usA !== usB) return usB - usA;
      return (b.population ?? 0) - (a.population ?? 0);
    })[0];
}

async function geocodeOnce(name: string): Promise<GeoCandidate | null> {
  const url = new URL('https://geocoding-api.open-meteo.com/v1/search');
  url.searchParams.set('name', name);
  url.searchParams.set('count', '10');
  url.searchParams.set('language', 'en');
  url.searchParams.set('format', 'json');
  try {
    const res = await fetch(url.toString());
    if (!res.ok) return null;
    const json = await res.json();
    const results = Array.isArray(json?.results) ? (json.results as GeoCandidate[]) : [];
    return pickBestCandidate(results);
  } catch {
    return null;
  }
}

/**
 * Builds progressively simpler queries. The geocoder does not accept
 * "san diego california" as one string, so we also try dropping a trailing
 * state token, then fall back to the first one or two words.
 */
function candidateQueries(raw: string): string[] {
  const text = raw.toLowerCase().replace(/[,]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!text) return [];
  const tokens = text.split(' ');
  const queries = [text];

  // "san diego california" -> "san diego"
  if (tokens.length > 1 && US_STATE_TOKENS.has(tokens[tokens.length - 1])) {
    queries.push(tokens.slice(0, -1).join(' '));
  }
  // "new york bronx" -> "bronx" (the more specific locality is often last)
  if (tokens.length > 1) queries.push(tokens[tokens.length - 1]);
  // "kansas city missouri" -> "kansas city"
  if (tokens.length > 2) queries.push(tokens.slice(0, 2).join(' '));
  queries.push(tokens[0]);

  return [...new Set(queries)].filter(Boolean);
}

export async function resolveServiceArea(query: string): Promise<ServiceArea> {
  const trimmed = query.trim();

  for (const candidate of candidateQueries(trimmed)) {
    const hit = await geocodeOnce(candidate);
    if (hit) {
      return {
        query: trimmed,
        name: hit.name,
        state: hit.admin1,
        latitude: hit.latitude,
        longitude: hit.longitude,
        resolved: true,
      };
    }
  }

  return {
    query: trimmed,
    name: trimmed,
    latitude: Number.NaN,
    longitude: Number.NaN,
    resolved: false,
  };
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
  snowfall_sum?: number[];
  precipitation_hours?: number[];
  relative_humidity_2m_mean?: number[];
  apparent_temperature_max?: number[];
  et0_fao_evapotranspiration?: number[];
  wind_speed_10m_max?: number[];
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
    [
      'temperature_2m_max',
      'temperature_2m_min',
      'wind_gusts_10m_max',
      'precipitation_sum',
      // added to support the wider trade list
      'snowfall_sum',
      'precipitation_hours',
      'relative_humidity_2m_mean',
      'apparent_temperature_max',
      'et0_fao_evapotranspiration',
      'wind_speed_10m_max',
    ].join(',')
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

/**
 * Days of quiet required before an event counts as "first of season".
 * Two weeks is enough for equipment to have been idle and for homeowners to
 * have stopped thinking about it.
 */
const FIRST_OF_SEASON_GAP_DAYS = 21;

/**
 * Marks the first cluster in a series, and any cluster preceded by a long gap,
 * as first-of-season. Equipment failure is concentrated in these windows.
 */
function markFirstOfSeason(clusters: DayHit[][]): boolean[] {
  return clusters.map((cluster, i) => {
    if (i === 0) return true;
    const prev = clusters[i - 1];
    const gap = cluster[0].offset - prev[prev.length - 1].offset;
    return gap >= FIRST_OF_SEASON_GAP_DAYS;
  });
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
      | 'firstOfSeason'
    >,
    firstOfSeason = false
  ) => {
    const isLow = category === 'freeze_burst' || category === 'cold_furnace';
    const peakHit = cluster.reduce((best, h) =>
      isLow ? (h.value < best.value ? h : best) : h.value > best.value ? h : best
    );
    const built = build(peakHit.value, cluster.length, peakHit.date);
    // Claim windows only apply to insurable physical damage (wind/hail).
    const claimable = category === 'wind_severe' || category === 'wind_damaging';
    const claimLeft = CLAIM_WINDOW_DAYS + peakHit.offset;
    // First-of-season events get bumped a severity level, because failure
    // volume is concentrated there rather than spread across the season.
    const severity: StormEvent['severity'] =
      firstOfSeason && built.severity === 'high'
        ? 'critical'
        : firstOfSeason && built.severity === 'moderate'
          ? 'high'
          : built.severity;

    out.push({
      ...built,
      severity,
      id: `${category}-${cluster[0].date}`,
      date: peakHit.date,
      dateSpan: spanLabel(cluster),
      dayCount: cluster.length,
      horizon,
      dayOffset: peakHit.offset,
      confidence: 'measured',
      claimable,
      firstOfSeason: firstOfSeason || undefined,
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
      services: [
        'Free storm damage roof inspection',
        'Shingle replacement',
        'Flashing and ridge cap repair',
        'Emergency tarping',
        'Insurance claim documentation',
        'Full roof replacement',
      ],
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
      services: [
        'Roof and gutter inspection',
        'Gutter re-securing',
        'Individual shingle repair',
        'Downspout reattachment',
      ],
      action: 'Worth a targeted door-knock or postcard drop offering free roof and gutter inspections.',
      severity: 'moderate',
    }));
  }

  {
    const clusters = clusterConsecutive(hits.heat_critical);
    const firsts = markFirstOfSeason(clusters);
    clusters.forEach((cluster, i) =>
      emit(
        'heat_critical',
        cluster,
        (peak, days, peakDate) => ({
          trade: 'hvac',
          headline: firsts[i]
            ? 'First extreme heat of the season — peak AC failure window'
            : days > 2
              ? 'Extended heatwave — AC failure surge'
              : 'Extreme heat — AC failure surge',
          measurement: `Peak ${peak.toFixed(0)}°F on ${peakDate}, ${days} day${days === 1 ? '' : 's'} above ${HEAT_AC_CRITICAL_F}°F`,
          why: firsts[i]
            ? 'The first extreme heat after a mild stretch breaks every marginal compressor at once, because they have all been sitting idle. Later heatwaves produce far fewer failures — the weak systems have already died.'
            : 'Older condensers fail under sustained extreme load. Emergency volume spikes and price sensitivity drops.',
          action:
            horizon === 'future'
              ? 'Stock capacitors, contactors and condenser fan motors now, extend hours, and text your maintenance list before day one.'
              : 'Follow up with anyone you could not reach during this stretch — many are still limping along on a marginal system.',
          services: [
            'Emergency AC repair',
            'Capacitor replacement',
            'Contactor replacement',
            'Condenser fan motor',
            'Refrigerant leak diagnosis',
            'Full system replacement (for units 12+ years old)',
          ],
          severity: 'critical',
        }),
        firsts[i]
      )
    );
  }

  {
    const clusters = clusterConsecutive(hits.heat_stress);
    const firsts = markFirstOfSeason(clusters);
    clusters.forEach((cluster, i) =>
      emit(
        'heat_stress',
        cluster,
        (peak, days) => ({
          trade: 'hvac',
          headline: firsts[i]
            ? 'First real heat of the season — tune-up window'
            : 'Heat stress — tune-up and repair demand',
          measurement: `Peak ${peak.toFixed(0)}°F over ${days} day${days === 1 ? '' : 's'} (stress threshold ${HEAT_AC_STRESS_F}°F)`,
          why: firsts[i]
            ? 'This is the week homeowners first switch the AC on and discover it is weak. Highest tune-up conversion of the year, and it happens before your competitors are busy.'
            : 'Sustained heat surfaces neglected systems that were coasting.',
          action: 'Push tune-up offers to your existing list now, before you are booked out and forced to turn away replacements.',
          services: [
            'AC tune-up / seasonal service',
            'Coil cleaning',
            'Refrigerant top-up',
            'Thermostat upgrade',
            'Maintenance plan enrolment',
          ],
          severity: 'high',
        }),
        firsts[i]
      )
    );
  }

  for (const cluster of clusterConsecutive(hits.freeze_burst)) {
    emit('freeze_burst', cluster, (peak, days) => ({
      trade: 'plumbing',
      headline: 'Hard freeze — burst pipe risk',
      measurement: `Low of ${peak.toFixed(0)}°F over ${days} day${days === 1 ? '' : 's'} (burst risk below ~${COLD_PIPE_BURST_F}°F)`,
      why: 'Uninsulated and exterior-wall pipes fail in the sustained low 20s. Bursts become water damage jobs.',
      services: [
        'Emergency burst pipe repair',
        'Pipe insulation / heat tape',
        'Outdoor spigot and irrigation winterisation',
        'Water shut-off valve replacement',
        'Water damage mitigation referral',
      ],
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
      services: [
        'No-heat emergency call',
        'Furnace tune-up and safety inspection',
        'Ignitor / flame sensor replacement',
        'Heat exchanger inspection',
        'Furnace replacement (units 15+ years old)',
      ],
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
      services: [
        'Water extraction and drying',
        'Sump pump repair or replacement',
        'Basement waterproofing',
        'Roof leak detection',
        'Mould inspection (48-72h after intrusion)',
      ],
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
  tree_service: 1_200,
  gutters: 1_400,
  solar: 9_000,
  windows_glass: 1_800,
  fencing: 3_500,
  painting: 4_000,
  concrete: 5_000,
  landscaping: 800,
  pest: 400,
  snow_ice: 350,
  air_quality: 700,
  foundation: 8_000,
  electrical: 1_100,
  garage_doors: 1_300,
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
 * EVENTS FROM GROUND-TRUTH NOAA REPORTS
 *
 * These are the strongest events in the product because they are OBSERVED,
 * not modelled. "1.75 inch hail reported 4 miles from here on June 26" is
 * evidence. "The model says gusts were elevated" is a guess.
 * ------------------------------------------------------------------ */

/** Services to sell off observed hail, by trade. */
const HAIL_SERVICES: Partial<Record<Trade, string[]>> = {
  roofing: [
    'Free hail damage inspection',
    'Insurance claim documentation and adjuster meeting',
    'Shingle replacement',
    'Ridge vent and flashing repair',
    'Full roof replacement',
  ],
  solar: [
    'Solar panel hail damage inspection',
    'Microcrack / output testing',
    'Panel replacement',
    'Racking and flashing inspection',
  ],
  windows_glass: [
    'Window and skylight inspection',
    'Cracked pane replacement',
    'Screen replacement',
    'Emergency board-up',
  ],
};

/** Services to sell off observed wind damage, by trade. */
const WIND_SERVICES: Partial<Record<Trade, string[]>> = {
  tree_service: [
    'Emergency limb and tree removal',
    'Hazard tree assessment',
    'Stump grinding',
    'Crown thinning to reduce future wind load',
  ],
  roofing: [
    'Free wind damage inspection',
    'Shingle and flashing repair',
    'Emergency tarping',
    'Insurance claim documentation',
  ],
  fencing: [
    'Fence panel replacement',
    'Post resetting',
    'Gate realignment',
    'Full fence replacement',
  ],
  gutters: [
    'Gutter re-securing and realignment',
    'Downspout reattachment',
    'Gutter replacement',
    'Debris clearing',
  ],
  garage_doors: [
    'Wind-damaged panel replacement',
    'Track and roller realignment',
    'Opener repair after power surge',
    'Wind-rated door upgrade',
  ],
  electrical: [
    'Storm damage electrical inspection',
    'Service mast and meter repair',
    'Surge protection installation',
    'Standby generator quote',
    'Panel replacement after water ingress',
  ],
};

function eventsFromStormDays(days: SpcStormDay[], today: Date): StormEvent[] {
  const out: StormEvent[] = [];

  for (const day of days) {
    const offset = daysBetween(today, new Date(`${day.date}T12:00:00Z`));
    const claimLeft = CLAIM_WINDOW_DAYS + offset;
    if (claimLeft <= 0) continue;

    const near = `nearest report ${day.nearestMiles.toFixed(1)} mi away`;
    const proof = day.sampleComment ? ` Observed: "${day.sampleComment.slice(0, 120)}"` : '';

    // ---- HAIL: the highest-value signal in the entire product ----
    if (typeof day.maxHailInches === 'number') {
      const size = day.maxHailInches;
      const claimable = size >= HAIL_CLAIMABLE_INCHES;
      for (const trade of ['roofing', 'solar', 'windows_glass'] as Trade[]) {
        // Only roofing gets the small-hail events; glass and panels need real size.
        if (!claimable && trade !== 'roofing') continue;
        out.push({
          id: `spc-hail-${day.date}-${trade}`,
          date: day.date,
          dateSpan: day.date,
          dayCount: 1,
          horizon: 'past',
          dayOffset: offset,
          trade,
          headline: claimable
            ? `Claimable hail — ${size.toFixed(2)}" reported`
            : `Hail reported — ${size.toFixed(2)}"`,
          measurement: `NOAA storm reports: max hail ${size.toFixed(2)}" across ${day.reportCount} report${day.reportCount === 1 ? '' : 's'}, ${near}`,
          why: claimable
            ? `Hail at or above ${HAIL_CLAIMABLE_INCHES.toFixed(2)}" is the practical threshold for insurable shingle damage. This is observed ground truth, not a model estimate.`
            : `Below the ${HAIL_CLAIMABLE_INCHES.toFixed(2)}" claim threshold but still causes cosmetic damage worth inspecting.`,
          action: claimable
            ? `Canvass this date. You can cite the NOAA report as proof of a storm event at this location.${proof}`
            : `Worth an inspection offer, but set expectations — this may not support a full claim.${proof}`,
          services: HAIL_SERVICES[trade] ?? ['Storm damage inspection'],
          severity: size >= 1.75 ? 'critical' : claimable ? 'high' : 'moderate',
          confidence: 'measured',
          claimable: true,
          claimWindowDaysLeft: claimLeft,
        });
      }
    }

    // ---- OBSERVED WIND DAMAGE -> tree service, fencing, gutters, roofing ----
    if (typeof day.maxWindMph === 'number' && day.maxWindMph >= WIND_DAMAGING_MPH) {
      const mph = day.maxWindMph;
      // Severe wind takes out garage door panels and service masts too, and
      // outages drive standby generator quotes for electricians.
      const trades: Trade[] = mph >= WIND_SEVERE_MPH
        ? ['tree_service', 'roofing', 'fencing', 'gutters', 'garage_doors', 'electrical']
        : ['tree_service', 'gutters'];
      for (const trade of trades) {
        out.push({
          id: `spc-wind-${day.date}-${trade}`,
          date: day.date,
          dateSpan: day.date,
          dayCount: 1,
          horizon: 'past',
          dayOffset: offset,
          trade,
          headline: `Observed wind damage — ${mph} mph reported`,
          measurement: `NOAA storm reports: peak measured wind ${mph} mph, ${day.reportCount} report${day.reportCount === 1 ? '' : 's'}, ${near}`,
          why: 'These are human and instrument reports of actual damage, not a forecast. Downed limbs, fencing and gutters cluster in exactly these areas.',
          action: `Work the streets named in the reports first — damage is spatially clustered.${proof}`,
          services: WIND_SERVICES[trade] ?? ['Storm damage inspection'],
          severity: mph >= 70 ? 'critical' : 'high',
          confidence: 'measured',
          claimable: true,
          claimWindowDaysLeft: claimLeft,
        });
      }
    }

    // ---- TORNADO -> restoration ----
    if (day.tornadoCount > 0) {
      out.push({
        id: `spc-torn-${day.date}`,
        date: day.date,
        dateSpan: day.date,
        dayCount: 1,
        horizon: 'past',
        dayOffset: offset,
        trade: 'restoration',
        headline: `Tornado reported — ${day.tornadoCount} report${day.tornadoCount === 1 ? '' : 's'}`,
        measurement: `NOAA tornado reports within radius, ${near}`,
        why: 'Tornado damage is severe, concentrated and almost always insured.',
        action:
          'Check state rules before soliciting. Many states restrict contractor solicitation after a declared disaster.',
        services: [
          'Emergency board-up and tarping',
          'Debris removal',
          'Structural drying',
          'Contents pack-out',
          'Full rebuild coordination',
        ],
        severity: 'critical',
        confidence: 'measured',
        claimable: true,
        claimWindowDaysLeft: claimLeft,
      });
    }
  }

  return out;
}

/* ------------------------------------------------------------------ *
 * WORK WINDOWS — the inverse signal
 * ------------------------------------------------------------------ */

/** Exterior paint, concrete and roof installs need dry, mild, low-wind days. */
function findWorkWindows(daily: DailySeries, today: Date): WorkWindow[] {
  const dates = daily.time ?? [];
  const good: { date: string; offset: number }[] = [];

  for (let i = 0; i < dates.length; i++) {
    const rain = daily.precipitation_sum?.[i] ?? 0;
    const gust = daily.wind_gusts_10m_max?.[i];
    const maxC = daily.temperature_2m_max?.[i];
    const minC = daily.temperature_2m_min?.[i];
    if (maxC == null || minC == null) continue;
    const maxF = fFromC(maxC);
    const minF = fFromC(minC);
    const gustMph = gust != null ? mphFromKmh(gust) : 0;

    // Paint needs dry, above ~50F overnight, below ~90F, and not windy.
    const dry = rain < 1;
    const mild = minF >= 50 && maxF <= 92;
    const calm = gustMph < 25;
    if (dry && mild && calm) {
      const offset = daysBetween(today, new Date(`${dates[i]}T12:00:00Z`));
      if (offset >= 0) good.push({ date: dates[i], offset });
    }
  }

  const windows: WorkWindow[] = [];
  for (const cluster of clusterConsecutive(good.map((g) => ({ ...g, value: 1 })))) {
    if (cluster.length < 2) continue;
    windows.push({
      startDate: cluster[0].date,
      endDate: cluster[cluster.length - 1].date,
      days: cluster.length,
      trades: ['painting', 'concrete', 'roofing', 'fencing'],
      detail: `${cluster.length} consecutive days dry, 50-92°F, gusts under 25 mph — bookable exterior work`,
    });
  }
  return windows.sort((a, b) => b.days - a.days);
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
      stormDays: [],
      workWindows: [],
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

  const [forecast, archive, alerts, spc] = await Promise.all([
    fetchDaily('https://api.open-meteo.com/v1/forecast', area.latitude, area.longitude, {
      forecast_days: String(FORECAST_DAYS),
    }),
    fetchDaily('https://archive-api.open-meteo.com/v1/archive', area.latitude, area.longitude, {
      start_date: isoDate(past),
      end_date: isoDate(archiveEnd),
    }),
    fetchActiveAlerts(area.latitude, area.longitude),
    fetchSpcReports({
      latitude: area.latitude,
      longitude: area.longitude,
      radiusMiles: SPC_RADIUS_MILES,
      days: SPC_LOOKBACK_DAYS,
      kinds: ['hail', 'wind', 'torn'],
    }),
  ]);

  const events: StormEvent[] = [];

  // Ground-truth NOAA reports first — this is the strongest evidence we have.
  const stormDays = groupByStormDay(spc.reports);
  events.push(...eventsFromStormDays(stormDays, today));
  const claimableHailDays = stormDays.filter((d) => d.claimableHail).length;
  sources.push({
    name: 'NOAA Storm Prediction Center',
    endpoint: 'spc.noaa.gov/climo/reports',
    status: 'live',
    detail: `${spc.reports.length} observed damage report${spc.reports.length === 1 ? '' : 's'} within ${SPC_RADIUS_MILES} mi over ${SPC_LOOKBACK_DAYS} days · ${stormDays.length} storm days · ${claimableHailDays} with claimable hail`,
  });

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

  const workWindows = forecast ? findWorkWindows(forecast, today) : [];

  limitations.push(
    `NOAA reports are spotter and instrument observations, so coverage depends on someone being there to report it. Absence of a report is not proof there was no hail.`,
    `NOAA reports are filtered to ${SPC_RADIUS_MILES} miles of the geocoded point and the last ${SPC_LOOKBACK_DAYS} days. Widen or narrow to match your real service area.`,
    'Open-Meteo wind and temperature are modelled at the nearest grid point, not measured at each address. Treat them as area-level.',
    'Archive data lags roughly 5 days behind today.',
    'Pollen data is not available for US locations from this provider.',
    'Dollar figures combine measured weather with assumed close rates and ticket sizes. Substitute your own numbers.',
    'Check your state rules before soliciting after a storm. Many restrict contractor solicitation after a declared disaster, and discussing a claim on a homeowner\u2019s behalf can require a public adjuster licence.'
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
    stormDays,
    workWindows,
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
