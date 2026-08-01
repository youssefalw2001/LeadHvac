#!/usr/bin/env node
/* Two questions the first probe left open:
   1. Does Open-Meteo actually send CORS headers when an Origin is present?
      (Node fetch sends no Origin, so servers often omit the header — that is
       not the same as CORS being unsupported.)
   2. What air-quality / pollen variables actually exist for a US location? */

const LAT = 32.7831, LON = -96.8067;
const G = '\x1b[32m', R = '\x1b[31m', Y = '\x1b[33m', X = '\x1b[0m';

console.log('='.repeat(92));
console.log('1. CORS RE-TEST WITH AN ORIGIN HEADER (the real browser condition)');
console.log('='.repeat(92));

const corsTargets = [
  ['Open-Meteo forecast', `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&daily=temperature_2m_max&timezone=auto`],
  ['Open-Meteo archive', `https://archive-api.open-meteo.com/v1/archive?latitude=${LAT}&longitude=${LON}&start_date=2026-06-01&end_date=2026-06-05&daily=temperature_2m_max`],
  ['Open-Meteo geocoding', 'https://geocoding-api.open-meteo.com/v1/search?name=Dallas&count=1'],
  ['Open-Meteo flood', `https://flood-api.open-meteo.com/v1/flood?latitude=${LAT}&longitude=${LON}&daily=river_discharge`],
  ['Open-Meteo air-quality', `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${LAT}&longitude=${LON}&hourly=pm2_5`],
  ['NOAA SPC csv', 'https://www.spc.noaa.gov/climo/reports/260731_rpts_hail.csv'],
  ['NWS alerts', `https://api.weather.gov/alerts/active?point=${LAT.toFixed(4)},${LON.toFixed(4)}`],
];

for (const [name, url] of corsTargets) {
  try {
    const res = await fetch(url, { headers: { Origin: 'https://jobleak.example' } });
    const acao = res.headers.get('access-control-allow-origin');
    const mark = acao ? `${G}BROWSER-SAFE${X}` : `${R}NEEDS PROXY  ${X}`;
    console.log(`  ${mark} ${String(name).padEnd(26)} HTTP ${res.status}  ACAO: ${acao ?? '(none)'}`);
  } catch (e) {
    console.log(`  ${R}ERROR       ${X} ${name}: ${e}`);
  }
}

console.log('\n' + '='.repeat(92));
console.log('2. AIR QUALITY / POLLEN — what actually exists for a US point?');
console.log('='.repeat(92));

// try hourly variables one family at a time so a single bad name does not 400 the batch
const families = {
  'particulates (global)': ['pm2_5', 'pm10', 'carbon_monoxide', 'nitrogen_dioxide', 'ozone', 'sulphur_dioxide'],
  'aerosol / smoke': ['aerosol_optical_depth', 'dust', 'uv_index'],
  'pollen (CAMS Europe only?)': ['alder_pollen', 'birch_pollen', 'grass_pollen', 'mugwort_pollen', 'olive_pollen', 'ragweed_pollen'],
};

for (const [label, vars] of Object.entries(families)) {
  const u = new URL('https://air-quality-api.open-meteo.com/v1/air-quality');
  u.searchParams.set('latitude', LAT); u.searchParams.set('longitude', LON);
  u.searchParams.set('hourly', vars.join(','));
  u.searchParams.set('forecast_days', '3');
  const res = await fetch(u);
  const j = await res.json();
  console.log(`\n  ${label}  ->  HTTP ${res.status}`);
  if (j.error) { console.log(`    ${R}error:${X} ${j.reason}`); continue; }
  for (const v of vars) {
    const arr = j.hourly?.[v];
    const vals = Array.isArray(arr) ? arr.filter((x) => x != null) : [];
    console.log(`    ${vals.length ? `${G}+${X}` : `${R}-${X}`} ${v.padEnd(24)} ${vals.length ? `${Math.min(...vals)} .. ${Math.max(...vals)}` : 'no data at this location'}`);
  }
}

console.log('\n' + '='.repeat(92));
console.log('3. SPC MULTI-DAY PULL — how much history can we assemble?');
console.log('='.repeat(92));
let hailDays = 0, hailReports = 0, windDays = 0, windReports = 0, failed = 0;
const DAYS = 30;
for (let i = 1; i <= DAYS; i++) {
  const d = new Date(Date.now() - i * 86400000);
  const tag = `${String(d.getUTCFullYear()).slice(2)}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}`;
  try {
    const [h, w] = await Promise.all([
      fetch(`https://www.spc.noaa.gov/climo/reports/${tag}_rpts_hail.csv`),
      fetch(`https://www.spc.noaa.gov/climo/reports/${tag}_rpts_wind.csv`),
    ]);
    if (h.ok) {
      const rows = (await h.text()).split('\n').filter((l) => l && !l.startsWith('Time'));
      if (rows.length) { hailDays++; hailReports += rows.length; }
    }
    if (w.ok) {
      const rows = (await w.text()).split('\n').filter((l) => l && !l.startsWith('Time'));
      if (rows.length) { windDays++; windReports += rows.length; }
    }
  } catch { failed++; }
}
console.log(`  Last ${DAYS} days pulled from SPC:`);
console.log(`    ${G}${hailDays}${X} days with hail reports  ->  ${G}${hailReports}${X} individual hail observations nationwide`);
console.log(`    ${G}${windDays}${X} days with wind reports  ->  ${G}${windReports}${X} individual wind damage reports`);
console.log(`    ${failed} request failures`);
console.log(`\n  Each report has lat/lon + size/speed, so it can be filtered to any service radius.`);
