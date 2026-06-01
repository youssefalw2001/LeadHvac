import { FormEvent, useState } from 'react';
import { ArrowRight, Building2, Check, ChevronRight, CloudSun, FileSearch, Gauge, Hammer, MapPin, Megaphone, Search, ShieldCheck, Sparkles, Wrench, Zap } from 'lucide-react';
import { saveLead } from './leadCapture';
import { JobLeakMark } from './components/brand/JobLeakMark';
import { FloatingInsightCard } from './components/brand/FloatingInsightCard';
import { IndustryVisualCard } from './components/brand/IndustryVisualCard';
import { Badge } from './components/ui/Badge';
import { Card } from './components/ui/Card';

type Industry = 'hvac' | 'roofing' | 'plumbing' | 'electrical' | 'pest' | 'garage';

const industries: Array<{ key: Industry; title: string; description: string; metric: string; icon: JSX.Element }> = [
  { key: 'hvac', title: 'HVAC', description: 'Emergency AC repair, tune-ups, and heat-driven demand signals.', metric: 'Emergency AC Repair Spike', icon: <CloudSun size={24} /> },
  { key: 'roofing', title: 'Roofing', description: 'Storm inspections, leak repair, and high-urgency weather windows.', metric: 'Storm Damage Inspection', icon: <ShieldCheck size={24} /> },
  { key: 'plumbing', title: 'Plumbing', description: 'Drain cleaning, water heaters, leaks, and urgent repair demand.', metric: 'Same-Day Plumbing Calls', icon: <Wrench size={24} /> },
  { key: 'electrical', title: 'Electrical', description: 'Panel upgrades, emergency calls, EV chargers, and local intent.', metric: 'Panel Upgrade Demand', icon: <Zap size={24} /> },
  { key: 'pest', title: 'Pest Control', description: 'Seasonal treatments, inspections, humidity, and fast response windows.', metric: 'Pest Activity Spike', icon: <BugIcon /> },
  { key: 'garage', title: 'Garage Door', description: 'Springs, openers, stuck doors, and same-day repair opportunities.', metric: 'Broken Spring Demand', icon: <Hammer size={24} /> }
];

const signalSources = [
  ['Weather Forecast', 'Live', 'Heat, cold, wind, and rain demand triggers.'],
  ['NWS Alerts', 'Live', 'Storm, wind, flood, freeze, and severe weather alerts.'],
  ['Search Intent', 'Estimated', 'Commercial service demand layer for local searches.'],
  ['Permits', 'Configurable', 'City/county public permit feeds market by market.'],
  ['Business Openings', 'Configurable', 'Local business activity and new-location signals.'],
  ['Public Bids', 'Configurable', 'Public contract and bid opportunities when connected.']
];

const defaultForm = {
  businessName: '',
  industry: 'hvac' as Industry,
  city: '',
  service: '',
  website: '',
  email: '',
  phone: '',
  goal: ''
};

