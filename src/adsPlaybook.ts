/**
 * GOOGLE ADS PLAYBOOK
 * ===================
 *
 * WHAT THIS IS NOT: search volume data. Google's Keyword Planner API requires
 * OAuth and an approved developer token, so it cannot be called from a browser.
 * We do not have measured search volume and we do not pretend to.
 *
 * WHAT THIS IS: ad actions derived from MEASURED storm data. The useful insight
 * is that a contractor's ad spend should not be flat. Intent for "roof repair
 * near me" spikes in a specific place on a specific day, and that day is
 * knowable from NOAA reports. Most contractors run the same budget all year and
 * miss the window entirely.
 *
 * The geo-targeting is the part nobody else can do: SPC reports carry lat/lon,
 * so we can hand over exact radius targets instead of "target your city".
 */

import type { SpcStormDay } from './spcReports';
import type { StormEvent, Trade } from './stormIntel';

export interface RadiusTarget {
  latitude: number;
  longitude: number;
  radiusMiles: number;
  label: string;
  /** How many observed damage reports fell inside this cluster. */
  reportCount: number;
}

export interface AdAction {
  priority: 'now' | 'this_week' | 'standing';
  title: string;
  detail: string;
  /** Why this is grounded, so the user can check our reasoning. */
  basis: string;
}

export interface KeywordSet {
  trade: Trade;
  /** High-intent, storm-triggered terms. */
  stormIntent: string[];
  /** Always-on terms for the trade. */
  evergreen: string[];
  /** Terms to exclude — these waste real money. */
  negatives: string[];
}

export interface AdsPlaybook {
  /** Suggested multiplier on normal daily budget, and the reasoning. */
  budgetMultiplier: number;
  budgetRationale: string;
  /** Exact geo targets built from observed report coordinates. */
  radiusTargets: RadiusTarget[];
  actions: AdAction[];
  keywords: KeywordSet[];
  adCopyAngles: string[];
  limitations: string[];
}

/* ------------------------------------------------------------------ *
 * KEYWORDS
 *
 * These are terms contractors actually bid on. They are editorial, not
 * measured — labelled as such in `limitations`.
 * ------------------------------------------------------------------ */

const KEYWORDS: Partial<Record<Trade, Omit<KeywordSet, 'trade'>>> = {
  roofing: {
    stormIntent: [
      'hail damage roof inspection',
      'storm damage roof repair',
      'roof leak after storm',
      'emergency roof tarp',
      'insurance claim roof replacement',
      'free roof inspection',
    ],
    evergreen: ['roof replacement cost', 'roofing contractor near me', 'shingle repair'],
    negatives: ['diy', 'how to', 'jobs', 'salary', 'training', 'course', 'wholesale', 'supplier', 'material only'],
  },
  hvac: {
    stormIntent: ['ac not cooling', 'emergency ac repair', 'same day ac repair', 'ac stopped working'],
    evergreen: ['ac tune up', 'hvac maintenance plan', 'furnace repair', 'ac replacement cost'],
    negatives: ['diy', 'jobs', 'salary', 'school', 'parts only', 'used', 'window unit'],
  },
  plumbing: {
    stormIntent: ['burst pipe repair', 'emergency plumber', 'frozen pipe thaw', 'water leak emergency'],
    evergreen: ['water heater replacement', 'drain cleaning', 'plumber near me'],
    negatives: ['diy', 'jobs', 'salary', 'apprenticeship', 'parts'],
  },
  restoration: {
    stormIntent: ['water damage restoration', 'flood cleanup', 'emergency water extraction', 'storm damage cleanup'],
    evergreen: ['mold remediation', 'water damage repair cost'],
    negatives: ['diy', 'jobs', 'insurance jobs', 'training', 'certification'],
  },
  tree_service: {
    stormIntent: ['emergency tree removal', 'fallen tree removal', 'tree on house', 'storm damage tree'],
    evergreen: ['tree trimming', 'stump grinding', 'arborist near me'],
    negatives: ['diy', 'jobs', 'firewood', 'free wood', 'mulch'],
  },
  gutters: {
    stormIntent: ['gutter repair storm damage', 'gutter replacement', 'downspout repair'],
    evergreen: ['gutter cleaning', 'gutter guards'],
    negatives: ['diy', 'jobs', 'parts', 'home depot'],
  },
  solar: {
    stormIntent: ['solar panel hail damage', 'solar panel repair', 'solar inspection after storm'],
    evergreen: ['solar panel installation cost', 'solar quote'],
    negatives: ['diy', 'jobs', 'kit', 'wholesale', 'portable'],
  },
  windows_glass: {
    stormIntent: ['broken window repair', 'window replacement hail damage', 'emergency board up'],
    evergreen: ['window replacement cost', 'double pane windows'],
    negatives: ['diy', 'jobs', 'tint film', 'car window'],
  },
  fencing: {
    stormIntent: ['fence repair storm damage', 'fence blown down', 'emergency fence repair'],
    evergreen: ['fence installation cost', 'privacy fence'],
    negatives: ['diy', 'jobs', 'panels only', 'material'],
  },
  painting: {
    stormIntent: [],
    evergreen: ['exterior painting cost', 'house painters near me', 'cabinet painting'],
    negatives: ['diy', 'jobs', 'paint sale', 'sherwin williams', 'behr'],
  },
  concrete: {
    stormIntent: ['foundation crack repair', 'driveway repair'],
    evergreen: ['concrete driveway cost', 'patio installation'],
    negatives: ['diy', 'jobs', 'bags', 'mix', 'ready mix delivery'],
  },
  foundation: {
    stormIntent: ['foundation repair', 'foundation crack after storm', 'settling foundation'],
    evergreen: ['foundation repair cost', 'pier and beam repair'],
    negatives: ['diy', 'jobs', 'inspection course'],
  },
  pest: {
    stormIntent: ['rodent removal', 'mosquito treatment', 'ant infestation'],
    evergreen: ['pest control near me', 'termite inspection', 'quarterly pest control'],
    negatives: ['diy', 'jobs', 'spray', 'traps', 'home remedy'],
  },
  snow_ice: {
    stormIntent: ['emergency snow removal', 'ice dam removal', 'roof snow removal'],
    evergreen: ['snow removal contract', 'seasonal snow plowing'],
    negatives: ['diy', 'jobs', 'snow blower', 'shovel'],
  },
  air_quality: {
    stormIntent: ['smoke damage cleaning', 'air duct cleaning after fire'],
    evergreen: ['air duct cleaning', 'air purifier installation', 'hvac filter service'],
    negatives: ['diy', 'jobs', 'filter only', 'amazon'],
  },
  landscaping: {
    stormIntent: ['storm cleanup landscaping', 'irrigation repair'],
    evergreen: ['lawn care service', 'sprinkler repair', 'landscaping near me'],
    negatives: ['diy', 'jobs', 'seed', 'equipment rental'],
  },
};

