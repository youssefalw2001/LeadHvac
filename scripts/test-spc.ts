/* Exercise the real SPC module against several markets. */
import { fetchSpcReports, groupByStormDay, HAIL_CLAIMABLE_INCHES } from '../src/spcReports';

const CITIES: [string, number, number][] = [
  ['Oklahoma City, OK', 35.4676, -97.5164],
  ['Dallas, TX', 32.7831, -96.8067],
  ['Denver, CO', 39.7392, -104.9847],
  ['Kansas City, MO', 39.0997, -94.5786],
  ['Minneapolis, MN', 44.9778, -93.2650],
];

const RADIUS = 50;
const DAYS = 45;

for (const [name, lat, lon] of CITIES) {
  const t0 = Date.now();
  const result = await fetchSpcReports({
    latitude: lat,
    longitude: lon,
    radiusMiles: RADIUS,
    days: DAYS,
    kinds: ['hail', 'wind', 'torn'],
  });
  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  const days = groupByStormDay(result.reports);
  const claimable = days.filter((d) => d.claimableHail);

  console.log('='.repeat(84));
  console.log(`${name}   radius ${RADIUS}mi, last ${DAYS} days   (${elapsed}s, ${result.requestsFailed} failures)`);
  console.log('='.repeat(84));
  console.log(`  ${result.reports.length} ground-truth reports across ${days.length} storm days`);
  console.log(`  ${claimable.length} day(s) with claimable hail (>= ${HAIL_CLAIMABLE_INCHES}")`);

  for (const d of days.slice(0, 6)) {
    const bits: string[] = [];
    if (d.maxHailInches) bits.push(`hail ${d.maxHailInches.toFixed(2)}"`);
    if (d.maxWindMph) bits.push(`wind ${d.maxWindMph} mph`);
    if (d.tornadoCount) bits.push(`${d.tornadoCount} tornado report(s)`);
    const flag = d.claimableHail ? '  <-- CLAIMABLE' : '';
    console.log(`\n  ${d.date}  ${d.reportCount} reports  nearest ${d.nearestMiles.toFixed(1)}mi  ${bits.join(', ')}${flag}`);
    if (d.sampleComment) console.log(`     observed: "${d.sampleComment.slice(0, 100)}"`);
  }
  console.log();
}
