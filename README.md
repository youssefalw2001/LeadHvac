# JobLeak — Storm Intelligence

Tells home-service contractors which storms in their service area produced work
they can **still sell**, and which demand spikes are coming early enough to staff for.

Live at `#/` (Storm Radar). Previous marketing home preserved at `#home`.

## Why this instead of "local SEO gaps"

Booking and local-SEO audit tools are a saturated, commoditised market. Weather-driven
demand is not. Contractors already chase storms manually — this makes it dated,
measured and repeatable.

The pitch changed from an unprovable claim to a verifiable one:

| | |
|---|---|
| Before | "You might be leaking jobs to competitors" |
| Now | "58 mph gusts hit your area on July 12. Claim window closes in 287 days." |

## The three horizons

| Horizon | Window | Why it's worth money |
|---|---|---|
| **Coming** | next 14 days | Lead time. Stock parts, extend hours, pre-book before the phones ring. |
| **Still claimable** | last 120 days | Property policies typically allow claims up to 365 days from date of loss. Homeowners usually don't know they have damage. |
| **Recent demand** | last 120 days | Heat/freeze/rain history — who you never got back to. |

## Data sources

All free, keyless, CORS-friendly, no backend required:

| Source | Used for |
|---|---|
| `geocoding-api.open-meteo.com` | Service area → coordinates |
| `api.open-meteo.com/v1/forecast` | 14-day forward outlook |
| `archive-api.open-meteo.com/v1/archive` | 120-day historical lookback |
| `api.weather.gov/alerts/active` | Live NWS warnings |

## Thresholds

These are published meteorological and insurance-industry values, not tuned
parameters — which is exactly why they're safe to hard-code.

| Threshold | Value | Meaning |
|---|---|---|
| `WIND_SEVERE_MPH` | 58 | NWS severe thunderstorm criterion (50 kt) |
| `WIND_DAMAGING_MPH` | 45 | Below severe, still lifts shingles and gutters |
| `HEAT_AC_CRITICAL_F` | 100 | Condenser failure surge |
| `HEAT_AC_STRESS_F` | 95 | Tune-up and repair demand |
| `COLD_FURNACE_F` | 32 | No-heat calls |
| `COLD_PIPE_BURST_F` | 20 | Real burst risk for uninsulated pipe |
| `HEAVY_RAIN_MM` | 25 | ~1 inch in a day; seepage and sump failures |
| `CLAIM_WINDOW_DAYS` | 365 | Typical policy claim deadline |

## Design rules

**1. Every number is measured or labelled as an assumption.** No invented "scores"
presented as data. Weather comes from an API. Job counts and ticket sizes are
assumptions, shown to the user in the "How we got that number" panel so they can
substitute their own average ticket.

**2. Consecutive days cluster into one event.** A 6-day heatwave is one thing you
staff for, not six opportunities. Before clustering, Dallas reported 46 events and a
$21,850–$918,000 range. After: 15 events, $15,500–$46,500. The second one is
believable.

**3. Only wind creates claims.** Heat and cold create demand. Putting a heatwave under
"still claimable" is the kind of error a contractor spots in five seconds, and then
never trusts anything else on the page.

**4. Limits are shown, not hidden.** Hail size isn't available from these endpoints —
and hail is the single biggest driver of roof claims. The UI says so. Archive data
lags ~5 days. Gusts are grid-point, not per-address. All stated in the report.

## Security

`import.meta.env.VITE_*` values are **inlined into the production bundle and publicly
readable.** An earlier version read `VITE_SAM_API_KEY` and `VITE_GOOGLE_PLACES_API_KEY`
in the browser, and put the SAM key directly into a URL query string. Those reads have
been removed.

Permits, federal bids and business-openings data need a Supabase Edge Function holding
the secrets server-side and returning only aggregate counts.

`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are safe — the anon key is designed to
be public and is constrained by Row Level Security.

## Develop

```bash
npm install
npm run dev      # vite dev server
npm run lint     # tsc --noEmit
npm run build    # production build
```

Verify the live data sources and see a full report in the terminal:

```bash
node scripts/verify-storm-intel.mjs "Oklahoma City, Oklahoma"
npx tsx scripts/demo-report.ts "Dallas, Texas"
```

## Not done yet

- Hail size — needs a paid source or NOAA storm-events ingestion
- Email/SMS alerts when a threshold trips (the actual subscription hook)
- Multi-ZIP service radius rather than a single point
- Editable average ticket in the UI (the engine already accepts it via `ValueParams`)
- Shareable/exportable report