const FALLBACK_KEYWORDS: Omit<KeywordSet, 'trade'> = {
  stormIntent: [],
  evergreen: [],
  negatives: ['diy', 'how to', 'jobs', 'salary', 'training'],
};

/* ------------------------------------------------------------------ *
 * GEO CLUSTERING
 * ------------------------------------------------------------------ */

/**
 * Groups nearby observed reports so we can hand Google a small number of radius
 * targets instead of one target per report. Simple greedy clustering is correct
 * here — we want a handful of usable targets, not optimal k-means.
 */
function clusterReports(days: SpcStormDay[], maxTargets = 5): RadiusTarget[] {
  const points = days
    .flatMap((d) => d.reports)
    .map((r) => ({ lat: r.latitude, lon: r.longitude, label: `${r.location}, ${r.state}` }));
  if (!points.length) return [];

  const CLUSTER_DEG = 0.25; // ~17 miles latitude
  const clusters: { lat: number; lon: number; labels: string[]; count: number }[] = [];

  for (const p of points) {
    const existing = clusters.find(
      (c) => Math.abs(c.lat - p.lat) < CLUSTER_DEG && Math.abs(c.lon - p.lon) < CLUSTER_DEG
    );
    if (existing) {
      existing.lat = (existing.lat * existing.count + p.lat) / (existing.count + 1);
      existing.lon = (existing.lon * existing.count + p.lon) / (existing.count + 1);
      existing.count += 1;
      if (existing.labels.length < 3) existing.labels.push(p.label);
    } else {
      clusters.push({ lat: p.lat, lon: p.lon, labels: [p.label], count: 1 });
    }
  }

  return clusters
    .sort((a, b) => b.count - a.count)
    .slice(0, maxTargets)
    .map((c) => ({
      latitude: Number(c.lat.toFixed(4)),
      longitude: Number(c.lon.toFixed(4)),
      radiusMiles: 10,
      label: c.labels[0] ?? 'Damage cluster',
      reportCount: c.count,
    }));
}

/* ------------------------------------------------------------------ *
 * BUILD
 * ------------------------------------------------------------------ */

