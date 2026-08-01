import { useCallback, useMemo, useState } from 'react';
import { AlertSignup } from './AlertSignup';
import { parseInput, PRIMARY_SERVICE, type ParsedInput } from './tradeParser';
import { Badge } from './components/ui/Badge';
import { Card, CardContent, CardHeader } from './components/ui/Card';
import { cn } from './lib/utils';
import {
  buildStormIntelReport,
  THRESHOLDS,
  TRADE_LABELS,
  type StormIntelReport,
  type StormEvent,
  type Trade,
} from './stormIntel';

// Labels live in the engine so the trade list has one source of truth.
const TRADE_LABEL = TRADE_LABELS;

const SEVERITY_TONE = {
  critical: 'orange',
  high: 'blue',
  moderate: 'slate',
} as const;

const usd = (n: number) =>
  n >= 1_000_000
    ? `$${(n / 1_000_000).toFixed(1)}M`
    : `$${Math.round(n / 1000)}k`;

function relativeDay(offset: number) {
  if (offset === 0) return 'today';
  if (offset === 1) return 'tomorrow';
  if (offset > 0) return `in ${offset} days`;
  if (offset === -1) return 'yesterday';
  return `${Math.abs(offset)} days ago`;
}

function EventRow({ event }: { event: StormEvent }) {
  return (
    <div className="border-t border-jobleak-border py-4 first:border-t-0 first:pt-0">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={SEVERITY_TONE[event.severity]}>{event.severity}</Badge>
        <Badge tone="slate">{TRADE_LABEL[event.trade]}</Badge>
        <span className="text-xs font-semibold text-jobleak-muted">
          {event.dayCount > 1 ? event.dateSpan : event.date} · peak {relativeDay(event.dayOffset)}
        </span>
        {typeof event.claimWindowDaysLeft === 'number' && (
          <Badge tone="green">{event.claimWindowDaysLeft}d claim window left</Badge>
        )}
        {event.firstOfSeason && <Badge tone="orange">First of season</Badge>}
      </div>

      <h4 className="mt-2 text-base font-black text-jobleak-ink">{event.headline}</h4>

      <p className="mt-1 font-mono text-sm font-semibold text-jobleak-blue">
        {event.measurement}
      </p>

      <p className="mt-2 text-sm leading-relaxed text-jobleak-muted">{event.why}</p>

      <div className="mt-3 rounded-2xl bg-slate-50 p-3">
        <span className="text-[11px] font-black uppercase tracking-[0.14em] text-jobleak-ink">
          Do this
        </span>
        <p className="mt-1 text-sm leading-relaxed text-jobleak-ink">{event.action}</p>
      </div>

      {event.services.length > 0 && (
        <div className="mt-3">
          <span className="text-[11px] font-black uppercase tracking-[0.14em] text-jobleak-muted">
            Jobs to sell
          </span>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {event.services.map((s) => (
              <span
                key={s}
                className="rounded-lg border border-jobleak-border bg-white px-2 py-1 text-[11px] font-bold text-jobleak-ink"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  subtitle,
  events,
  empty,
}: {
  title: string;
  subtitle: string;
  events: StormEvent[];
  empty: string;
}) {
  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-lg font-black tracking-tight text-jobleak-ink">{title}</h3>
          <span className="text-sm font-bold text-jobleak-muted">
            {events.length} event{events.length === 1 ? '' : 's'}
          </span>
        </div>
        <p className="mt-1 text-sm text-jobleak-muted">{subtitle}</p>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <p className="text-sm text-jobleak-muted">{empty}</p>
        ) : (
          events.map((e) => <EventRow key={e.id} event={e} />)
        )}
      </CardContent>
    </Card>
  );
}

export function StormRadar() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<StormIntelReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [trade, setTrade] = useState<Trade | 'all'>('all');
  const [parsedInput, setParsedInput] = useState<ParsedInput | null>(null);

  const run = useCallback(async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    setError(null);

    // Read the sentence first: "I'm an HVAC guy in the Bronx" gives us both the
    // trade and the place, so the report can filter itself instead of making
    // the user click chips.
    const parsed = parseInput(q);
    setParsedInput(parsed);
    if (parsed.trade) setTrade(parsed.trade);

    const locationQuery = parsed.location || q;

    try {
      const result = await buildStormIntelReport(locationQuery);
      setReport(result);
      if (!result.area.resolved) {
        setError(
          `Could not find "${locationQuery}". Try adding the state — for example "Bronx, New York".`
        );
      }
    } catch {
      setError('Something went wrong fetching weather data. Try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const filtered = useMemo(() => {
    if (!report) return [];
    return trade === 'all' ? report.events : report.events.filter((e) => e.trade === trade);
  }, [report, trade]);

  // Only wind/hail damage creates an insurance claim. Heat and cold create
  // demand, not claims — mixing them would be a lie a contractor spots instantly.
  const claimable = filtered.filter((e) => e.horizon === 'past' && e.claimable);
  const pastDemand = filtered.filter((e) => e.horizon === 'past' && !e.claimable);
  const future = filtered.filter((e) => e.horizon === 'future');

  const totals = useMemo(() => {
    if (!report) return null;
    const relevant =
      trade === 'all'
        ? report.valueEstimates
        : report.valueEstimates.filter((v) => v.trade === trade);
    return relevant.reduce(
      (acc, v) => ({ low: acc.low + v.lowUsd, high: acc.high + v.highUsd }),
      { low: 0, high: 0 }
    );
  }, [report, trade]);

  const tradesPresent = useMemo(() => {
    if (!report) return [] as Trade[];
    return [...new Set(report.events.map((e) => e.trade))];
  }, [report]);

  /**
   * The single most valuable thing, in one sentence.
   *
   * Ranking: a live NWS alert beats claimable damage, which beats an imminent
   * forecast event, which beats recent demand history. Anything else and we say
   * plainly that it is quiet rather than dressing up filler as an opportunity.
   */
  const headline = useMemo(() => {
    if (!report || !report.area.resolved) return null;
    const place = report.area.name;

    if (report.activeAlerts.length > 0) {
      const a = report.activeAlerts[0];
      return {
        label: 'Happening now',
        title: `${a.event} active in ${place} right now.`,
        detail: `${a.headline} Phones are ringing while this is live — answer them and get booked before it expires.`,
        services: filtered[0]?.services ?? [],
      };
    }

    // Biggest opportunity first, then tightest deadline. Sorting by deadline
    // alone surfaces the oldest small event over 2" hail, which is the wrong
    // answer to "where is my best money".
    const severityRank = { critical: 0, high: 1, moderate: 2 } as const;
    const claim = claimable
      .slice()
      .sort(
        (a, b) =>
          severityRank[a.severity] - severityRank[b.severity] ||
          (a.claimWindowDaysLeft ?? 9999) - (b.claimWindowDaysLeft ?? 9999)
      )[0];
    if (claim) {
      return {
        label: 'Your best money right now',
        title: claim.headline.includes('hail')
          ? `${claim.measurement.match(/[\d.]+"/)?.[0] ?? 'Claimable'} hail hit ${place} on ${claim.date}.`
          : `Storm damage in ${place} on ${claim.date} is still claimable.`,
        detail: `${claim.claimWindowDaysLeft} days left in a typical claim window. ${claim.action}`,
        services: claim.services,
      };
    }

    const soon = future
      .filter((e) => e.severity === 'critical' || e.severity === 'high')
      .sort((a, b) => a.dayOffset - b.dayOffset)[0];
    if (soon) {
      return {
        label: `${soon.dayOffset} day${soon.dayOffset === 1 ? '' : 's'} of lead time`,
        title: `${soon.headline} in ${place}.`,
        detail: `${soon.measurement}. ${soon.action}`,
        services: soon.services,
      };
    }

    const recent = pastDemand[0];
    if (recent) {
      return {
        label: 'Nothing urgent',
        title: `No storm damage or demand spike in ${place} right now.`,
        detail: `The most recent activity was ${recent.headline.toLowerCase()} on ${recent.date}. Quiet weeks are for maintenance offers, reviews and building your storm campaign so it is ready to switch on.`,
        services: recent.services,
      };
    }

    return {
      label: 'All quiet',
      title: `Nothing measurable in ${place} in the last ${THRESHOLDS.LOOKBACK_DAYS} days.`,
      detail:
        'No NOAA damage reports and no forecast spikes. Get on alerts below so you are told the moment that changes, instead of checking.',
      services: [],
    };
  }, [report, filtered, claimable, future, pastDemand]);

  return (
    <div className="min-h-screen bg-jobleak-paper">
      {/* ---------- HERO ---------- */}
      <header className="bg-jobleak-ink px-6 py-14 text-white">
        <div className="mx-auto max-w-4xl">
          <Badge tone="orange">Storm Intelligence</Badge>
          <h1 className="mt-4 text-4xl font-black leading-tight tracking-tight md:text-5xl">
            Tell us what you do and where.
            <br />
            <span className="text-jobleak-orange">We'll find the work.</span>
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-slate-300">
            Type it how you'd say it. We read NOAA storm reports, the 14-day forecast and
            live weather alerts, then hand you the jobs that are actually sellable right now.
          </p>

          <form
            className="mt-8 flex flex-col gap-3 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault();
              void run(query);
            }}
          >
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="I'm an HVAC guy in the Bronx"
              className="w-full rounded-2xl border-0 px-5 py-4 text-base font-semibold text-jobleak-ink outline-none ring-2 ring-transparent focus:ring-jobleak-orange"
              aria-label="What you do and where you work"
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="whitespace-nowrap rounded-2xl bg-jobleak-orange px-8 py-4 text-base font-black text-white transition hover:brightness-110 disabled:opacity-50"
            >
              {loading ? 'Scanning…' : 'Scan my area'}
            </button>
          </form>

          <div className="mt-4 flex flex-wrap gap-2">
            {[
              "I'm a roofer in Oklahoma City",
              'tree service Denver CO',
              'I do gutters around Kansas City',
            ].map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => {
                  setQuery(example);
                  void run(example);
                }}
                className="rounded-full border border-white/15 px-3 py-1.5 text-xs font-bold text-slate-300 transition hover:border-white/40 hover:text-white"
              >
                {example}
              </button>
            ))}
          </div>

          <p className="mt-4 text-xs font-semibold text-slate-400">
            Free forever. NOAA and NWS data. No account, no card, nothing stored.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-10">
        {error && (
          <div className="mb-6 rounded-2xl border border-orange-200 bg-orange-50 p-4 text-sm font-semibold text-orange-800">
            {error}
          </div>
        )}

        {loading && (
          <div className="space-y-4" aria-live="polite" aria-busy="true">
            <p className="text-sm font-bold text-jobleak-muted">
              Reading NOAA storm reports, forecast and active alerts…
            </p>
            <div className="jl-skeleton h-28 w-full" />
            <div className="jl-skeleton h-48 w-full" />
            <div className="jl-skeleton h-48 w-full" />
          </div>
        )}

        {!report && !loading && (
          <Card>
            <CardContent className="py-10 text-center">
              <p className="text-base font-bold text-jobleak-ink">
                Enter your service area to scan {THRESHOLDS.LOOKBACK_DAYS} days back and{' '}
                {THRESHOLDS.FORECAST_DAYS} days forward.
              </p>
              <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-jobleak-muted">
                Most property policies allow claims up to {THRESHOLDS.CLAIM_WINDOW_DAYS} days
                after the date of loss. Storms from months ago are often still worth money —
                homeowners just do not know they have damage.
              </p>
            </CardContent>
          </Card>
        )}

        {report && report.area.resolved && (
          <>
            {/* ---------- WHAT WE READ ---------- */}
            {parsedInput?.wasNaturalLanguage && (
              <div className="mb-5 flex flex-wrap items-center gap-2 text-sm">
                <span className="font-black uppercase tracking-[0.14em] text-[11px] text-jobleak-muted">
                  We read
                </span>
                {parsedInput.trade ? (
                  <Badge tone="blue">{TRADE_LABEL[parsedInput.trade]}</Badge>
                ) : (
                  <Badge tone="orange">No trade detected</Badge>
                )}
                <span className="font-bold text-jobleak-ink">
                  in {report.area.name}
                  {report.area.state ? `, ${report.area.state}` : ''}
                </span>
                {!parsedInput.trade && (
                  <span className="text-xs font-semibold text-jobleak-muted">
                    — pick your trade below to filter this down
                  </span>
                )}
              </div>
            )}

            {/* ---------- THE ANSWER, FIRST ---------- */}
            {headline && (
              <div className="mb-6 rounded-3xl border-2 border-jobleak-ink bg-white p-6 md:p-8">
                <span className="text-[11px] font-black uppercase tracking-[0.16em] text-jobleak-orange">
                  {headline.label}
                </span>
                <h2 className="mt-3 text-2xl font-black leading-tight tracking-tight text-jobleak-ink md:text-3xl">
                  {headline.title}
                </h2>
                <p className="mt-3 max-w-2xl text-base leading-relaxed text-jobleak-muted">
                  {headline.detail}
                </p>
                {headline.services.length > 0 && (
                  <div className="mt-5 border-t border-jobleak-border pt-4">
                    <span className="text-[11px] font-black uppercase tracking-[0.14em] text-jobleak-muted">
                      Start with these
                    </span>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {headline.services.slice(0, 4).map((s) => (
                        <span
                          key={s}
                          className="rounded-lg bg-jobleak-ink px-2.5 py-1.5 text-xs font-bold text-white"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ---------- SUMMARY ---------- */}
            <Card className="mb-6 border-jobleak-blue/30 bg-white">
              <CardContent className="py-6">
                <div className="flex flex-wrap items-start justify-between gap-6">
                  <div>
                    <span className="text-[11px] font-black uppercase tracking-[0.14em] text-jobleak-muted">
                      Service area
                    </span>
                    <p className="mt-1 text-2xl font-black text-jobleak-ink">
                      {report.area.name}
                      {report.area.state ? `, ${report.area.state}` : ''}
                    </p>
                    <p className="mt-1 font-mono text-xs text-jobleak-muted">
                      {report.area.latitude.toFixed(3)}, {report.area.longitude.toFixed(3)}
                    </p>
                  </div>
                  {totals && totals.low > 0 && (
                    <div className="text-right">
                      <span className="text-[11px] font-black uppercase tracking-[0.14em] text-jobleak-muted">
                        Estimated opportunity
                      </span>
                      <p className="mt-1 text-3xl font-black text-jobleak-blue">
                        {usd(totals.low)}–{usd(totals.high)}
                      </p>
                      <p className="text-[11px] font-semibold text-jobleak-muted">
                        {trade === 'all'
                          ? 'combined across all trades — filter to your trade'
                          : `${TRADE_LABEL[trade]} only`}
                      </p>
                    </div>
                  )}
                </div>

                {/* trade filter */}
                {tradesPresent.length > 1 && (
                  <div className="mt-6 flex flex-wrap gap-2">
                    <button
                      onClick={() => setTrade('all')}
                      className={cn(
                        'rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.12em] transition',
                        trade === 'all'
                          ? 'border-jobleak-ink bg-jobleak-ink text-white'
                          : 'border-jobleak-border bg-white text-jobleak-muted hover:border-jobleak-ink'
                      )}
                    >
                      All trades
                    </button>
                    {tradesPresent.map((t) => (
                      <button
                        key={t}
                        onClick={() => setTrade(t)}
                        className={cn(
                          'rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.12em] transition',
                          trade === t
                            ? 'border-jobleak-ink bg-jobleak-ink text-white'
                            : 'border-jobleak-border bg-white text-jobleak-muted hover:border-jobleak-ink'
                        )}
                      >
                        {TRADE_LABEL[t]}
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ---------- ACTIVE ALERTS ---------- */}
            {report.activeAlerts.length > 0 && (
              <Card className="mb-6 border-orange-300 bg-orange-50">
                <CardHeader>
                  <h3 className="text-lg font-black tracking-tight text-jobleak-ink">
                    Active right now
                  </h3>
                  <p className="mt-1 text-sm text-jobleak-muted">
                    Live National Weather Service alerts for this location.
                  </p>
                </CardHeader>
                <CardContent>
                  {report.activeAlerts.map((a) => (
                    <div
                      key={a.id}
                      className="border-t border-orange-200 py-3 first:border-t-0 first:pt-0"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone="orange">{a.event}</Badge>
                        <span className="text-xs font-bold text-jobleak-muted">
                          {a.severity} · {a.urgency}
                        </span>
                      </div>
                      <p className="mt-1 text-sm font-bold text-jobleak-ink">{a.headline}</p>
                      <p className="mt-1 text-xs text-jobleak-muted">{a.areaDesc}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* ---------- FUTURE (most actionable, so it goes first) ---------- */}
            <Section
              title="Coming — staff for it"
              subtitle={`Next ${THRESHOLDS.FORECAST_DAYS} days. Lead time is the whole advantage: get booked before your competitors' phones ring.`}
              events={future}
              empty="No demand spikes forecast in the next two weeks for this area."
            />

            {/* ---------- CLAIMABLE DAMAGE ---------- */}
            <Section
              title="Still claimable — wind damage"
              subtitle={`Wind events in the last ${THRESHOLDS.LOOKBACK_DAYS} days. Property policies typically allow claims up to ${THRESHOLDS.CLAIM_WINDOW_DAYS} days from date of loss, so this damage is still sellable.`}
              events={claimable}
              empty={`No wind events above ${THRESHOLDS.WIND_DAMAGING_MPH} mph in the lookback window. That is good news for homeowners and quiet news for you — check the forecast section instead.`}
            />

            {/* ---------- PAST DEMAND (not claims) ---------- */}
            <Section
              title="Recent demand history"
              subtitle="Heat, freeze and rainfall events from the last few months. These do not create insurance claims — they show you when your phone was busy and who you never got back to."
              events={pastDemand}
              empty="No significant temperature or rainfall events in the lookback window."
            />

            {/* ---------- ALERTS: the paid product ---------- */}
            <AlertSignup
              area={report.area}
              defaultTrade={trade === 'all' ? tradesPresent[0] : trade}
            />

            {/* ---------- WORK WINDOWS (the inverse signal) ---------- */}
            {report.workWindows.length > 0 && (
              <Card className="mb-6 border-green-300 bg-green-50">
                <CardHeader>
                  <h3 className="text-lg font-black tracking-tight text-jobleak-ink">
                    Bookable work windows
                  </h3>
                  <p className="mt-1 text-sm text-jobleak-muted">
                    Stretches of dry, mild, low-wind days in the forecast. For trades that
                    need to <em>work</em>, not chase — exterior paint, concrete, installs.
                  </p>
                </CardHeader>
                <CardContent>
                  {report.workWindows.slice(0, 4).map((w) => (
                    <div
                      key={`${w.startDate}-${w.endDate}`}
                      className="border-t border-green-200 py-3 first:border-t-0 first:pt-0"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone="green">{w.days} days</Badge>
                        <span className="font-mono text-sm font-bold text-jobleak-ink">
                          {w.startDate} → {w.endDate}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-jobleak-muted">{w.detail}</p>
                      <p className="mt-1 text-xs font-semibold text-jobleak-muted">
                        Good for: {w.trades.map((t) => TRADE_LABEL[t]).join(', ')}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* ---------- ASSUMPTIONS ---------- */}
            {report.valueEstimates.length > 0 && (
              <Card className="mb-6">
                <CardHeader>
                  <h3 className="text-lg font-black tracking-tight text-jobleak-ink">
                    How we got that number
                  </h3>
                  <p className="mt-1 text-sm text-jobleak-muted">
                    Weather is measured. Money is estimated. Swap in your own numbers.
                  </p>
                </CardHeader>
                <CardContent>
                  {report.valueEstimates.map((v) => (
                    <div
                      key={v.trade}
                      className="border-t border-jobleak-border py-4 first:border-t-0 first:pt-0"
                    >
                      <div className="flex items-baseline justify-between gap-3">
                        <h4 className="font-black text-jobleak-ink">{TRADE_LABEL[v.trade]}</h4>
                        <span className="font-mono text-sm font-bold text-jobleak-blue">
                          {usd(v.lowUsd)}–{usd(v.highUsd)}
                        </span>
                      </div>
                      <ul className="mt-2 space-y-1">
                        {v.assumptions.map((a) => (
                          <li key={a} className="text-xs leading-relaxed text-jobleak-muted">
                            • {a}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* ---------- TRANSPARENCY ---------- */}
            <Card className="mb-6 bg-slate-50">
              <CardHeader>
                <h3 className="text-base font-black tracking-tight text-jobleak-ink">
                  Data sources & limits
                </h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {report.dataSources.map((s) => (
                    <div key={s.name} className="flex flex-wrap items-center gap-2 text-xs">
                      <Badge tone={s.status === 'live' ? 'green' : 'slate'}>{s.status}</Badge>
                      <span className="font-black text-jobleak-ink">{s.name}</span>
                      <span className="font-mono text-jobleak-muted">{s.endpoint}</span>
                      <span className="text-jobleak-muted">— {s.detail}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 border-t border-jobleak-border pt-4">
                  <span className="text-[11px] font-black uppercase tracking-[0.14em] text-jobleak-muted">
                    What this cannot tell you
                  </span>
                  <ul className="mt-2 space-y-1">
                    {report.limitations.map((l) => (
                      <li key={l} className="text-xs leading-relaxed text-jobleak-muted">
                        • {l}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
