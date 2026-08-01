#!/usr/bin/env node
/* Probe every candidate FREE data source for the storm engine.
   Critical question per source: (a) does it work, (b) what fields, (c) CORS?
   CORS matters because this app has no backend — the browser calls directly. */

const LAT = 32.7831, LON = -96.8067; // Dallas
const pad = (s, n = 34) => String(s).padEnd(n);
const OK = '\x1b[32mOK  \x1b[0m';
const NO = '\x1b[31mFAIL\x1b[0m';
const WARN = '\x1b[33mWARN\x1b[0m';

async function probe(name, url, opts = {}) {
  try {
    const res = await fetch(url, opts);
    const cors = res.headers.get('access-control-allow-origin');
    const ct = res.headers.get('content-type') || '';
    const body = await res.text();
    return { name, url, status: res.status, ok: res.ok, cors, ct, body };
  } catch (e) {
    return { name, url, status: 0, ok: false, cors: null, ct: '', body: '', err: String(e) };
  }
}

function report(r, extra = '') {
  const corsFlag = r.cors === '*' ? 'CORS *' : r.cors ? `CORS ${r.cors}` : 'NO CORS HEADER';
  const mark = !r.ok ? NO : r.cors ? OK : WARN;
  console.log(`${mark} ${pad(r.name)} HTTP ${r.status}  ${pad(corsFlag, 18)} ${extra}`);
}

console.log('='.repeat(96));
console.log('FREE DATA SOURCE PROBE  —  Dallas, TX');
console.log('='.repeat(96));

/* ---------- 1. NOAA SPC STORM REPORTS (the hail unlock) ---------- */
console.log('\n1. NOAA STORM PREDICTION CENTER — actual hail sizes, wind reports, tornadoes');
console.log('-'.repeat(96));

const yesterday = new Date(Date.now() - 86400000);
const yy = String(yesterday.getUTCFullYear()).slice(2);
const mm = String(yesterday.getUTCMonth() + 1).padStart(2, '0');
const dd = String(yesterday.getUTCDate()).padStart(2, '0');

for (const kind of ['hail', 'wind', 'torn']) {
  const r = await probe(`SPC ${kind} (${yy}${mm}${dd})`, `https://www.spc.noaa.gov/climo/reports/${yy}${mm}${dd}_rpts_${kind}.csv`);
  const lines = r.body.split('\n').filter(Boolean);
  report(r, `${lines.length} lines`);
  if (r.ok && lines.length) {
    console.log(`       header: ${lines[0].slice(0, 90)}`);
    if (lines[1]) console.log(`       row:    ${lines[1].slice(0, 90)}`);
  }
}

// also try the rolling "yesterday" / "today" aliases
for (const alias of ['today', 'yesterday']) {
  const r = await probe(`SPC ${alias}_rpts_hail`, `https://www.spc.noaa.gov/climo/reports/${alias}_rpts_hail.csv`);
  const lines = r.body.split('\n').filter(Boolean);
  report(r, `${lines.length} lines`);
}

/* ---------- 2. OPEN-METEO AIR QUALITY (pollen + smoke) ---------- */
console.log('\n2. OPEN-METEO AIR QUALITY — pollen, PM2.5, smoke  (unlocks new trades)');
console.log('-'.repeat(96));
{
  const u = new URL('https://air-quality-api.open-meteo.com/v1/air-quality');
  u.searchParams.set('latitude', LAT); u.searchParams.set('longitude', LON);
  u.searchParams.set('daily', 'pm2_5_max,pm10_max,ragweed_pollen_max,grass_pollen_max,birch_pollen_max,alder_pollen_max,mugwort_pollen_max,olive_pollen_max,uv_index_max');
  u.searchParams.set('timezone', 'auto');
  u.searchParams.set('forecast_days', '7');
  const r = await probe('air-quality daily', u.toString());
  report(r);
  if (r.ok) {
    const j = JSON.parse(r.body);
    const d = j.daily || {};
    for (const k of Object.keys(d)) {
      if (k === 'time') continue;
      const vals = d[k].filter((v) => v != null);
      console.log(`       ${pad(k, 26)} ${vals.length ? `${Math.min(...vals)} .. ${Math.max(...vals)}` : 'all null'}`);
    }
  }
}

/* ---------- 3. OPEN-METEO FLOOD ---------- */
console.log('\n3. OPEN-METEO FLOOD — river discharge  (basement/restoration)');
console.log('-'.repeat(96));
{
  const u = new URL('https://flood-api.open-meteo.com/v1/flood');
  u.searchParams.set('latitude', LAT); u.searchParams.set('longitude', LON);
  u.searchParams.set('daily', 'river_discharge,river_discharge_mean');
  const r = await probe('flood river_discharge', u.toString());
  report(r);
  if (r.ok) {
    const j = JSON.parse(r.body);
    const v = (j.daily?.river_discharge || []).filter((x) => x != null);
    console.log(`       ${v.length} values, range ${v.length ? `${Math.min(...v)} .. ${Math.max(...v)} m3/s` : 'none'}`);
  }
}

