/* Runs the REAL engine from src/stormIntel.ts against live APIs
   and prints what a contractor would see. */
import { buildStormIntelReport } from '../src/stormIntel';

const city = process.argv[2] || 'Dallas, Texas';
const report = await buildStormIntelReport(city);

const line = (c = '=') => console.log(c.repeat(76));

line();
console.log(`STORM INTELLIGENCE REPORT  —  ${report.area.name}${report.area.state ? ', ' + report.area.state : ''}`);
line();

if (!report.area.resolved) {
  console.log('Could not resolve location.');
  process.exit(1);
}

console.log(`Coordinates : ${report.area.latitude.toFixed(3)}, ${report.area.longitude.toFixed(3)}`);
console.log(`Generated   : ${report.generatedAt}`);
console.log(`Events      : ${report.events.length}`);
console.log(`Active NWS  : ${report.activeAlerts.length}`);

if (report.valueEstimates.length) {
  const low = report.valueEstimates.reduce((a, v) => a + v.lowUsd, 0);
  const high = report.valueEstimates.reduce((a, v) => a + v.highUsd, 0);
  console.log(`Opportunity : $${low.toLocaleString()} – $${high.toLocaleString()} (estimated)`);
}

for (const horizon of ['now', 'past', 'future'] as const) {
  if (horizon === 'now') {
    if (!report.activeAlerts.length) continue;
    console.log('\n' + '-'.repeat(76));
    console.log('ACTIVE RIGHT NOW');
    console.log('-'.repeat(76));
    for (const a of report.activeAlerts) {
      console.log(`  [${a.severity}/${a.urgency}] ${a.event}`);
      console.log(`     ${a.headline}`);
    }
    continue;
  }
  const list = report.events.filter((e) => e.horizon === horizon);
  if (!list.length) continue;
  console.log('\n' + '-'.repeat(76));
  console.log(horizon === 'past' ? 'STILL CLAIMABLE (past storms)' : 'COMING — STAFF FOR IT');
  console.log('-'.repeat(76));
  for (const e of list.slice(0, 8)) {
    const claim = e.claimWindowDaysLeft ? `  [${e.claimWindowDaysLeft}d claim window left]` : '';
    console.log(`\n  ${e.date}  ${e.severity.toUpperCase()}  ${e.trade}${claim}`);
    console.log(`  ${e.headline}`);
    console.log(`     measured: ${e.measurement}`);
    console.log(`     action:   ${e.action}`);
  }
}

console.log('\n' + '-'.repeat(76));
console.log('VALUE MATH (assumptions exposed, not hidden)');
console.log('-'.repeat(76));
for (const v of report.valueEstimates) {
  console.log(`\n  ${v.trade}: $${v.lowUsd.toLocaleString()} – $${v.highUsd.toLocaleString()}`);
  for (const a of v.assumptions) console.log(`     • ${a}`);
}

console.log('\n' + '-'.repeat(76));
console.log('DATA SOURCES');
console.log('-'.repeat(76));
for (const s of report.dataSources) {
  console.log(`  [${s.status}] ${s.name} — ${s.detail}`);
}

console.log('\n' + '-'.repeat(76));
console.log('WHAT THIS CANNOT TELL YOU');
console.log('-'.repeat(76));
for (const l of report.limitations) console.log(`  • ${l}`);
console.log();
