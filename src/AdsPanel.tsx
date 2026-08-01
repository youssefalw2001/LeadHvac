import { useCallback, useMemo, useState } from 'react';
import { Badge } from './components/ui/Badge';
import { Card, CardContent, CardHeader } from './components/ui/Card';
import { cn } from './lib/utils';
import { buildAdsPlaybook, type AdsPlaybook } from './adsPlaybook';
import { buildStormIntelReport, TRADE_LABELS, type StormIntelReport, type Trade } from './stormIntel';

const PRIORITY_TONE = {
  now: 'orange',
  this_week: 'blue',
  standing: 'slate',
} as const;

const PRIORITY_LABEL = {
  now: 'Do now',
  this_week: 'This week',
  standing: 'Standing',
} as const;

export function AdsPanel() {
  const [query, setQuery] = useState('');
  const [trade, setTrade] = useState<Trade | 'all'>('all');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<StormIntelReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const result = await buildStormIntelReport(query);
      setReport(result);
      if (!result.area.resolved) setError(`Could not find "${query}". Try "City, State".`);
    } catch {
      setError('Could not build the playbook. Try again.');
    } finally {
      setLoading(false);
    }
  }, [query]);

  const playbook: AdsPlaybook | null = useMemo(
    () => (report && report.area.resolved ? buildAdsPlaybook(report.events, report.stormDays, trade) : null),
    [report, trade]
  );

  const tradesPresent = useMemo(
    () => (report ? [...new Set(report.events.map((e) => e.trade))] : []),
    [report]
  );

  return (
    <div className="min-h-screen bg-jobleak-paper">
      <header className="bg-jobleak-ink px-6 py-12 text-white">
        <div className="mx-auto max-w-4xl">
          <Badge tone="blue">Ad Playbook</Badge>
          <h1 className="mt-4 text-3xl font-black leading-tight tracking-tight md:text-4xl">
            Spend when demand actually spikes.
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-300">
            Most contractors run the same ad budget every month. Intent for
            "roof repair near me" spikes in a specific place on a specific day — and that day is
            knowable from NOAA reports.
          </p>

          <form
            className="mt-8 flex flex-col gap-3 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault();
              void run();
            }}
          >
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Your service area — e.g. Denver, Colorado"
              className="w-full rounded-2xl border-0 px-5 py-4 text-base font-semibold text-jobleak-ink outline-none ring-2 ring-transparent focus:ring-jobleak-blue"
              aria-label="Service area"
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="whitespace-nowrap rounded-2xl bg-jobleak-blue px-8 py-4 text-base font-black text-white transition hover:brightness-110 disabled:opacity-50"
            >
              {loading ? 'Building…' : 'Build playbook'}
            </button>
          </form>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-10">
        {error && (
          <div className="mb-6 rounded-2xl border border-orange-200 bg-orange-50 p-4 text-sm font-semibold text-orange-800">
            {error}
          </div>
        )}

        {loading && (
          <div className="space-y-4">
            <div className="jl-skeleton h-28 w-full" />
            <div className="jl-skeleton h-40 w-full" />
            <div className="jl-skeleton h-56 w-full" />
          </div>
        )}

        {!report && !loading && (
          <Card>
            <CardContent className="py-10 text-center">
              <p className="text-base font-bold text-jobleak-ink">
                Enter your service area to get a budget recommendation, exact radius targets, and
                keyword lists.
              </p>
              <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-jobleak-muted">
                Geo targets are built from the coordinates of real NOAA damage reports, so you can
                target the streets that actually got hit instead of the whole metro.
              </p>
            </CardContent>
          </Card>
        )}

        {playbook && report && (
          <>
            {/* ---------- BUDGET ---------- */}
            <Card
              className={cn(
                'mb-6',
                playbook.budgetMultiplier >= 3
                  ? 'border-orange-300 bg-orange-50'
                  : playbook.budgetMultiplier > 1
                    ? 'border-jobleak-blue/40 bg-white'
                    : 'bg-white'
              )}
            >
              <CardContent className="py-6">
                <div className="flex flex-wrap items-start justify-between gap-6">
                  <div>
                    <span className="text-[11px] font-black uppercase tracking-[0.14em] text-jobleak-muted">
                      Recommended budget
                    </span>
                    <p className="mt-1 text-4xl font-black text-jobleak-ink">
                      {playbook.budgetMultiplier}×
                      <span className="ml-2 text-base font-bold text-jobleak-muted">
                        your normal daily spend
                      </span>
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] font-black uppercase tracking-[0.14em] text-jobleak-muted">
                      Area
                    </span>
                    <p className="mt-1 text-lg font-black text-jobleak-ink">
                      {report.area.name}
                      {report.area.state ? `, ${report.area.state}` : ''}
                    </p>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-jobleak-ink">
                  {playbook.budgetRationale}
                </p>

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
                        {TRADE_LABELS[t]}
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ---------- ACTIONS ---------- */}
            <Card className="mb-6">
              <CardHeader>
                <h3 className="text-lg font-black tracking-tight text-jobleak-ink">Actions</h3>
                <p className="mt-1 text-sm text-jobleak-muted">
                  Each one shows the measurement it is based on, so you can check the reasoning.
                </p>
              </CardHeader>
              <CardContent>
                {playbook.actions.map((a) => (
                  <div
                    key={a.title}
                    className="border-t border-jobleak-border py-4 first:border-t-0 first:pt-0"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={PRIORITY_TONE[a.priority]}>{PRIORITY_LABEL[a.priority]}</Badge>
                      <h4 className="text-base font-black text-jobleak-ink">{a.title}</h4>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-jobleak-muted">{a.detail}</p>
                    <p className="mt-2 text-xs font-semibold text-jobleak-blue">Basis: {a.basis}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* ---------- GEO TARGETS ---------- */}
            {playbook.radiusTargets.length > 0 && (
              <Card className="mb-6">
                <CardHeader>
                  <h3 className="text-lg font-black tracking-tight text-jobleak-ink">
                    Exact radius targets
                  </h3>
                  <p className="mt-1 text-sm text-jobleak-muted">
                    Built from the coordinates of observed damage reports. Paste these into Google
                    Ads location targeting as radius targets — damage is clustered, so metro-wide
                    targeting wastes most of your budget.
                  </p>
                </CardHeader>
                <CardContent>
                  {playbook.radiusTargets.map((t) => (
                    <div
                      key={`${t.latitude},${t.longitude}`}
                      className="flex flex-wrap items-center justify-between gap-3 border-t border-jobleak-border py-3 first:border-t-0 first:pt-0"
                    >
                      <div>
                        <p className="text-sm font-black text-jobleak-ink">{t.label}</p>
                        <p className="font-mono text-xs text-jobleak-muted">
                          {t.latitude}, {t.longitude} · {t.radiusMiles} mi radius
                        </p>
                      </div>
                      <Badge tone="green">{t.reportCount} reports</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* ---------- KEYWORDS ---------- */}
            <Card className="mb-6">
              <CardHeader>
                <h3 className="text-lg font-black tracking-tight text-jobleak-ink">Keywords</h3>
                <p className="mt-1 text-sm text-jobleak-muted">
                  Editorial lists based on how these trades buy — not measured volume. See the note
                  at the bottom.
                </p>
              </CardHeader>
              <CardContent>
                {playbook.keywords.map((k) => (
                  <div
                    key={k.trade}
                    className="border-t border-jobleak-border py-4 first:border-t-0 first:pt-0"
                  >
                    <h4 className="font-black text-jobleak-ink">{TRADE_LABELS[k.trade]}</h4>
                    {k.stormIntent.length > 0 && (
                      <div className="mt-3">
                        <span className="text-[11px] font-black uppercase tracking-[0.14em] text-orange-600">
                          Storm intent — bid up after an event
                        </span>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {k.stormIntent.map((w) => (
                            <span
                              key={w}
                              className="rounded-lg bg-orange-50 px-2 py-1 font-mono text-[11px] font-semibold text-orange-800"
                            >
                              {w}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {k.evergreen.length > 0 && (
                      <div className="mt-3">
                        <span className="text-[11px] font-black uppercase tracking-[0.14em] text-jobleak-muted">
                          Evergreen
                        </span>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {k.evergreen.map((w) => (
                            <span
                              key={w}
                              className="rounded-lg bg-slate-100 px-2 py-1 font-mono text-[11px] font-semibold text-slate-700"
                            >
                              {w}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="mt-3">
                      <span className="text-[11px] font-black uppercase tracking-[0.14em] text-jobleak-muted">
                        Negatives — add these or they will drain the budget
                      </span>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {k.negatives.map((w) => (
                          <span
                            key={w}
                            className="rounded-lg bg-slate-50 px-2 py-1 font-mono text-[11px] font-semibold text-slate-500 line-through"
                          >
                            {w}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* ---------- COPY ANGLES ---------- */}
            <Card className="mb-6">
              <CardHeader>
                <h3 className="text-lg font-black tracking-tight text-jobleak-ink">Ad copy angles</h3>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {playbook.adCopyAngles.map((a) => (
                    <li key={a} className="text-sm leading-relaxed text-jobleak-ink">
                      • {a}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* ---------- HONESTY ---------- */}
            <Card className="mb-6 bg-slate-50">
              <CardHeader>
                <h3 className="text-base font-black tracking-tight text-jobleak-ink">
                  What this is and isn't
                </h3>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1.5">
                  {playbook.limitations.map((l) => (
                    <li key={l} className="text-xs leading-relaxed text-jobleak-muted">
                      • {l}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
