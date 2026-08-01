/**
 * NATURAL LANGUAGE INPUT PARSER
 * =============================
 *
 * Turns "I'm an HVAC guy in the Bronx" into { trade: 'hvac', location: 'Bronx' }.
 *
 * WHY RULES AND NOT AN LLM
 * The input space here is genuinely tiny: 18 trades with a handful of synonyms
 * each, plus a place name. An LLM call would add cost per scan, latency, and a
 * backend to hold the API key — and the scan is the free tier, so metering it
 * breaks the economics. Rules handle the realistic inputs for $0 and 0ms.
 *
 * Deliberately generous with synonyms, because contractors describe themselves
 * the way they'd say it out loud: "ac guy", "roofer", "I do gutters".
 */

import type { Trade } from './stormIntel';

/**
 * Longest phrases first — "garage door" must beat "door", "air duct" must beat
 * "air conditioning". Matching is done in declaration order.
 */
const TRADE_SYNONYMS: [Trade, string[]][] = [
  ['garage_doors', ['garage door', 'garage doors', 'overhead door', 'garage']],
  ['air_quality', ['air duct', 'air quality', 'duct cleaning', 'ducts', 'duct', 'iaq', 'ventilation', 'air purifier']],
  ['hvac', [
    'hvac', 'h vac', 'a/c', 'ac repair', 'air conditioning', 'air conditioner', 'aircon',
    'heat pump', 'mini split', 'furnace', 'boiler', 'heating and cooling', 'heating', 'cooling', 'ac',
  ]],
  ['roofing', ['roofing', 'roofer', 'roofs', 'roof', 'shingle', 'shingles', 're-roof']],
  ['plumbing', ['plumbing', 'plumber', 'plumb', 'water heater', 'sewer', 'drain', 'rooter', 'pipes', 'pipe']],
  ['electrical', ['electrical', 'electrician', 'electric', 'wiring', 'panel upgrade', 'generator']],
  ['restoration', [
    'restoration', 'water damage', 'fire damage', 'smoke damage', 'mitigation',
    'remediation', 'mould', 'mold', 'flood',
  ]],
  ['tree_service', ['tree service', 'tree removal', 'arborist', 'stump', 'trees', 'tree']],
  ['gutters', ['gutter', 'gutters', 'downspout', 'leaf guard']],
  ['solar', ['solar', 'photovoltaic', 'pv panels', 'solar panels']],
  ['windows_glass', ['window', 'windows', 'glazier', 'glazing', 'glass']],
  ['fencing', ['fencing', 'fences', 'fence']],
  ['painting', ['painting', 'painter', 'painters', 'paint']],
  ['concrete', ['concrete', 'masonry', 'mason', 'driveway', 'patio', 'flatwork', 'hardscape']],
  ['landscaping', ['landscaping', 'landscaper', 'landscape', 'irrigation', 'sprinkler', 'lawn care', 'lawn', 'yard']],
  ['pest', ['pest control', 'pest', 'exterminator', 'termite', 'rodent', 'wildlife removal']],
  ['snow_ice', ['snow removal', 'snow plow', 'plowing', 'ice dam', 'snow', 'plow']],
  ['foundation', ['foundation', 'crawl space', 'basement waterproofing', 'underpinning', 'pier and beam']],
];

/**
 * Primary service per trade — recovered from the original realSignals
 * defaultService map. Used for location-aware keywords and report copy.
 */
export const PRIMARY_SERVICE: Record<Trade, string> = {
  hvac: 'AC repair',
  roofing: 'roof repair',
  plumbing: 'emergency plumbing',
  electrical: 'emergency electrician',
  garage_doors: 'garage door repair',
  restoration: 'water damage restoration',
  tree_service: 'tree removal',
  gutters: 'gutter repair',
  solar: 'solar panel repair',
  windows_glass: 'window replacement',
  fencing: 'fence repair',
  painting: 'exterior painting',
  concrete: 'concrete repair',
  landscaping: 'landscaping',
  pest: 'pest control',
  snow_ice: 'snow removal',
  air_quality: 'air duct cleaning',
  foundation: 'foundation repair',
};

/**
 * Words that describe the person rather than the trade or the place.
 * Stripped before we hand the remainder to the geocoder.
 */
