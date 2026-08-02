#!/usr/bin/env node
/*
  QUESTION: is hail/storm actually the main opportunity, or am I over-indexing
  on it because it is the most dramatic?

  METHOD: sample geographically diverse US metros. For each, count how many
  qualifying signals come from storm damage (observed hail/wind) versus
  temperature (heat/freeze) versus rain. Then ask what fraction of metros have
  ANY claimable hail at all.

  If most metros have little or no hail, marketing the whole site around hail
  would be marketing a product that does nothing for most of the country.
*/

const CITIES = [
  ['Oklahoma City, OK', 35.4676, -97.5164],
  ['Dallas, TX', 32.7831, -96.8067],
  ['Denver, CO', 39.7392, -104.9847],
  ['Kansas City, MO', 39.0997, -94.5786],
  ['Phoenix, AZ', 33.4484, -112.0740],
  ['Los Angeles, CA', 34.0522, -118.2437],
  ['Seattle, WA', 47.6062, -122.3321],
  ['Miami, FL', 25.7617, -80.1918],
  ['New York, NY', 40.7128, -74.0060],
  ['Chicago, IL', 41.8781, -87.6298],
  ['Atlanta, GA', 33.7490, -84.3880],
  ['Portland, OR', 45.5152, -122.6784],
  ['Boston, MA', 42.3601, -71.0589],
  ['Las Vegas, NV', 36.1699, -115.1398],
];

const RADIUS = 40, SPC_DAYS = 60, ARCHIVE_DAYS = 120;
const MS = 86400000;
const mph = (kmh) => kmh * 0.621371;
const f = (c) => c * 9 / 5 + 32;
const iso = (d) => d.toISOString().slice(0, 10);

