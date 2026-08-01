import { useCallback, useMemo, useState } from 'react';
import { resolveServiceArea, type ServiceArea } from './stormIntel';
import {
  fetchSpcReports,
  groupByStormDay,
  HAIL_CLAIMABLE_INCHES,
  type SpcStormDay,
} from './spcReports';

/**
 * CLAIM EVIDENCE REPORT
 *
 * The transactional product. A contractor or adjuster needs to prove a storm
 * event occurred at a location on a date. This produces a formal, printable
 * document citing NOAA Storm Prediction Center observations.
 *
 * Deliberately designed to look like evidence, not marketing. It gets handed to
 * homeowners and insurance adjusters, so credibility is the entire point:
 * every figure is sourced, and the limitations are stated rather than hidden.
 */

const RADIUS_OPTIONS = [5, 10, 15, 25, 40];

function fmtDate(iso: string) {
  const d = new Date(`${iso}T12:00:00Z`);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

function claimDaysLeft(iso: string) {
  const age = Math.floor((Date.now() - new Date(`${iso}T12:00:00Z`).getTime()) / 86_400_000);
  return 365 - age;
}

export function ClaimReport() {
  const [address, setAddress] = useState('');
  const [radius, setRadius] = useState(15);
  const [days, setDays] = useState(365);
  const [loading, setLoading] = useState(false);
  const [area, setArea] = useState<ServiceArea | null>(null);
  const [stormDays, setStormDays] = useState<SpcStormDay[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  const run = useCallback(async () => {
    if (!address.trim()) return;
    setLoading(true);
    setError(null);
    setStormDays(null);
    setSelected(null);
    try {
      const resolved = await resolveServiceArea(address);
      setArea(resolved);
      if (!resolved.resolved) {
        setError(`Could not locate "${address}". Try "City, State" or a ZIP code.`);
        return;
      }
      const result = await fetchSpcReports({
        latitude: resolved.latitude,
        longitude: resolved.longitude,
        radiusMiles: radius,
        days,
        kinds: ['hail', 'wind', 'torn'],
        concurrency: 8,
      });
      const grouped = groupByStormDay(result.reports);
      setStormDays(grouped);
      if (grouped.length) setSelected(grouped[0].date);
    } catch {
      setError('Could not retrieve NOAA records. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [address, radius, days]);

  const active = useMemo(
    () => stormDays?.find((d) => d.date === selected) ?? null,
    [stormDays, selected]
  );

  return (
    <div className="min-h-screen bg-jobleak-paper">
      {/* ---------- CONTROLS (hidden when printing) ---------- */}
      <div className="no-print">
        <header className="bg-jobleak-ink px-6 py-12 text-white">
          <div className="mx-auto max-w-4xl">
            <span className="inline-block rounded-full bg-jobleak-blue/20 px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-jobleak-blue">
              Claim Evidence
            </span>
            <h1 className="mt-4 text-3xl font-black leading-tight tracking-tight md:text-4xl">
              Prove the storm happened.
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-300">
              A dated, sourced record of NOAA-observed hail and wind at a specific location —
              the documentation adjusters ask for. Generate it, print it, attach it to the claim.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-[1fr_auto_auto_auto]">
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && void run()}
                placeholder="Property location — city, state or ZIP"
                className="rounded-2xl border-0 px-5 py-4 text-base font-semibold text-jobleak-ink outline-none ring-2 ring-transparent focus:ring-jobleak-blue"
                aria-label="Property location"
              />
              <select
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                className="rounded-2xl border-0 px-4 py-4 text-sm font-bold text-jobleak-ink outline-none"
                aria-label="Search radius"
              >
                {RADIUS_OPTIONS.map((r) => (
                  <option key={r} value={r}>{r} mi radius</option>
                ))}
              </select>
              <select
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="rounded-2xl border-0 px-4 py-4 text-sm font-bold text-jobleak-ink outline-none"
                aria-label="Lookback period"
              >
                <option value={90}>Last 90 days</option>
                <option value={180}>Last 180 days</option>
                <option value={365}>Last 365 days</option>
              </select>
              <button
                onClick={() => void run()}
                disabled={loading || !address.trim()}
                className="whitespace-nowrap rounded-2xl bg-jobleak-blue px-8 py-4 text-base font-black text-white transition hover:brightness-110 disabled:opacity-50"
              >
                {loading ? 'Searching NOAA…' : 'Generate'}
              </button>
            </div>
            <p className="mt-3 text-xs font-semibold text-slate-400">
              Source: NOAA Storm Prediction Center. A 365-day search takes a few seconds.
            </p>
          </div>
        </header>

        <div className="mx-auto max-w-4xl px-6 pt-8">
          {error && (
            <div className="mb-6 rounded-2xl border border-orange-200 bg-orange-50 p-4 text-sm font-semibold text-orange-800">
              {error}
            </div>
          )}

          {loading && (
            <div className="mb-6 rounded-3xl border border-jobleak-border bg-white p-6">
              <div className="h-4 w-1/3 animate-pulse rounded bg-slate-200" />
              <div className="mt-3 h-3 w-2/3 animate-pulse rounded bg-slate-100" />
              <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-slate-100" />
            </div>
          )}

          {stormDays && stormDays.length === 0 && (
            <div className="mb-6 rounded-3xl border border-jobleak-border bg-white p-8 text-center">
              <p className="text-base font-black text-jobleak-ink">
                No NOAA storm reports within {radius} miles in the last {days} days.
              </p>
              <p className="mx-auto mt-2 max-w-lg text-sm text-jobleak-muted">
                Try a wider radius. Also note that NOAA reports depend on someone being present
                to report the storm — no record is not proof that nothing happened.
              </p>
            </div>
          )}

          {stormDays && stormDays.length > 0 && (
            <div className="mb-8">
              <h2 className="text-sm font-black uppercase tracking-[0.14em] text-jobleak-muted">
                Select an event ({stormDays.length} found)
              </h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {stormDays.map((d) => (
                  <button
                    key={d.date}
                    onClick={() => setSelected(d.date)}
                    className={`rounded-2xl border px-4 py-3 text-left transition ${
                      selected === d.date
                        ? 'border-jobleak-ink bg-jobleak-ink text-white'
                        : 'border-jobleak-border bg-white hover:border-jobleak-ink'
                    }`}
                  >
                    <span className="block font-mono text-xs font-bold">{d.date}</span>
                    <span className="block text-xs font-semibold opacity-80">
                      {d.maxHailInches ? `${d.maxHailInches.toFixed(2)}" hail` : null}
                      {d.maxHailInches && d.maxWindMph ? ' · ' : null}
                      {d.maxWindMph ? `${d.maxWindMph} mph` : null}
                      {!d.maxHailInches && !d.maxWindMph ? `${d.reportCount} reports` : null}
                    </span>
                    {d.claimableHail && (
                      <span className="mt-1 block text-[10px] font-black uppercase tracking-wider text-green-500">
                        Claimable
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {active && (
                <button
                  onClick={() => window.print()}
                  className="mt-6 rounded-2xl bg-jobleak-orange px-6 py-3 text-sm font-black text-white transition hover:brightness-110"
                >
                  Print / Save as PDF
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ---------- THE DOCUMENT ---------- */}
      {area?.resolved && active && (
        <div className="mx-auto max-w-4xl px-6 pb-16">
          <article className="print-document rounded-3xl border border-jobleak-border bg-white p-8 md:p-12">
            {/* letterhead */}
            <div className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-jobleak-ink pb-6">
              <div>
                <h2 className="text-2xl font-black tracking-tight text-jobleak-ink">
                  Storm Event Verification Report
                </h2>
                <p className="mt-1 text-sm font-semibold text-jobleak-muted">
                  Weather observation record for insurance documentation
                </p>
              </div>
              <div className="text-right text-xs font-semibold text-jobleak-muted">
                <p>Generated {new Date().toLocaleDateString('en-US')}</p>
                <p className="font-mono">Ref JL-{active.date.replace(/-/g, '')}</p>
              </div>
            </div>

            {/* summary block */}
            <dl className="mt-8 grid gap-6 sm:grid-cols-2">
              <div>
                <dt className="text-[11px] font-black uppercase tracking-[0.14em] text-jobleak-muted">
                  Location searched
                </dt>
                <dd className="mt-1 text-lg font-black text-jobleak-ink">
                  {area.name}{area.state ? `, ${area.state}` : ''}
                </dd>
                <dd className="font-mono text-xs text-jobleak-muted">
                  {area.latitude.toFixed(4)}, {area.longitude.toFixed(4)} · {radius} mi radius
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-black uppercase tracking-[0.14em] text-jobleak-muted">
                  Date of loss
                </dt>
                <dd className="mt-1 text-lg font-black text-jobleak-ink">{fmtDate(active.date)}</dd>
                <dd className="text-xs font-semibold text-jobleak-muted">
                  {claimDaysLeft(active.date) > 0
                    ? `Approximately ${claimDaysLeft(active.date)} days remain in a typical 365-day claim window`
                    : 'Beyond a typical 365-day claim window'}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-black uppercase tracking-[0.14em] text-jobleak-muted">
                  Maximum hail observed
                </dt>
                <dd className="mt-1 text-lg font-black text-jobleak-ink">
                  {active.maxHailInches ? `${active.maxHailInches.toFixed(2)} inches` : 'None reported'}
                </dd>
                {active.maxHailInches != null && (
                  <dd className="text-xs font-semibold text-jobleak-muted">
                    {active.maxHailInches >= HAIL_CLAIMABLE_INCHES
                      ? `At or above the ${HAIL_CLAIMABLE_INCHES.toFixed(2)}" threshold commonly associated with shingle damage`
                      : `Below the ${HAIL_CLAIMABLE_INCHES.toFixed(2)}" threshold commonly associated with shingle damage`}
                  </dd>
                )}
              </div>
              <div>
                <dt className="text-[11px] font-black uppercase tracking-[0.14em] text-jobleak-muted">
                  Maximum wind observed
                </dt>
                <dd className="mt-1 text-lg font-black text-jobleak-ink">
                  {active.maxWindMph ? `${active.maxWindMph} mph` : 'None reported'}
                </dd>
                <dd className="text-xs font-semibold text-jobleak-muted">
                  Nearest observation {active.nearestMiles.toFixed(1)} mi from the search point
                </dd>
              </div>
            </dl>

            {/* the evidence table */}
            <h3 className="mt-10 text-sm font-black uppercase tracking-[0.14em] text-jobleak-ink">
              Individual observations ({active.reports.length})
            </h3>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b-2 border-jobleak-ink">
                    <th className="py-2 pr-3 font-black uppercase tracking-wider">Time (UTC)</th>
                    <th className="py-2 pr-3 font-black uppercase tracking-wider">Type</th>
                    <th className="py-2 pr-3 font-black uppercase tracking-wider">Magnitude</th>
                    <th className="py-2 pr-3 font-black uppercase tracking-wider">Location</th>
                    <th className="py-2 pr-3 font-black uppercase tracking-wider">Dist.</th>
                    <th className="py-2 font-black uppercase tracking-wider">Coordinates</th>
                  </tr>
                </thead>
                <tbody>
                  {active.reports.map((r, i) => (
                    <tr key={`${r.date}-${r.time}-${i}`} className="border-b border-jobleak-border">
                      <td className="py-2 pr-3 font-mono">{r.time}</td>
                      <td className="py-2 pr-3 capitalize">
                        {r.kind === 'torn' ? 'Tornado' : r.kind}
                      </td>
                      <td className="py-2 pr-3 font-bold">
                        {r.hailInches != null ? `${r.hailInches.toFixed(2)}"` : null}
                        {r.windMph != null ? `${r.windMph} mph` : null}
                        {r.fScale ?? null}
                        {r.hailInches == null && r.windMph == null && !r.fScale ? '—' : null}
                      </td>
                      <td className="py-2 pr-3">
                        {r.location}, {r.county} Co., {r.state}
                      </td>
                      <td className="py-2 pr-3 font-mono">{r.distanceMiles.toFixed(1)} mi</td>
                      <td className="py-2 font-mono text-[10px]">
                        {r.latitude.toFixed(3)}, {r.longitude.toFixed(3)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* observer notes */}
            {active.reports.some((r) => r.comments) && (
              <>
                <h3 className="mt-10 text-sm font-black uppercase tracking-[0.14em] text-jobleak-ink">
                  Observer notes
                </h3>
                <ul className="mt-3 space-y-2">
                  {active.reports
                    .filter((r) => r.comments && r.comments.length > 4)
                    .slice(0, 12)
                    .map((r, i) => (
                      <li key={i} className="text-xs leading-relaxed text-jobleak-ink">
                        <span className="font-mono font-bold">{r.time}</span> — {r.comments}
                      </li>
                    ))}
                </ul>
              </>
            )}

            {/* provenance */}
            <div className="mt-10 border-t-2 border-jobleak-ink pt-6">
              <h3 className="text-sm font-black uppercase tracking-[0.14em] text-jobleak-ink">
                Source &amp; scope
              </h3>
              <ul className="mt-3 space-y-1.5 text-xs leading-relaxed text-jobleak-muted">
                <li>
                  <strong className="text-jobleak-ink">Source:</strong> NOAA / NWS Storm Prediction
                  Center preliminary storm reports, <span className="font-mono">spc.noaa.gov/climo/reports</span>
                </li>
                <li>
                  <strong className="text-jobleak-ink">Reporting day:</strong> SPC organises reports
                  by convective day, running 12:00 UTC to 12:00 UTC. Records shown are those filed
                  under {active.date}.
                </li>
                <li>
                  <strong className="text-jobleak-ink">Coverage:</strong> Reports are spotter,
                  public and instrument observations. Coverage depends on an observer being present.
                  The absence of a report is not evidence that no hail or wind occurred at a
                  specific address.
                </li>
                <li>
                  <strong className="text-jobleak-ink">Positional accuracy:</strong> Coordinates are
                  as filed with NOAA and may be estimated from radar. Distances are straight-line
                  from the geocoded search point, not from a surveyed property boundary.
                </li>
                <li>
                  <strong className="text-jobleak-ink">Status:</strong> SPC reports are preliminary
                  and subject to revision in NOAA's final Storm Events Database.
                </li>
                <li>
                  <strong className="text-jobleak-ink">Not an inspection:</strong> This document
                  records weather observations only. It does not assess, confirm or quantify damage
                  to any structure, and it is not an insurance adjustment or a legal opinion.
                </li>
              </ul>
            </div>
          </article>
        </div>
      )}
    </div>
  );
}
