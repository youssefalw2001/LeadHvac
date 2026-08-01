/**
 * NOAA STORM PREDICTION CENTER — GROUND TRUTH DAMAGE REPORTS
 * ==========================================================
 *
 * This is the most valuable data source in the product, and it is free.
 *
 * Open-Meteo gives us MODELLED weather at a grid point. SPC gives us
 * OBSERVED damage: a human or instrument reported hail of a specific size at a
 * specific coordinate at a specific time. For selling a roof, "1.75 inch hail
 * was reported 2 miles from this address on July 12" is a completely different
 * class of evidence than "the model says gusts were high that day."
 *
 * Endpoint (CORS enabled, no key):
 *   https://www.spc.noaa.gov/climo/reports/YYMMDD_rpts_hail.csv
 *   https://www.spc.noaa.gov/climo/reports/YYMMDD_rpts_wind.csv
 *   https://www.spc.noaa.gov/climo/reports/YYMMDD_rpts_torn.csv
 *
 * Formats:
 *   hail  Time,Size,Location,County,State,Lat,Lon,Comments   Size = hundredths of an inch
 *   wind  Time,Speed,Location,County,State,Lat,Lon,Comments  Speed = mph, "UNK", or "G##"
 *   torn  Time,F_Scale,Location,County,State,Lat,Lon,Comments
 *
 * NOTE ON DATES: SPC organises by "convective day", 12Z to 12Z. The file dated
 * X covers 12:00 UTC on day X through 12:00 UTC on day X+1. We surface the file
 * date, which is the convention the industry already uses.
 */

export type SpcKind = 'hail' | 'wind' | 'torn';

export interface SpcReport {
  kind: SpcKind;
  /** Convective day the report belongs to (YYYY-MM-DD). */
  date: string;
  /** Raw HHMM as published (UTC-based convective day clock). */
  time: string;
  /** Hail diameter in inches. Only for kind === 'hail'. */
  hailInches?: number;
  /** Wind speed in mph when known. Only for kind === 'wind'. */
  windMph?: number;
  /** Tornado scale string, e.g. "EF1". Only for kind === 'torn'. */
  fScale?: string;
  location: string;
  county: string;
  state: string;
  latitude: number;
  longitude: number;
  comments: string;
  /** Miles from the queried point. */
  distanceMiles: number;
}

/**
 * The insurance industry's practical threshold for hail that damages asphalt
 * shingles badly enough to support a claim. 1.00" is the widely used line;
 * 0.75" was the old NWS severe criterion and still causes cosmetic damage.
 */
export const HAIL_CLAIMABLE_INCHES = 1.0;
export const HAIL_NOTABLE_INCHES = 0.75;

const EARTH_RADIUS_MILES = 3958.8;

export function haversineMiles(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_MILES * Math.asin(Math.sqrt(a));
}

function spcTag(date: Date): string {
  const yy = String(date.getUTCFullYear()).slice(2);
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  return `${yy}${mm}${dd}`;
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * SPC CSVs occasionally contain repeated header rows where sections are
 * concatenated, and quoted comment fields containing commas.
 */
function parseSpcCsv(text: string): string[][] {
  const rows: string[][] = [];
  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim();
    if (!line) continue;
    if (line.startsWith('Time,')) continue; // header, possibly repeated
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

function parseWindSpeed(raw: string): number | undefined {
  const s = raw.trim().toUpperCase();
  if (!s || s === 'UNK') return undefined;
  // "G61" denotes a measured gust
  const m = s.match(/^G?(\d+(?:\.\d+)?)$/);
  if (!m) return undefined;
  const v = Number(m[1]);
  return Number.isFinite(v) ? v : undefined;
}

async function fetchOneDay(
  kind: SpcKind,
  date: Date,
  centerLat: number,
  centerLon: number,
  radiusMiles: number
): Promise<SpcReport[]> {
  const url = `https://www.spc.noaa.gov/climo/reports/${spcTag(date)}_rpts_${kind}.csv`;
  let text: string;
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    text = await res.text();
    // A 404 page would be HTML; guard against parsing it as CSV.
    if (text.trimStart().startsWith('<')) return [];
  } catch {
    return [];
  }

  const out: SpcReport[] = [];
  for (const cells of parseSpcCsv(text)) {
    const [time, magnitude, location, county, state, latRaw, lonRaw, ...rest] = cells;
    const latitude = Number(latRaw);
    const longitude = Number(lonRaw);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) continue;

    const distanceMiles = haversineMiles(centerLat, centerLon, latitude, longitude);
    if (distanceMiles > radiusMiles) continue;

    const base = {
      kind,
      date: isoDate(date),
      time: time.trim(),
      location: location.trim(),
      county: county.trim(),
      state: state.trim(),
      latitude,
      longitude,
      comments: rest.join(',').trim(),
      distanceMiles,
    };

    if (kind === 'hail') {
      const hundredths = Number(magnitude);
      if (!Number.isFinite(hundredths)) continue;
      out.push({ ...base, hailInches: hundredths / 100 });
    } else if (kind === 'wind') {
      out.push({ ...base, windMph: parseWindSpeed(magnitude) });
    } else {
      out.push({ ...base, fScale: magnitude.trim() || 'EFU' });
    }
  }
  return out;
}

