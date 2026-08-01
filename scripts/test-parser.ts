/* Does the parser survive how contractors actually type? */
import { parseInput, localKeywords, PRIMARY_SERVICE } from '../src/tradeParser';
import { resolveServiceArea } from '../src/stormIntel';

const CASES = [
  "I'm HVAC person in Newyork Bronx",
  "im an ac guy in the bronx",
  "I'm a roofer in Dallas Texas",
  "roofing contractor serving Oklahoma City",
  'i do gutters around Kansas City',
  'tree service Denver CO',
  "I'm a plumber based in Houston",
  'garage door repair in Phoenix AZ',
  'electrician in Tampa Florida',
  'pest control guy Miami',
  'I run a painting business in Austin',
  'snow removal minneapolis',
  'Dallas, Texas',
  'solar installer san diego california',
  'foundation repair company in fort worth',
  'my crew does concrete driveways in Atlanta Georgia',
  'water damage restoration new orleans',
  "I'm in Chicago",
  'window and glass shop in Seattle',
];

const pad = (s: string, n: number) => String(s).padEnd(n);

console.log('='.repeat(104));
console.log(pad('INPUT', 48) + pad('TRADE', 16) + pad('MATCHED', 16) + 'LOCATION');
console.log('='.repeat(104));

for (const c of CASES) {
  const p = parseInput(c);
  const trade = p.trade ?? '\x1b[31m(none)\x1b[0m';
  console.log(pad(`"${c}"`, 48) + pad(trade, 16) + pad(p.matchedTradePhrase ?? '-', 16) + `"${p.location}"`);
}

console.log('\n' + '='.repeat(104));
console.log('DOES THE EXTRACTED LOCATION ACTUALLY GEOCODE?');
console.log('='.repeat(104));

const geoChecks = [
  "I'm HVAC person in Newyork Bronx",
  'im an ac guy in the bronx',
  'i do gutters around Kansas City',
  'my crew does concrete driveways in Atlanta Georgia',
  'solar installer san diego california',
];

for (const c of geoChecks) {
  const p = parseInput(c);
  const area = await resolveServiceArea(p.location);
  const mark = area.resolved ? '\x1b[32mOK  \x1b[0m' : '\x1b[31mFAIL\x1b[0m';
  console.log(
    `  ${mark} "${p.location}"  ->  ${area.resolved ? `${area.name}${area.state ? ', ' + area.state : ''} (${area.latitude.toFixed(3)}, ${area.longitude.toFixed(3)})` : 'unresolved'}`
  );
}

console.log('\n' + '='.repeat(104));
console.log('LOCATION-AWARE KEYWORDS (recovered from the old buildSearchIntent)');
console.log('='.repeat(104));
const sample = parseInput("I'm HVAC person in Newyork Bronx");
if (sample.trade) {
  console.log(`  trade: ${sample.trade}  primary service: "${PRIMARY_SERVICE[sample.trade]}"`);
  for (const k of localKeywords(sample.trade, 'Bronx')) console.log(`    - ${k}`);
}
