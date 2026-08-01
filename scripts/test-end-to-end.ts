/* Full flow: raw sentence -> parsed -> geocoded -> report -> what the user sees. */
import { parseInput } from '../src/tradeParser';
import { buildStormIntelReport, TRADE_LABELS } from '../src/stormIntel';

const INPUTS = [
  "I'm HVAC person in Newyork Bronx",
  "I'm a roofer in Oklahoma City",
  'tree service Denver CO',
];

for (const raw of INPUTS) {
  const parsed = parseInput(raw);
  const report = await buildStormIntelReport(parsed.location || raw);

  console.log('='.repeat(80));
  console.log(`INPUT: "${raw}"`);
  console.log('='.repeat(80));
  console.log(`  parsed trade    : ${parsed.trade ?? '(none)'}${parsed.trade ? ` (${TRADE_LABELS[parsed.trade]})` : ''}`);
  console.log(`  parsed location : "${parsed.location}"`);
  console.log(`  resolved to     : ${report.area.resolved ? `${report.area.name}, ${report.area.state}` : 'UNRESOLVED'}`);

  if (!report.area.resolved) { console.log(); continue; }

  const mine = parsed.trade ? report.events.filter((e) => e.trade === parsed.trade) : report.events;
  console.log(`  total events    : ${report.events.length}`);
  console.log(`  events for them : ${mine.length}`);
  console.log(`  active alerts   : ${report.activeAlerts.length}`);
  console.log(`  storm days      : ${report.stormDays.length} (${report.stormDays.filter((d) => d.claimableHail).length} claimable hail)`);

  // Mirrors the ranking in StormRadar: biggest opportunity first, then deadline.
  const severityRank = { critical: 0, high: 1, moderate: 2 } as const;
  const claim = mine.filter((e) => e.horizon === 'past' && e.claimable)
    .sort(
      (a, b) =>
        severityRank[a.severity] - severityRank[b.severity] ||
        (a.claimWindowDaysLeft ?? 9999) - (b.claimWindowDaysLeft ?? 9999)
    )[0];
  const soon = mine.filter((e) => e.horizon === 'future' && e.severity !== 'moderate')
    .sort((a, b) => a.dayOffset - b.dayOffset)[0];

  console.log('\n  --- THE HEADLINE THEY WOULD SEE ---');
  if (report.activeAlerts.length) {
    console.log(`  [Happening now] ${report.activeAlerts[0].event} active in ${report.area.name}`);
  } else if (claim) {
    console.log(`  [Your best money right now] ${claim.headline} on ${claim.date}`);
    console.log(`     ${claim.claimWindowDaysLeft} days left in claim window`);
    console.log(`     start with: ${claim.services.slice(0, 3).join(', ')}`);
  } else if (soon) {
    console.log(`  [${soon.dayOffset} days lead time] ${soon.headline}`);
    console.log(`     ${soon.measurement}`);
    console.log(`     start with: ${soon.services.slice(0, 3).join(', ')}`);
  } else {
    console.log(`  [Nothing urgent] quiet in ${report.area.name}`);
  }
  console.log();
}