const FILLER = new Set([
  'i', 'im', 'i\'m', 'am', 'a', 'an', 'the', 'my', 'me', 'we', 'we\'re', 'were', 'our',
  'guy', 'guys', 'girl', 'person', 'dude', 'man', 'woman',
  'contractor', 'contractors', 'company', 'companies', 'business', 'biz', 'crew', 'shop',
  'tech', 'technician', 'owner', 'operator', 'pro', 'specialist', 'expert', 'installer', 'repairman',
  'do', 'does', 'doing', 'work', 'working', 'works', 'run', 'running', 'own',
  'service', 'services', 'servicing', 'and', 'of', 'for', 'with',
  'in', 'at', 'from', 'based', 'located', 'near', 'around', 'serving', 'cover', 'covering',
  'area', 'areas', 'region', 'county', 'metro',
  // Service and action words. Without these, leftovers like "repair phoenix az"
  // and "driveways atlanta georgia" get handed to the geocoder and fail.
  'repair', 'repairs', 'replace', 'replacement', 'install', 'installs', 'installation',
  'removal', 'remove', 'cleaning', 'clean', 'inspection', 'inspect', 'maintenance',
  'emergency', 'damage', 'water', 'fire', 'smoke', 'storm', 'driveways', 'driveway',
  'panels', 'panel', 'doors', 'door', 'glass', 'windows', 'window',
]);

/**
 * Common one-word spellings of two-word places. Contractors type fast.
 */
const PLACE_FIXUPS: [RegExp, string][] = [
  [/\bnewyork\b/g, 'new york'],
  [/\bnyc\b/g, 'new york'],
  [/\blosangeles\b/g, 'los angeles'],
  [/\bla\b/g, 'los angeles'],
  [/\bsandiego\b/g, 'san diego'],
  [/\bsanantonio\b/g, 'san antonio'],
  [/\bfortworth\b/g, 'fort worth'],
  [/\bokc\b/g, 'oklahoma city'],
  [/\bkc\b/g, 'kansas city'],
  [/\bdfw\b/g, 'dallas'],
  [/\bphilly\b/g, 'philadelphia'],
  [/\bvegas\b/g, 'las vegas'],
];

export interface ParsedInput {
  /** Null when no trade word was recognised. */
  trade: Trade | null;
  /** What we'll hand to the geocoder. Empty when nothing was left over. */
  location: string;
  /** The exact phrase that matched the trade, for showing the user what we read. */
  matchedTradePhrase: string | null;
  /** True when the input looked like plain natural language rather than just a city. */
  wasNaturalLanguage: boolean;
}

function normalise(raw: string) {
  let text = raw
    .toLowerCase()
    .replace(/[.,;!?]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  for (const [pattern, replacement] of PLACE_FIXUPS) {
    text = text.replace(pattern, replacement);
  }
  return text;
}

/**
 * Finds a trade by scanning synonyms longest-first, and returns the text with
 * that phrase removed so it does not pollute the location.
 */
function extractTrade(text: string): { trade: Trade | null; phrase: string | null; rest: string } {
  for (const [trade, synonyms] of TRADE_SYNONYMS) {
    for (const syn of synonyms) {
      // Word-boundary match so "ac" doesn't fire inside "Sacramento".
      const pattern = new RegExp(`(^|\\s)${syn.replace(/[/\\^$*+?.()|[\]{}]/g, '\\$&')}(\\s|$)`, 'i');
      if (pattern.test(text)) {
        return {
          trade,
          phrase: syn,
          rest: text.replace(pattern, ' ').replace(/\s+/g, ' ').trim(),
        };
      }
    }
  }
  return { trade: null, phrase: null, rest: text };
}

export function parseInput(raw: string): ParsedInput {
  const text = normalise(raw);
  if (!text) {
    return { trade: null, location: '', matchedTradePhrase: null, wasNaturalLanguage: false };
  }

  const { trade, phrase, rest } = extractTrade(text);

  // Strip filler, keep everything else — that's the place.
  const locationTokens = rest
    .split(' ')
    .filter((t) => t && !FILLER.has(t));

  const location = locationTokens.join(' ').trim();

  // If we removed anything meaningful, the user wrote a sentence rather than
  // just typing a city name.
  const wasNaturalLanguage = Boolean(phrase) || locationTokens.length !== text.split(' ').length;

  return {
    trade,
    location,
    matchedTradePhrase: phrase,
    wasNaturalLanguage,
  };
}

/**
 * Location-aware keyword set. Recovered from the original realSignals
 * buildSearchIntent, which injected the city into every keyword — the version I
 * wrote for the ads playbook left the city out entirely, which is a real loss
 * because local intent terms are exactly where contractors compete.
 *
 * These are editorial templates, not measured search volume.
 */
export function localKeywords(trade: Trade, city: string): string[] {
  const service = PRIMARY_SERVICE[trade].toLowerCase();
  const place = city.toLowerCase().trim();
  if (!place) return [`${service} near me`, `emergency ${service}`, `same day ${service}`];
  return [
    `${service} ${place}`,
    `${service} near me`,
    `emergency ${service} ${place}`,
    `same day ${service}`,
    `${service} contractor ${place}`,
    `best ${service} ${place}`,
    `${service} quote ${place}`,
  ];
}