function routeTo(hash: string) {
  window.location.hash = hash;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

export function PremiumHome() {
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);

  async function submitScan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      await saveLead({
        businessName: form.businessName || 'Unknown business',
        industry: form.industry,
        city: form.city || 'Unknown market',
        website: form.website,
        email: form.email,
        phone: form.phone,
        goal: form.goal || form.service
      });
    } catch (error) {
      console.error('Lead capture failed', error);
    } finally {
      setSaving(false);
      routeTo('radar');
    }
  }

  return (
    <main className="min-h-screen overflow-hidden bg-jobleak-paper font-sans text-jobleak-ink">
      <PremiumNav />
      <section className="relative px-4 pb-16 pt-12 sm:px-6 lg:px-8 lg:pb-24 lg:pt-20">
        <div className="absolute inset-x-4 top-4 -z-0 h-[88%] rounded-[2rem] border border-white/80 bg-white/70 shadow-premium backdrop-blur sm:inset-x-8 lg:rounded-[2.5rem]" />
        <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:gap-14">
          <div>
            <Badge tone="blue" className="mb-5">AI opportunity radar for home services</Badge>
            <h1 className="max-w-4xl text-[3.1rem] font-black leading-[0.94] tracking-[-0.075em] text-jobleak-ink sm:text-6xl lg:text-8xl">
              Find local jobs before your competitors do.
            </h1>
            <p className="mt-6 max-w-2xl text-base font-semibold leading-8 text-jobleak-muted sm:text-lg">
              JobLeak turns weather alerts, search intent, public opportunity signals, and service demand into a clear campaign your team can launch this week.
            </p>
            <div className="mt-8 grid gap-3 sm:flex">
              <button className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-jobleak-ink px-6 font-black text-white shadow-premium transition hover:bg-jobleak-panel" onClick={() => routeTo('radar')}>
                Run free opportunity scan <ArrowRight size={18} />
              </button>
              <button className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl border border-jobleak-border bg-white px-6 font-black text-jobleak-ink shadow-premium transition hover:border-slate-300" onClick={() => routeTo('campaign')}>
                View campaign generator
              </button>
            </div>
            <div className="mt-8 grid gap-2 sm:flex sm:flex-wrap">
              {['Detect', 'Prioritize', 'Win'].map((item) => <span key={item} className="inline-flex items-center gap-2 rounded-full border border-jobleak-border bg-white px-4 py-2 text-sm font-extrabold text-slate-600 shadow-sm"><Check size={15} className="text-emerald-600" /> {item}</span>)}
            </div>
          </div>
          <HeroRadarVisual />
        </div>
      </section>

      <section className="bg-jobleak-ink px-4 py-7 text-white sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-4 sm:grid-cols-4">
          {[['Live', 'weather + NWS alerts'], ['3', 'ranked opportunities'], ['1 click', 'campaign pack'], ['6', 'home-service industries']].map(([value, label]) => <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-5"><strong className="block text-3xl font-black tracking-[-0.05em]">{value}</strong><span className="text-sm font-bold text-white/55">{label}</span></div>)}
        </div>
      </section>

      <section id="industries" className="px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 grid gap-4 lg:grid-cols-[0.8fr_1fr] lg:items-end">
            <div>
              <Badge tone="orange">Industry radar gallery</Badge>
              <h2 className="mt-4 text-4xl font-black tracking-[-0.06em] sm:text-5xl">A custom opportunity radar for every trade.</h2>
            </div>
            <p className="max-w-2xl text-base font-semibold leading-8 text-jobleak-muted lg:justify-self-end">Each industry gets a focused demand lens: urgent services, local triggers, suggested offers, and the campaign channel most likely to convert.</p>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {industries.map((industry) => <IndustryVisualCard key={industry.key} title={industry.title} description={industry.description} metric={industry.metric} icon={industry.icon} onClick={() => routeTo('radar')} />)}
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto mb-10 max-w-3xl text-center">
            <Badge tone="blue">Signal sources</Badge>
            <h2 className="mt-4 text-4xl font-black tracking-[-0.06em] sm:text-5xl">The app shows where the opportunity came from.</h2>
            <p className="mt-4 font-semibold leading-8 text-jobleak-muted">No magic black box. JobLeak separates what is live today from what can be connected next as you expand markets.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {signalSources.map(([name, status, detail]) => <Card key={name} className="p-6"><div className="mb-5 flex items-center justify-between"><span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-jobleak-blue"><FileSearch size={21} /></span><Badge tone={status === 'Live' ? 'green' : 'blue'}>{status}</Badge></div><strong className="block text-xl font-black tracking-[-0.04em] text-jobleak-ink">{name}</strong><p className="mt-2 text-sm font-semibold leading-6 text-jobleak-muted">{detail}</p></Card>)}
          </div>
        </div>
      </section>

      <section id="scan" className="px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <Badge tone="green">Free scan</Badge>
            <h2 className="mt-4 text-4xl font-black tracking-[-0.06em] sm:text-5xl">Get the first opportunity scan started.</h2>
            <p className="mt-4 max-w-xl font-semibold leading-8 text-jobleak-muted">Submit the market and service you care about. JobLeak saves the request, opens the radar, and gives you a launchable campaign direction.</p>
            <div className="mt-6 rounded-3xl border border-jobleak-border bg-white p-5 shadow-premium"><div className="flex items-start gap-3"><ShieldCheck className="mt-1 text-emerald-600" /><p className="m-0 text-sm font-bold leading-6 text-slate-600">Safe positioning: public signals, opt-in customer lists, campaign guidance. No private homeowner scraping or spam tools.</p></div></div>
          </div>
          <form onSubmit={submitScan} className="scan-card grid gap-4 rounded-[2rem] border border-jobleak-border bg-white p-5 shadow-executive sm:grid-cols-2 sm:p-7">
            <Field label="Business name" value={form.businessName} onChange={(value) => setForm({ ...form, businessName: value })} placeholder="Phoenix Comfort Pros" />
            <label className="grid gap-2 text-xs font-black uppercase tracking-[0.12em] text-slate-500">Industry<select className="h-12 rounded-xl border border-jobleak-border bg-white px-4 text-base font-bold normal-case tracking-normal text-jobleak-ink" value={form.industry} onChange={(event) => setForm({ ...form, industry: event.target.value as Industry })}>{industries.map((item) => <option key={item.key} value={item.key}>{item.title}</option>)}</select></label>
            <Field label="City / market" value={form.city} onChange={(value) => setForm({ ...form, city: value })} placeholder="Phoenix, AZ" />
            <Field label="Service" value={form.service} onChange={(value) => setForm({ ...form, service: value })} placeholder="AC Repair" />
            <Field label="Website" value={form.website} onChange={(value) => setForm({ ...form, website: value })} placeholder="company.com" />
            <Field label="Email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} placeholder="owner@company.com" />
            <Field label="Phone" value={form.phone} onChange={(value) => setForm({ ...form, phone: value })} placeholder="(602) 555-0199" />
            <label className="grid gap-2 text-xs font-black uppercase tracking-[0.12em] text-slate-500 sm:col-span-2">Goal<textarea className="min-h-[104px] rounded-xl border border-jobleak-border bg-white px-4 py-3 text-base font-bold normal-case tracking-normal text-jobleak-ink" value={form.goal} onChange={(event) => setForm({ ...form, goal: event.target.value })} placeholder="More emergency AC calls this week" /></label>
            <button disabled={saving} className="sm:col-span-2 inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-jobleak-ink px-6 font-black text-white shadow-premium transition hover:bg-jobleak-panel disabled:opacity-60">
              {saving ? 'Saving scan...' : 'Generate Free Scan'} <ChevronRight size={18} />
            </button>
          </form>
        </div>
      </section>

      <footer className="border-t border-jobleak-border bg-white px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <JobLeakMark />
          <div className="flex flex-wrap gap-3 text-sm font-extrabold text-slate-500"><button onClick={() => routeTo('radar')}>Opportunity Radar</button><button onClick={() => routeTo('campaign')}>Campaign Generator</button><button onClick={() => { window.location.hash = 'admin'; }}>Admin Inbox</button></div>
        </div>
      </footer>
    </main>
  );
}

function PremiumNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-jobleak-border/80 bg-white/85 px-4 py-3 backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <JobLeakMark />
        <nav className="hidden items-center gap-6 text-sm font-extrabold text-slate-600 md:flex"><button onClick={() => routeTo('radar')}>Radar</button><button onClick={() => routeTo('campaign')}>Campaigns</button><a href="#industries">Industries</a><a href="#scan">Free Scan</a><button onClick={() => { window.location.hash = 'admin'; }}>Admin</button></nav>
        <button className="rounded-xl bg-jobleak-ink px-4 py-3 text-sm font-black text-white shadow-premium" onClick={() => routeTo('radar')}>Run Scan</button>
      </div>
    </header>
  );
}

function HeroRadarVisual() {
  return (
    <div className="relative mx-auto w-full max-w-2xl rounded-[2rem] bg-gradient-to-b from-jobleak-panel to-jobleak-ink p-4 shadow-executive">
      <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-jobleak-blue/30 blur-3xl" />
      <div className="absolute -bottom-10 left-8 h-36 w-36 rounded-full bg-jobleak-orange/20 blur-3xl" />
      <div className="relative rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
        <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-4"><span className="text-xs font-black uppercase tracking-[0.16em] text-white/50">Live JobLeak radar</span><span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-black text-emerald-300">2 live sources</span></div>
        <div className="grid gap-4">
          <div className="rounded-3xl bg-white p-5 shadow-premium"><div className="flex items-start justify-between gap-4"><div><Badge tone="green">High confidence</Badge><h3 className="mt-3 text-2xl font-black tracking-[-0.05em] text-jobleak-ink">Emergency AC Repair Spike</h3><p className="mt-2 text-sm font-semibold leading-6 text-slate-600">Phoenix, AZ · heat signal · same-day repair campaign</p></div><div className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-2xl bg-jobleak-ink text-white"><strong className="text-3xl font-black">87</strong><span className="text-xs text-white/55">/100</span></div></div></div>
          <div className="grid gap-3 sm:grid-cols-3"><FloatingInsightCard label="High intent" value="2.6x" detail="AC repair searches" icon={<Search size={14} />} /><FloatingInsightCard label="Demand surge" value="+42%" detail="vs last 7 days" icon={<Gauge size={14} />} /><FloatingInsightCard label="Action" value="Launch" detail="Google Search" icon={<Megaphone size={14} />} /></div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder: string }) {
  return <label className="grid gap-2 text-xs font-black uppercase tracking-[0.12em] text-slate-500">{label}<input className="h-12 rounded-xl border border-jobleak-border bg-white px-4 text-base font-bold normal-case tracking-normal text-jobleak-ink" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} /></label>;
}

function BugIcon() {
  return <span className="text-xl font-black">PC</span>;
}