/* ---------- 4. EXTENDED OPEN-METEO DAILY VARIABLES ---------- */
console.log('\n4. OPEN-METEO FORECAST — extra variables we are NOT yet using');
console.log('-'.repeat(96));
{
  const vars = [
    'snowfall_sum', 'wind_speed_10m_max', 'precipitation_hours', 'sunshine_duration',
    'daylight_duration', 'et0_fao_evapotranspiration', 'uv_index_max',
    'apparent_temperature_max', 'apparent_temperature_min', 'shortwave_radiation_sum',
    'relative_humidity_2m_max', 'relative_humidity_2m_mean', 'dew_point_2m_max',
    'soil_moisture_0_to_10cm_mean', 'wind_gusts_10m_mean', 'precipitation_probability_max',
  ];
  const u = new URL('https://api.open-meteo.com/v1/forecast');
  u.searchParams.set('latitude', LAT); u.searchParams.set('longitude', LON);
  u.searchParams.set('daily', vars.join(','));
  u.searchParams.set('timezone', 'auto');
  u.searchParams.set('forecast_days', '7');
  const r = await probe('extended daily vars', u.toString());
  report(r);
  if (r.ok) {
    const j = JSON.parse(r.body);
    if (j.error) { console.log(`       API error: ${j.reason}`); }
    const d = j.daily || {};
    for (const v of vars) {
      const present = Array.isArray(d[v]);
      const vals = present ? d[v].filter((x) => x != null) : [];
      console.log(`       ${present && vals.length ? '\x1b[32m+\x1b[0m' : '\x1b[31m-\x1b[0m'} ${pad(v, 34)} ${vals.length ? `${Math.min(...vals)} .. ${Math.max(...vals)}` : 'unavailable'}`);
    }
  }
}

/* ---------- 5. NWS REAL STATION OBSERVATIONS ---------- */
console.log('\n5. NWS — real measured observations from actual stations (not model grid)');
console.log('-'.repeat(96));
{
  const pt = await probe('NWS /points', `https://api.weather.gov/points/${LAT.toFixed(4)},${LON.toFixed(4)}`, { headers: { Accept: 'application/geo+json' } });
  report(pt);
  if (pt.ok) {
    const j = JSON.parse(pt.body);
    const stationsUrl = j.properties?.observationStations;
    const zone = j.properties?.forecastZone;
    console.log(`       forecastZone: ${zone}`);
    if (stationsUrl) {
      const st = await probe('NWS observationStations', stationsUrl, { headers: { Accept: 'application/geo+json' } });
      report(st);
      if (st.ok) {
        const sj = JSON.parse(st.body);
        const first = sj.features?.[0];
        console.log(`       nearest station: ${first?.properties?.stationIdentifier} (${first?.properties?.name})`);
        if (first) {
          const ob = await probe('NWS latest observation', `https://api.weather.gov/stations/${first.properties.stationIdentifier}/observations/latest`, { headers: { Accept: 'application/geo+json' } });
          report(ob);
          if (ob.ok) {
            const oj = JSON.parse(ob.body);
            const p = oj.properties || {};
            console.log(`       measured: temp ${p.temperature?.value}C, windGust ${p.windGust?.value} km/h, precip ${p.precipitationLastHour?.value}`);
          }
        }
      }
    }
  }
}

/* ---------- 6. USGS EARTHQUAKE ---------- */
console.log('\n6. USGS EARTHQUAKES — foundation / structural inspection demand');
console.log('-'.repeat(96));
{
  const r = await probe('USGS 30d M2.5+', `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=${new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)}&latitude=${LAT}&longitude=${LON}&maxradiuskm=300&minmagnitude=2.5`);
  report(r);
  if (r.ok) {
    const j = JSON.parse(r.body);
    console.log(`       ${j.features?.length ?? 0} events within 300km in last 30 days`);
  }
}

/* ---------- 7. NASA FIRMS (wildfire) ---------- */
console.log('\n7. WILDFIRE — smoke damage / restoration');
console.log('-'.repeat(96));
{
  const r = await probe('NIFC / InciWeb feel-out', 'https://services3.arcgis.com/T4QMspbfLg3qTGWY/arcgis/rest/services/Public_Wildfire_Perimeters_View/FeatureServer/0/query?where=1%3D1&outFields=poly_IncidentName,poly_GISAcres&f=json&resultRecordCount=3');
  report(r);
  if (r.ok && r.body.startsWith('{')) {
    const j = JSON.parse(r.body);
    console.log(`       ${j.features?.length ?? 0} sample fire perimeter records`);
  }
}

console.log('\n' + '='.repeat(96));
console.log('LEGEND: OK = works + CORS header present (browser-safe)');
console.log('        WARN = works but NO CORS header -> needs a server-side proxy');
console.log('='.repeat(96));