export function buildAdsPlaybook(
  events: StormEvent[],
  stormDays: SpcStormDay[],
  trade: Trade | 'all'
): AdsPlaybook {
  const relevant = trade === 'all' ? events : events.filter((e) => e.trade === trade);

  // Recency is what drives urgency. Intent decays fast after a storm.
  const recent = stormDays.filter((d) => {
    const age = (Date.now() - new Date(`${d.date}T12:00:00Z`).getTime()) / 86_400_000;
    return age <= 14;
  });
  const claimableRecent = recent.filter((d) => d.claimableHail);
  const upcoming = relevant.filter((e) => e.horizon === 'future' && e.dayOffset <= 5);

  /**
   * A single isolated report is not a surge. Requiring a meaningful cluster
   * stops us telling someone to triple their spend because one person in the
   * next county reported a gust.
   */
  const MIN_REPORTS_FOR_SURGE = 5;
  const recentReportCount = recent.reduce((a, d) => a + d.reportCount, 0);
  const hasRealCluster = recentReportCount >= MIN_REPORTS_FOR_SURGE;

  type Mode = 'claimable_surge' | 'damage_surge' | 'pre_event' | 'quiet';
  let mode: Mode = 'quiet';
  let budgetMultiplier = 1;
  let budgetRationale =
    'No meaningful storm cluster in the last 14 days and nothing severe in the next 5. Hold your normal budget — there is no surge to buy into, and storm-intent keywords will just burn money.';

  if (claimableRecent.length > 0 && hasRealCluster) {
    mode = 'claimable_surge';
    budgetMultiplier = 3;
    budgetRationale = `${claimableRecent.length} day${claimableRecent.length === 1 ? '' : 's'} with claimable hail in the last 14 days, across ${recentReportCount} observed reports. This is the highest-intent window you will get — homeowners are searching right now and the claim window is open.`;
  } else if (hasRealCluster) {
    mode = 'damage_surge';
    budgetMultiplier = 2;
    budgetRationale = `${recent.length} storm day${recent.length === 1 ? '' : 's'} and ${recentReportCount} observed damage reports in the last 14 days, but no confirmed claimable hail. Elevated intent in the affected clusters — worth raising spend, but expect more inspections than replacements.`;
  } else if (upcoming.length > 0) {
    mode = 'pre_event';
    budgetMultiplier = 1.5;
    budgetRationale = `${upcoming.length} severe event${upcoming.length === 1 ? '' : 's'} forecast within 5 days, and no significant recent cluster. Raise budget the day before so you are already ranking when demand lands, instead of starting cold.`;
  } else if (recent.length > 0) {
    budgetRationale = `${recentReportCount} isolated report${recentReportCount === 1 ? '' : 's'} in the last 14 days — below the ${MIN_REPORTS_FOR_SURGE}-report threshold we treat as a real cluster. Not enough to justify raising spend.`;
  }

  const radiusTargets = clusterReports(recent.length ? recent : stormDays.slice(0, 3));

  const actions: AdAction[] = [];

  if (mode === 'claimable_surge' || mode === 'damage_surge') {
    const lead = claimableRecent[0] ?? recent[0];
    const magnitude = lead.maxHailInches
      ? `${lead.maxHailInches.toFixed(2)}" hail`
      : lead.maxWindMph
        ? `${lead.maxWindMph} mph wind`
        : `${lead.reportCount} damage reports`;

    actions.push({
      priority: 'now',
      title: `Raise budget to ${budgetMultiplier}× and switch to storm-intent keywords`,
      detail:
        'Move spend off research terms like "roof replacement cost" and onto damage and inspection terms. Post-storm intent is transactional, not exploratory.',
      basis: `${magnitude} observed on ${lead.date}, ${lead.reportCount} NOAA report(s), nearest ${lead.nearestMiles.toFixed(1)} mi.`,
    });

    actions.push({
      priority: 'now',
      title: 'Tighten geo targeting to the damage clusters below',
      detail:
        'Do not target the whole metro. Damage is spatially clustered, so city-wide targeting spends most of your budget on homes that were never hit.',
      basis: `${radiusTargets.length} cluster(s) built from the coordinates of observed reports.`,
    });

    if (mode === 'claimable_surge') {
      actions.push({
        priority: 'now',
        title: 'Turn on Local Services Ads if you are eligible',
        detail:
          'LSA leads are exclusive and charged per lead rather than per click, which generally beats shared marketplace leads on cost per booked job.',
        basis: 'Applies during a confirmed claimable-hail window.',
      });
    } else {
      actions.push({
        priority: 'this_week',
        title: 'Lead with free inspections, not replacements',
        detail:
          'No confirmed claimable hail means more of these calls end as inspections or minor repairs. Set the offer accordingly or your cost per sale will look worse than it is.',
        basis: `${recentReportCount} observed reports but no hail at or above the claim threshold.`,
      });
    }
  }

  if (upcoming.length > 0) {
    const next = upcoming.sort((a, b) => a.dayOffset - b.dayOffset)[0];
    actions.push({
      priority: 'this_week',
      title: `Pre-load budget ${next.dayOffset} day${next.dayOffset === 1 ? '' : 's'} ahead of the event`,
      detail:
        'Google needs time to learn and your Quality Score does not appear instantly. Ramping the day before beats ramping the day after.',
      basis: `${next.headline} — ${next.measurement}`,
    });
  }

  actions.push({
    priority: 'standing',
    title: 'Add the negative keyword list',
    detail:
      'DIY, jobs, salary and material-only searches will drain a storm budget fast, because volume spikes on those terms too.',
    basis: 'Editorial recommendation, not measured search data.',
  });

  actions.push({
    priority: 'standing',
    title: 'Set up call tracking before you raise spend',
    detail:
      'If you cannot attribute a booked job to a campaign, you cannot tell a winning surge from an expensive one. Do this before the next storm, not after.',
    basis: 'Standard practice for measuring a surge.',
  });

  if (mode === 'quiet') {
    actions.push({
      priority: 'now',
      title: 'Quiet period — shift to maintenance and evergreen offers',
      detail:
        'With no storm demand to capture, storm-intent keywords will burn money at high CPCs for people who do not have damage. Push tune-ups, inspections and maintenance plans instead.',
      basis: `${recentReportCount} observed report(s) in the last 14 days, below the ${MIN_REPORTS_FOR_SURGE}-report cluster threshold, and no severe forecast events.`,
    });
    actions.push({
      priority: 'this_week',
      title: 'Build your storm campaign now, paused',
      detail:
        'Create the campaign, ad groups, geo targets and copy while it is quiet, then leave it paused. When hail lands you flip a switch instead of spending a day building while competitors are already knocking.',
      basis: 'Preparation task — no current storm signal required.',
    });
  }

  const trades: Trade[] =
    trade === 'all' ? [...new Set(relevant.map((e) => e.trade))].slice(0, 6) : [trade];

  const keywords: KeywordSet[] = trades.map((t) => ({
    trade: t,
    ...(KEYWORDS[t] ?? FALLBACK_KEYWORDS),
  }));

  const adCopyAngles: string[] = [];
  if (mode === 'claimable_surge') {
    const d = claimableRecent[0];
    adCopyAngles.push(
      `Reference the actual event: "${d.maxHailInches?.toFixed(2)}" hail hit ${d.reports[0]?.location ?? 'your area'} on ${d.date}" — specificity beats generic storm copy.`,
      'Lead with a free inspection, not a price. Post-storm intent is about finding out whether there is damage at all.',
      'Name the deadline: claims generally must be filed within a year of the date of loss. Urgency that is factually true converts without feeling like a gimmick.'
    );
  } else if (mode === 'damage_surge') {
    adCopyAngles.push(
      `Reference the date: "${recent[0].date} storm — free inspection for affected streets."`,
      'Say "inspection" rather than "replacement". Without confirmed claimable hail, over-promising a new roof creates refund conversations later.'
    );
  } else if (mode === 'pre_event') {
    const next = upcoming.sort((a, b) => a.dayOffset - b.dayOffset)[0];
    adCopyAngles.push(
      `Pre-storm copy: "Severe weather expected ${next.date} — book your inspection slot now."`,
      'Emphasise availability and response time. Before a storm, people are buying certainty that someone will pick up.'
    );
  } else {
    adCopyAngles.push(
      'No active storm surge — lead with trust signals: licensed, insured, local, warranty length.',
      'Maintenance and tune-up offers outperform emergency copy during quiet periods.',
      'Good time to collect reviews. Review count is what makes your storm campaign convert later.'
    );
  }

  return {
    budgetMultiplier,
    budgetRationale,
    radiusTargets,
    actions,
    keywords,
    adCopyAngles,
    limitations: [
      'This contains no measured search volume. Google Keyword Planner requires OAuth and an approved developer token, which cannot be called from a browser.',
      'Keyword lists are editorial recommendations based on how these trades typically buy, not measured CPC or volume data.',
      'Budget multipliers are heuristics derived from observed storm severity and recency, not from your historical conversion data. Verify against your own numbers.',
      'Geo clusters come from real NOAA report coordinates, so those are measured.',
    ],
  };
}