function haversine(la1, lo1, la2, lo2) {
  const R = 3958.8, r = (d) => d * Math.PI / 180;
  const dLa = r(la2 - la1), dLo = r(lo2 - lo1);
  const a = Math.sin(dLa / 2) ** 2 + Math.cos(r(la1)) * Math.cos(r(la2)) * Math.sin(dLo / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function parseCsv(t) {
  const out = [];
  for (const raw of t.split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('Time,')) continue;
    out.push(line.split(','));
  }
  return out;
}

async function spcCount(lat, lon) {
  let hailClaimable = 0, hailAny = 0, windDamaging = 0;
  const days = new Set();
  for (let i = 1; i <= SPC_DAYS; i++) {
    const d = new Date(Date.now() - i * MS);
    const tag = `${String(d.getUTCFullYear()).slice(2)}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}`;
    for (const kind of ['hail', 'wind']) {
      try {
        const res = await fetch(`https://www.spc.noaa.gov/climo/reports/${tag}_rpts_${kind}.csv`);
        if (!res.ok) continue;
        const text = await res.text();
        if (text.trimStart().startsWith('<')) continue;
        for (const cells of parseCsv(text)) {
          const la = Number(cells[5]), lo = Number(cells[6]);
          if (!Number.isFinite(la) || !Number.isFinite(lo)) continue;
          if (haversine(lat, lon, la, lo) > RADIUS) continue;
          if (kind === 'hail') {
            const inches = Number(cells[1]) / 100;
            if (Number.isFinite(inches)) { hailAny++; if (inches >= 1) { hailClaimable++; days.add(tag); } }
          } else {
            const m = String(cells[1]).toUpperCase().match(/^G?(\d+)$/);
            if (m && Number(m[1]) >= 45) { windDamaging++; days.add(tag); }
          }
        }
      } catch { /* keep going */ }
    }
  }
  return { hailClaimable, hailAny, windDamaging, stormDays: days.size };
}

async function tempCount(lat, lon) {
  const start = iso(new Date(Date.now() - ARCHIVE_DAYS * MS));
  const end = iso(new Date(Date.now() - 5 * MS));
  const u = new URL('https://archive-api.open-meteo.com/v1/archive');
  u.searchParams.set('latitude', lat); u.searchParams.set('longitude', lon);
  u.searchParams.set('daily', 'temperature_2m_max,temperature_2m_min,precipitation_sum,wind_gusts_10m_max');
  u.searchParams.set('timezone', 'auto');
  u.searchParams.set('start_date', start); u.searchParams.set('end_date', end);
  try {
    const j = await (await fetch(u)).json();
    const d = j.daily || {};
    let heat = 0, cold = 0, rain = 0;
    for (let i = 0; i < (d.time || []).length; i++) {
      if (f(d.temperature_2m_max?.[i] ?? -99) >= 95) heat++;
      if (f(d.temperature_2m_min?.[i] ?? 99) <= 32) cold++;
      if ((d.precipitation_sum?.[i] ?? 0) >= 25) rain++;
    }
    return { heat, cold, rain, days: (d.time || []).length };
  } catch {
    return { heat: 0, cold: 0, rain: 0, days: 0 };
  }
}

const pad = (s, n) => String(s).padEnd(n);
const rows = [];

console.log('='.repeat(100));
console.log(`SIGNAL MIX BY METRO   SPC ${SPC_DAYS}d @ ${RADIUS}mi   |   temperature ${ARCHIVE_DAYS}d`);
console.log('='.repeat(100));
console.log(pad('metro', 20) + pad('claimable hail', 16) + pad('damaging wind', 15) + pad('heat 95F+', 12) + pad('freeze', 9) + 'heavy rain');
console.log('-'.repeat(100));

for (const [name, lat, lon] of CITIES) {
  const [storm, temp] = await Promise.all([spcCount(lat, lon), tempCount(lat, lon)]);
  rows.push({ name, ...storm, ...temp });
  console.log(
    pad(name, 20) +
    pad(storm.hailClaimable, 16) +
    pad(storm.windDamaging, 15) +
    pad(temp.heat, 12) +
    pad(temp.cold, 9) +
    temp.rain
  );
}

console.log('='.repeat(100));
const withHail = rows.filter((r) => r.hailClaimable > 0).length;
const withStorm = rows.filter((r) => r.stormDays > 0).length;
const withTemp = rows.filter((r) => r.heat + r.cold > 0).length;
const withAny = rows.filter((r) => r.stormDays > 0 || r.heat + r.cold + r.rain > 0).length;

const pct = (n) => `${Math.round((n / rows.length) * 100)}%`;

console.log('\nCOVERAGE — how many of the sampled metros have each signal at all?');
console.log(`  claimable hail        ${withHail}/${rows.length}  (${pct(withHail)})`);
console.log(`  any storm damage      ${withStorm}/${rows.length}  (${pct(withStorm)})`);
console.log(`  temperature signal    ${withTemp}/${rows.length}  (${pct(withTemp)})`);
console.log(`  ANY signal at all     ${withAny}/${rows.length}  (${pct(withAny)})`);

const totalHail = rows.reduce((a, r) => a + r.hailClaimable, 0);
const totalWind = rows.reduce((a, r) => a + r.windDamaging, 0);
const totalTemp = rows.reduce((a, r) => a + r.heat + r.cold, 0);
const totalRain = rows.reduce((a, r) => a + r.rain, 0);
const grand = totalHail + totalWind + totalTemp + totalRain;

console.log('\nVOLUME MIX — share of all qualifying signals across every metro:');
for (const [label, n] of [['claimable hail', totalHail], ['damaging wind', totalWind], ['heat + freeze', totalTemp], ['heavy rain', totalRain]]) {
  const share = grand ? Math.round((n / grand) * 100) : 0;
  console.log(`  ${pad(label, 18)} ${String(n).padStart(5)}  ${'#'.repeat(Math.round(share / 2))} ${share}%`);
}

console.log('\nDEAD ZONES — metros where a hail-only product shows nothing:');
for (const r of rows.filter((x) => x.hailClaimable === 0)) {
  console.log(`  ${pad(r.name, 20)} hail 0  but heat ${r.heat}, freeze ${r.cold}, rain ${r.rain}, wind ${r.windDamaging}`);
}
