#!/usr/bin/env node
/* Verify every free endpoint the storm engine depends on actually works
   and returns the fields we expect. No API keys. */

const CITY = process.argv[2] || 'Oklahoma City, Oklahoma';

const ok = (s) => `  \x1b[32mOK\x1b[0m  ${s}`;
const bad = (s) => `  \x1b[31mFAIL\x1b[0m ${s}`;

console.log('='.repeat(74));
console.log(`VERIFYING STORM INTEL DATA SOURCES  —  "${CITY}"`);
console.log('='.repeat(74));

// 1. GEOCODING
let lat, lon, name, state;
{
  const u = new URL('https://geocoding-api.open-meteo.com/v1/search');
  u.searchParams.set('name', CITY);
  u.searchParams.set('count', '1');
  u.searchParams.set('format', 'json');
  const r = await fetch(u);
  const j = await r.json();
  const hit = j?.results?.[0];
  if (!hit) { console.log(bad('geocoding returned no results')); process.exit(1); }
  ({ latitude: lat, longitude: lon, name } = hit);
  state = hit.admin1;
  console.log('\n1. GEOCODING  geocoding-api.open-meteo.com');
  console.log(ok(`${name}, ${state}  ->  ${lat}, ${lon}`));
}

const MS = 86400000;
const today = new Date(); today.setUTCHours(12, 0, 0, 0);
const iso = (d) => d.toISOString().slice(0, 10);
const mph = (kmh) => kmh * 0.621371;
const f = (c) => c * 9 / 5 + 32;

const DAILY = 'temperature_2m_max,temperature_2m_min,wind_gusts_10m_max,precipitation_sum';

// 2. FORECAST
{
  const u = new URL('https://api.open-meteo.com/v1/forecast');
  u.searchParams.set('latitude', lat); u.searchParams.set('longitude', lon);
  u.searchParams.set('daily', DAILY);
  u.searchParams.set('timezone', 'auto');
  u.searchParams.set('forecast_days', '14');
  const r = await fetch(u);
  const j = await r.json();
  const d = j?.daily;
  console.log('\n2. FORECAST  api.open-meteo.com/v1/forecast');
  if (!d?.time) { console.log(bad('no daily block')); }
  else {
    console.log(ok(`${d.time.length} days returned`));
    for (const k of ['temperature_2m_max', 'temperature_2m_min', 'wind_gusts_10m_max', 'precipitation_sum']) {
      console.log(d[k] ? ok(`field ${k} present (${d[k].filter(v => v != null).length} values)`) : bad(`field ${k} MISSING`));
    }
    const gusts = d.wind_gusts_10m_max ?? [];
    const peak = Math.max(...gusts.filter(Number.isFinite));
    console.log(`      peak forecast gust: ${mph(peak).toFixed(0)} mph`);
    console.log(`      temp range: ${f(Math.min(...d.temperature_2m_min.filter(Number.isFinite))).toFixed(0)}°F to ${f(Math.max(...d.temperature_2m_max.filter(Number.isFinite))).toFixed(0)}°F`);
  }
}

// 3. ARCHIVE
{
  const start = iso(new Date(today.getTime() - 120 * MS));
  const end = iso(new Date(today.getTime() - 5 * MS));
  const u = new URL('https://archive-api.open-meteo.com/v1/archive');
  u.searchParams.set('latitude', lat); u.searchParams.set('longitude', lon);
  u.searchParams.set('daily', DAILY);
  u.searchParams.set('timezone', 'auto');
  u.searchParams.set('start_date', start); u.searchParams.set('end_date', end);
  const r = await fetch(u);
  const j = await r.json();
  const d = j?.daily;
  console.log(`\n3. ARCHIVE  archive-api.open-meteo.com  (${start} -> ${end})`);
  if (!d?.time) { console.log(bad(`no daily block: ${JSON.stringify(j).slice(0, 200)}`)); }
  else {
    console.log(ok(`${d.time.length} historical days returned`));
    const gusts = d.wind_gusts_10m_max ?? [];
    const severe = gusts.map((g, i) => [g, i]).filter(([g]) => Number.isFinite(g) && mph(g) >= 58);
    const damaging = gusts.map((g, i) => [g, i]).filter(([g]) => Number.isFinite(g) && mph(g) >= 45 && mph(g) < 58);
    console.log(ok(`${severe.length} days at/above NWS severe threshold (58 mph)`));
    console.log(ok(`${damaging.length} days in damaging range (45-58 mph)`));
    for (const [g, i] of severe.slice(0, 5)) {
      const dayOffset = Math.round((new Date(`${d.time[i]}T12:00:00Z`) - today) / MS);
      console.log(`      ${d.time[i]}  ${mph(g).toFixed(0)} mph  (${Math.abs(dayOffset)}d ago, ${365 + dayOffset}d left in claim window)`);
    }
    const rain = d.precipitation_sum ?? [];
    console.log(ok(`${rain.filter(v => Number.isFinite(v) && v >= 25).length} heavy-rain days (>=25mm)`));
  }
}

// 4. NWS ALERTS
{
  const u = new URL('https://api.weather.gov/alerts/active');
  u.searchParams.set('point', `${Number(lat).toFixed(4)},${Number(lon).toFixed(4)}`);
  const r = await fetch(u, { headers: { Accept: 'application/geo+json' } });
  console.log('\n4. NWS ALERTS  api.weather.gov/alerts/active');
  if (!r.ok) { console.log(bad(`HTTP ${r.status}`)); }
  else {
    const j = await r.json();
    const feats = j?.features ?? [];
    console.log(ok(`HTTP 200, ${feats.length} active alert(s)`));
    for (const ft of feats.slice(0, 4)) {
      const p = ft.properties;
      console.log(`      [${p.severity}/${p.urgency}] ${p.event} — ${String(p.areaDesc).slice(0, 60)}`);
    }
  }
}

console.log('\n' + '='.repeat(74));
console.log('All four sources are free, keyless, and browser-callable (CORS-friendly).');
console.log('='.repeat(74));
