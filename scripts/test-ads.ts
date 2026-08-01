/* Verify the ads playbook against real storm data in two very different markets. */
import { buildStormIntelReport } from '../src/stormIntel';
import { buildAdsPlaybook } from '../src/adsPlaybook';

for (const city of ['Oklahoma City, Oklahoma', 'Phoenix, Arizona']) {
  const report = await buildStormIntelReport(city);
  const pb = buildAdsPlaybook(report.events, report.stormDays, 'roofing');

  console.log('='.repeat(78));
  console.log(`${city}`);
  console.log('='.repeat(78));
  console.log(`  budget multiplier : ${pb.budgetMultiplier}x`);
  console.log(`  rationale         : ${pb.budgetRationale}`);
  console.log(`\n  radius targets (${pb.radiusTargets.length}):`);
  for (const t of pb.radiusTargets) {
    console.log(`    ${t.latitude}, ${t.longitude}  ${t.radiusMiles}mi  ${t.reportCount} reports  — ${t.label}`);
  }
  console.log(`\n  actions (${pb.actions.length}):`);
  for (const a of pb.actions) {
    console.log(`    [${a.priority}] ${a.title}`);
    console.log(`        basis: ${a.basis.slice(0, 90)}`);
  }
  console.log(`\n  copy angles:`);
  for (const a of pb.adCopyAngles) console.log(`    • ${a.slice(0, 110)}`);
  console.log();
}
