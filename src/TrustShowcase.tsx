import { useState } from 'react';
import { Check, Building2, CloudSun, FileSearch, Megaphone, Search, ShieldCheck } from 'lucide-react';

const showcaseSlides = [
  {
    id: 'radar',
    eyebrow: 'Opportunity Radar',
    title: 'See what local jobs to chase this week.',
    text: 'JobLeak ranks service opportunities by urgency, public signals, and campaign readiness so contractors know what to promote next.',
    bullets: ['Top 3 opportunities by market', 'Opportunity score and confidence', 'Recommended campaign type']
  },
  {
    id: 'campaigns',
    eyebrow: 'Campaign Generator',
    title: 'Turn a signal into a campaign pack instantly.',
    text: 'Generate Google Search assets, Local Services checklists, reactivation copy, email, SMS, and a simple call script from one opportunity card.',
    bullets: ['Google ad copy and keywords', 'Offer and landing page headline', 'Call script and launch checklist']
  },
  {
    id: 'signals',
    eyebrow: 'Signal Sources',
    title: 'Show where the recommendation came from.',
    text: 'JobLeak separates live sources from estimates so the radar feels useful, honest, and grounded instead of random.',
    bullets: ['Live weather and NWS alerts', 'Estimated search-intent layer', 'Permit, business, and bid hooks']
  },
  {
    id: 'inbox',
    eyebrow: 'Lead Inbox',
    title: 'Keep scan requests and follow-up organized.',
    text: 'The admin inbox gives the owner a simple place to review incoming scan requests and move prospects toward booked calls.',
    bullets: ['Free scan requests', 'Lead status workflow', 'Notes and follow-up tracking']
  }
];

const sampleReactions = [
  {
    quote: 'This tells me what service to push this week instead of guessing what ad to run.',
    name: 'Sample HVAC owner reaction',
    market: 'Phoenix-style heat market'
  },
  {
    quote: 'I do not need another SEO dashboard. I need to know what jobs are worth chasing right now.',
    name: 'Sample plumbing contractor reaction',
    market: 'Florida service market'
  },
  {
    quote: 'The campaign pack is the part that makes sense. It gives my team something they can actually launch.',
    name: 'Sample roofing company reaction',
    market: 'Storm-response market'
  }
];

const signalSources = [
  { name: 'Weather Forecast', status: 'Live', icon: CloudSun, detail: 'Heat, cold, wind, and rain signals that can trigger urgent demand.' },
  { name: 'NWS Alerts', status: 'Live', icon: ShieldCheck, detail: 'Storm, wind, flood, freeze, heat, and severe weather alerts.' },
  { name: 'Search Intent', status: 'Estimated', icon: Search, detail: 'Commercial demand estimate for high-intent service searches.' },
  { name: 'Permits', status: 'Configurable', icon: FileSearch, detail: 'Ready for city and county public permit feeds market by market.' },
  { name: 'Business Openings', status: 'Configurable', icon: Building2, detail: 'Designed for new-business and local activity opportunity signals.' },
  { name: 'Public Bids', status: 'Configurable', icon: Megaphone, detail: 'Supports public bid and government opportunity feeds when connected.' }
];

const trustedSegments = ['HVAC', 'Roofing', 'Plumbing', 'Electrical', 'Pest Control', 'Garage Door'];

export function ProductShowcaseSection() {
  const [active, setActive] = useState(0);
  const slide = showcaseSlides[active];

  return (
    <section className="section white showcase-section">
      <div className="container">
        <div className="section-head centered compact-head">
          <div className="label">Product showcase</div>
          <h2>Less reading. More product proof.</h2>
          <p>Show contractors the radar, the signal source, and the campaign output before asking them to book a scan.</p>
        </div>

        <div className="showcase-shell">
          <div className="showcase-tabs" role="tablist" aria-label="JobLeak product screens">
            {showcaseSlides.map((item, index) => (
              <button key={item.id} className={index === active ? 'active' : ''} onClick={() => setActive(index)} type="button">
                {item.eyebrow}
              </button>
            ))}
          </div>

          <div className="showcase-grid">
            <div className="showcase-copy">
              <span className="label">{slide.eyebrow}</span>
              <h3>{slide.title}</h3>
              <p>{slide.text}</p>
              <div className="showcase-list">
                {slide.bullets.map((bullet) => <span key={bullet}><Check size={16} /> {bullet}</span>)}
              </div>
            </div>
            <ShowcaseVisual slideId={slide.id} />
          </div>
        </div>
      </div>
    </section>
  );
}

