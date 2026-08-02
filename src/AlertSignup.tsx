import { useState } from 'react';
import { alertsConfigured, startCheckout, subscribeToAlerts, type PaidPlan } from './stormAlerts';
import { TRADE_LABELS, type ServiceArea, type Trade } from './stormIntel';
import { HAIL_CLAIMABLE_INCHES } from './spcReports';

const TRADES = Object.keys(TRADE_LABELS) as Trade[];

export function AlertSignup({ area, defaultTrade }: { area: ServiceArea; defaultTrade?: Trade }) {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [trade, setTrade] = useState<Trade>(defaultTrade ?? 'roofing');
  const [radius, setRadius] = useState(25);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);

  const configured = alertsConfigured();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const result = await subscribeToAlerts({
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      trade,
      areaLabel: `${area.name}${area.state ? `, ${area.state}` : ''}`,
      latitude: area.latitude,
      longitude: area.longitude,
      radiusMiles: radius,
      minHailInches: HAIL_CLAIMABLE_INCHES,
      minWindMph: 58,
    });
    setBusy(false);

    if (result.ok) {
      setSubscriptionId(result.subscriptionId);
      setDone(true);
      return;
    }

    switch (result.reason) {
      case 'no_contact':
        setError('Add an email or a phone number so we can reach you.');
        break;
      case 'not_configured':
        setError('Alerts are not connected yet on this deployment.');
        break;
      default:
        setError(`Could not save that. ${result.detail ?? ''}`.trim());
    }
  }

  async function upgrade(plan: PaidPlan) {
    if (!subscriptionId) {
      setError('Save your area first, then choose a plan.');
      return;
    }
    setBusy(true);
    setError(null);
    const result = await startCheckout(subscriptionId, plan);
    setBusy(false);
    if (result.ok) window.location.href = result.url;
    else setError(result.detail);
  }

  if (done) {
    return (
      <section className="jl-alertbox jl-alertbox--done">
        <p className="jl-alertbox__eyebrow">You're on the list</p>
        <h3 className="jl-alertbox__title">
          We'll watch {area.name} for you.
        </h3>
        <p className="jl-alertbox__body">
          You'll hear from us when NOAA reports hail at or above{' '}
          {HAIL_CLAIMABLE_INCHES.toFixed(2)}" or wind at or above 58&nbsp;mph within {radius} miles.
          One message per storm — never a digest, never a newsletter.
        </p>

        <div className="jl-plans">
          <article className="jl-plan">
            <header>
              <span className="jl-plan__name">Alerts</span>
              <span className="jl-plan__price">$99<i>/mo</i></span>
            </header>
            <ul>
              <li>Email and SMS the moment your thresholds trip</li>
              <li>Unlimited claim evidence reports</li>
              <li>Full ad playbook with radius targets</li>
            </ul>
            <button
              className="jl-btn jl-btn--accent jl-btn--block"
              onClick={() => void upgrade('alerts')}
              disabled={busy}
            >
              {busy ? 'Opening checkout…' : 'Start alerts'}
            </button>
          </article>

          <article className="jl-plan jl-plan--feature">
            <header>
              <span className="jl-plan__name">Territory</span>
              <span className="jl-plan__price">$249<i>/mo</i></span>
            </header>
            <ul>
              <li>Everything in Alerts</li>
              <li><strong>Exclusive to one contractor per ZIP</strong></li>
              <li>48-hour head start before storms go public</li>
            </ul>
            <button
              className="jl-btn jl-btn--light jl-btn--block"
              onClick={() => void upgrade('territory')}
              disabled={busy}
            >
              {busy ? 'Opening checkout…' : 'Claim my territory'}
            </button>
          </article>
        </div>

        <p className="jl-alertbox__note">
          One exclusive roofing lead costs $150–550. Cancel any time, no contract.
        </p>
        {error && <p className="jl-alertbox__error">{error}</p>}
      </section>
    );
  }

  return (
    <section className="jl-alertbox">
      <div className="jl-alertbox__head">
        <div>
          <p className="jl-alertbox__eyebrow">Don't check. Get told.</p>
          <h3 className="jl-alertbox__title">
            Hail lands at 4am.
            <br />
            <span className="jl-alertbox__accent">You should already know by 6.</span>
          </h3>
          <p className="jl-alertbox__body">
            The scan above is free forever. Alerts are the part you don't have to remember —
            we watch NOAA for {area.name} and message you the moment your thresholds trip.
          </p>
        </div>
        <div className="jl-alertbox__stat">
          <span className="jl-alertbox__statnum">85%</span>
          <span className="jl-alertbox__statlabel">
            of storm leads go to whoever knocks first
          </span>
        </div>
      </div>

      <form className="jl-alertform" onSubmit={submit}>
        <label className="jl-field">
          <span>Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            autoComplete="email"
          />
        </label>
        <label className="jl-field">
          <span>Mobile (optional)</span>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1 555 010 0000"
            autoComplete="tel"
          />
        </label>
        <label className="jl-field">
          <span>Trade</span>
          <select value={trade} onChange={(e) => setTrade(e.target.value as Trade)}>
            {TRADES.map((t) => (
              <option key={t} value={t}>{TRADE_LABELS[t]}</option>
            ))}
          </select>
        </label>
        <label className="jl-field">
          <span>Radius</span>
          <select value={radius} onChange={(e) => setRadius(Number(e.target.value))}>
            {[10, 15, 25, 40, 60].map((r) => (
              <option key={r} value={r}>{r} miles</option>
            ))}
          </select>
        </label>
        <button type="submit" className="jl-btn jl-btn--accent" disabled={busy || !configured}>
          {busy ? 'Saving…' : 'Watch my area'}
        </button>
      </form>

      {error && <p className="jl-alertbox__error">{error}</p>}
      {!configured && (
        <p className="jl-alertbox__note">
          Not connected on this deployment — set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.
        </p>
      )}
      {configured && !error && (
        <p className="jl-alertbox__note">
          Free while in beta. One message per storm event. Unsubscribe any time.
        </p>
      )}
    </section>
  );
}