export interface SpcQuery {
  latitude: number;
  longitude: number;
  /** Service radius in miles. 25 is a typical single-crew territory. */
  radiusMiles?: number;
  /** How many days back to scan. SPC keeps files for years. */
  days?: number;
  kinds?: SpcKind[];
  /** Max parallel requests, to stay polite to a government server. */
  concurrency?: number;
}

export interface SpcResult {
  reports: SpcReport[];
  daysScanned: number;
  requestsFailed: number;
  radiusMiles: number;
}

/**
 * Pulls SPC reports for a rolling window and filters to a service radius.
 *
 * One request per day per kind, so a 60-day hail+wind scan is 120 requests.
 * They are small CSVs and we cap concurrency, but callers should prefer a
 * shorter window for interactive use and a longer one for a background job.
 */
export async function fetchSpcReports(query: SpcQuery): Promise<SpcResult> {
  const {
    latitude,
    longitude,
    radiusMiles = 25,
    days = 60,
    kinds = ['hail', 'wind', 'torn'],
    concurrency = 6,
  } = query;

  const jobs: { kind: SpcKind; date: Date }[] = [];
  for (let i = 1; i <= days; i++) {
    const date = new Date(Date.now() - i * 86_400_000);
    for (const kind of kinds) jobs.push({ kind, date });
  }

  const reports: SpcReport[] = [];
  let requestsFailed = 0;
  let cursor = 0;

  async function worker() {
    while (cursor < jobs.length) {
      const job = jobs[cursor++];
      try {
        const found = await fetchOneDay(job.kind, job.date, latitude, longitude, radiusMiles);
        reports.push(...found);
      } catch {
        requestsFailed++;
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, jobs.length) }, worker));

  // Most severe first, then most recent.
  reports.sort((a, b) => {
    const mag = (r: SpcReport) => r.hailInches ?? (r.windMph ? r.windMph / 60 : 0.5);
    const diff = mag(b) - mag(a);
    if (Math.abs(diff) > 0.001) return diff;
    return b.date.localeCompare(a.date);
  });

  return { reports, daysScanned: days, requestsFailed, radiusMiles };
}

/** Groups reports into distinct storm days so a single storm is one event. */
export interface SpcStormDay {
  date: string;
  reportCount: number
  maxHailInches?: number;
  maxWindMph?: number;
  tornadoCount: number;
  claimableHail: boolean;
  nearestMiles: number;
  /** A representative human-written observation, useful as proof in a pitch. */
  sampleComment?: string;
  reports: SpcReport[];
}

export function groupByStormDay(reports: SpcReport[]): SpcStormDay[] {
  const byDate = new Map<string, SpcReport[]>();
  for (const r of reports) {
    if (!byDate.has(r.date)) byDate.set(r.date, []);
    byDate.get(r.date)!.push(r);
  }

  const days: SpcStormDay[] = [];
  for (const [date, list] of byDate) {
    const hail = list.filter((r) => typeof r.hailInches === 'number').map((r) => r.hailInches!);
    const wind = list.filter((r) => typeof r.windMph === 'number').map((r) => r.windMph!);
    const maxHailInches = hail.length ? Math.max(...hail) : undefined;
    const withComment = list.find((r) => r.comments && r.comments.length > 12);
    days.push({
      date,
      reportCount: list.length,
      maxHailInches,
      maxWindMph: wind.length ? Math.max(...wind) : undefined,
      tornadoCount: list.filter((r) => r.kind === 'torn').length,
      claimableHail: (maxHailInches ?? 0) >= HAIL_CLAIMABLE_INCHES,
      nearestMiles: Math.min(...list.map((r) => r.distanceMiles)),
      sampleComment: withComment?.comments,
      reports: list,
    });
  }

  return days.sort((a, b) => b.date.localeCompare(a.date));
}