function ShowcaseVisual({ slideId }: { slideId: string }) {
  return (
    <div className="showcase-visual">
      <div className="showcase-window">
        <div className="showcase-window-top"><span /><span /><span /><strong>JobLeak command center</strong></div>
        {slideId === 'radar' && <div className="mock-screen">
          <div className="mock-kpi-row"><div className="mock-kpi"><small>Best opportunity</small><strong>87 / 100</strong></div><div className="mock-kpi"><small>Recommended launch</small><strong>Google Search</strong></div></div>
          <div className="mock-card priority"><strong>Emergency AC Repair Spike</strong><p>Phoenix, AZ · live heat signal · same-day repair campaign</p></div>
          <div className="mock-card"><strong>Past Customer Tune-Up Reactivation</strong><p>Seasonal maintenance window · email + opted-in SMS ready</p></div>
        </div>}
        {slideId === 'campaigns' && <div className="mock-screen">
          <div className="mock-card priority"><strong>Campaign: Phoenix Emergency AC Repair</strong><p>Objective: convert heat-driven demand into booked repair calls.</p></div>
          <div className="mock-card"><strong>Google headline</strong><p>Same-Day AC Repair in Phoenix</p></div>
          <div className="mock-card"><strong>Call script</strong><p>Ask city, urgency, issue, best callback, and scheduling window.</p></div>
        </div>}
        {slideId === 'signals' && <div className="mock-screen">
          {signalSources.slice(0, 4).map((source) => <div className="mock-signal-row" key={source.name}><div><strong>{source.name}</strong><p>{source.detail}</p></div><span className={`source-pill ${source.status.toLowerCase()}`}>{source.status}</span></div>)}
        </div>}
        {slideId === 'inbox' && <div className="mock-screen">
          <div className="mock-card priority"><strong>New scan request</strong><p>Phoenix Comfort Pros · HVAC · AC Repair</p></div>
          <div className="mock-card"><strong>Status</strong><p>New → Contacted → Booked Call → Customer</p></div>
          <div className="mock-card"><strong>Next action</strong><p>Send free opportunity scan and campaign preview.</p></div>
        </div>}
      </div>
    </div>
  );
}

export function SignalSourcesSection() {
  return (
    <section className="section muted">
      <div className="container">
        <div className="section-head centered compact-head">
          <div className="label">Signal sources</div>
          <h2>Built on visible local opportunity signals.</h2>
          <p>JobLeak shows what is live, what is estimated, and what can be connected next.</p>
        </div>
        <div className="signal-source-grid">
          {signalSources.map(({ name, status, detail, icon: Icon }) => <div className="signal-source-card" key={name}>
            <div className="signal-source-top"><Icon size={22} /><span className={`source-pill ${status.toLowerCase()}`}>{status}</span></div>
            <strong>{name}</strong>
            <p>{detail}</p>
          </div>)}
        </div>
      </div>
    </section>
  );
}

export function SocialProofSection() {
  return (
    <section className="section white proof-section">
      <div className="container">
        <div className="trusted-strip">
          <span>Built for home-service operators in</span>
          <div>{trustedSegments.map((segment) => <strong key={segment}>{segment}</strong>)}</div>
        </div>
        <div className="section-head centered compact-head">
          <div className="label">Example contractor reactions</div>
          <h2>Positioned around action, not another dashboard.</h2>
          <p>Use these as sample reaction cards until real beta feedback comes in.</p>
        </div>
        <div className="testimonial-grid">
          {sampleReactions.map((item) => <article className="testimonial-card" key={item.quote}>
            <div className="testimonial-stars">★★★★★</div>
            <p className="testimonial-quote">“{item.quote}”</p>
            <div className="testimonial-meta"><strong>{item.name}</strong><span>{item.market}</span></div>
          </article>)}
        </div>
      </div>
    </section>
  );
}

export function TrustShowcaseBundle() {
  return <><ProductShowcaseSection /><SignalSourcesSection /><SocialProofSection /></>;
}
