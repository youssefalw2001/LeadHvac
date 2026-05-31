import {
  ArrowRight,
  BarChart3,
  Check,
  ChevronRight,
  Clock,
  Flame,
  Home,
  LineChart,
  LockKeyhole,
  MapPin,
  MessageSquare,
  Phone,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Wrench
} from 'lucide-react';
import Link from 'next/link';
import { BrandLogo } from '@/components/brand-logo';

const features = [
  { icon: Target, title: 'Missed Job Scan', text: 'Turn local SEO into plain-English job opportunities owners understand.' },
  { icon: BarChart3, title: 'Competitor Intelligence', text: 'Compare reviews, pages, calls-to-action, and local visibility against nearby companies.' },
  { icon: Star, title: 'Review Gap Engine', text: 'Show the exact review gap between the business and the local leaders.' },
  { icon: MessageSquare, title: 'Lead Capture Widget', text: 'Capture quote requests, emergency calls, photo uploads, and callbacks from the website.' },
  { icon: MapPin, title: 'Service Area Ideas', text: 'Generate city and service page opportunities based on what competitors already rank for.' },
  { icon: LineChart, title: 'Monthly Owner Report', text: 'A sharp report showing what changed, what to fix, and what jobs are still leaking.' }
];

const industries = [
  { icon: Home, title: 'Roofing', image: 'Roof leak repair', points: ['Storm damage pages', 'Emergency repair searches', 'Review gap tracking'], bg: 'from-sky-500 to-blue-700' },
  { icon: Flame, title: 'HVAC', image: 'AC repair demand', points: ['Seasonal demand gaps', 'Emergency service pages', 'Maintenance lead capture'], bg: 'from-orange-500 to-rose-600' },
  { icon: Wrench, title: 'Plumbing', image: 'Fast-call leads', points: ['Water heater searches', 'Leak and drain demand', 'Callback conversion'], bg: 'from-emerald-500 to-teal-700' }
];

const pricing = [
  { name: 'Starter', price: '$99', desc: 'For one local business that wants a clear monthly scan.', features: ['1 location', 'Monthly Job Leak Scan', 'Review Gap Analysis', 'Owner Action Plan', 'Email support'], highlighted: false },
  { name: 'Growth', price: '$199', desc: 'For owners ready to track competitors and capture more leads.', features: ['Up to 3 locations', 'Everything in Starter', 'Competitor Tracker', 'Lead Capture Widget', 'Priority support'], highlighted: true },
  { name: 'Pro', price: '$299', desc: 'For teams that want deeper insights and faster implementation.', features: ['Up to 10 locations', 'Everything in Growth', 'Advanced insights', 'Local page ideas', 'Phone support'], highlighted: false }
];

function OverviewPreview() {
  const competitorScores = [84, 72, 58];
  return (
    <div className="relative">
      <div className="absolute -inset-4 rounded-[2.5rem] bg-gradient-to-tr from-blue-200/40 via-emerald-100/30 to-transparent blur-2xl" />
      <div className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-white shadow-soft">
        <div className="border-b border-slate-100 bg-ink px-6 py-5 text-white">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-sm font-bold text-white/60">Live Market Overview</div>
              <div className="text-2xl font-black tracking-tight">Austin Pro Roofing</div>
            </div>
            <div className="rounded-full bg-white/10 px-4 py-2 text-xs font-black text-emerald">12 job leaks found</div>
          </div>
        </div>

        <div className="grid lg:grid-cols-[220px_1fr]">
          <aside className="hidden border-r border-slate-100 bg-slate-50 p-5 lg:block">
            {['Overview', 'Lost Jobs', 'Competitors', 'Reviews', 'Website Fixes', 'Lead Widget'].map((item, index) => (
              <div key={item} className={`mb-2 rounded-2xl px-4 py-3 text-sm font-black ${index === 0 ? 'bg-brand text-white shadow-card' : 'text-slate-500'}`}>{item}</div>
            ))}
            <div className="mt-8 rounded-3xl bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted"><MapPin className="h-4 w-4 text-brand" /> Market</div>
              <div className="mt-2 text-lg font-black text-ink">Austin, TX</div>
              <div className="mt-1 text-xs font-bold text-muted">Roofing service area</div>
            </div>
          </aside>

          <main className="p-5 md:p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xl font-black text-ink">Growth Overview</div>
                <div className="text-sm font-semibold text-muted">Missed searches, review gaps, and action items in one owner-friendly view.</div>
              </div>
              <div className="rounded-full border border-slate-200 px-4 py-2 text-xs font-black text-muted">Updated today</div>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              <StatCard label="Visibility" value="68" suffix="/100" tone="blue" />
              <StatCard label="Missed Searches" value="12" suffix="" tone="rose" />
              <StatCard label="Review Gap" value="148" suffix="" tone="amber" />
              <StatCard label="Captured Leads" value="17" suffix="" tone="green" />
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-black text-ink">Top leaking searches</div>
                    <div className="text-xs font-bold text-muted">High-value jobs competitors are capturing</div>
                  </div>
                  <Search className="h-5 w-5 text-brand" />
                </div>
                {[
                  ['emergency roof repair Austin', 'High', 'No dedicated page'],
                  ['storm damage roof repair', 'High', 'Competitor page wins'],
                  ['roof leak repair near me', 'Med', 'Review gap hurts trust']
                ].map(([keyword, priority, reason]) => (
                  <div key={keyword} className="mb-3 grid gap-2 rounded-2xl bg-slate-50 p-4 text-sm md:grid-cols-[1fr_auto]">
                    <div>
                      <div className="font-black text-ink">{keyword}</div>
                      <div className="text-xs font-bold text-muted">{reason}</div>
                    </div>
                    <div className="rounded-full bg-white px-3 py-1 text-xs font-black text-brand">{priority}</div>
                  </div>
                ))}
              </div>

              <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
                <div className="text-sm font-black text-ink">Competitor scorecard</div>
                <div className="mt-4 space-y-4">
                  {['Rapid Roofing', 'Atlas Exteriors', 'CityTop Roofing'].map((name, i) => (
                    <div key={name}>
                      <div className="mb-2 flex justify-between text-xs font-black text-muted"><span>{name}</span><span>{competitorScores[i]}/100</span></div>
                      <div className="h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-brand" style={{ width: `${competitorScores[i]}%` }} /></div>
                    </div>
                  ))}
                </div>
                <div className="mt-5 rounded-2xl bg-emerald/10 p-4 text-sm font-bold text-emerald">Recommended: add emergency page + request 20 reviews this month.</div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, suffix, tone }: { label: string; value: string; suffix: string; tone: 'blue' | 'rose' | 'amber' | 'green' }) {
  const tones = {
    blue: 'bg-blue-50 text-brand',
    rose: 'bg-rose-50 text-rose-600',
    amber: 'bg-amber-50 text-amber-600',
    green: 'bg-emerald-50 text-emerald'
  };
  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="text-xs font-black uppercase tracking-widest text-muted">{label}</div>
      <div className={`mt-3 inline-flex rounded-2xl px-3 py-2 text-3xl font-black ${tones[tone]}`}>{value}<span className="text-sm">{suffix}</span></div>
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden">
      <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <BrandLogo />
          <nav className="hidden items-center gap-7 text-sm font-bold text-ink lg:flex">
            <a href="#platform">Platform</a>
            <a href="#features">Features</a>
            <a href="#industries">Industries</a>
            <a href="#pricing">Pricing</a>
            <Link href="/login" className="inline-flex items-center gap-2 text-muted"><LockKeyhole className="h-4 w-4" /> Login</Link>
          </nav>
          <a href="#scan" className="rounded-2xl bg-brand px-5 py-3 text-sm font-black text-white shadow-card transition hover:bg-brandDark">Get Free Scan</a>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl items-center gap-12 px-6 pb-20 pt-14 lg:grid-cols-[0.88fr_1.12fr]">
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-black text-brand"><ShieldCheck className="h-4 w-4" /> Built for roofing, HVAC, plumbing, and home services</div>
          <h1 className="max-w-3xl text-5xl font-black leading-[0.95] tracking-[-0.06em] text-ink md:text-7xl">Stop leaking local jobs to your <span className="text-brand underline decoration-brand/25 decoration-[10px] underline-offset-[-4px]">competitors.</span></h1>
          <p className="mt-7 max-w-2xl text-lg font-medium leading-8 text-muted">JobLeak shows owners the searches, reviews, pages, and competitor moves costing them calls — then turns the fixes into a simple action plan.</p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <a href="#scan" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand px-6 py-4 font-black text-white shadow-card transition hover:bg-brandDark">Get Free Job Leak Scan <ArrowRight className="h-5 w-5" /></a>
            <Link href="/sample-report" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-blue-200 bg-white px-6 py-4 font-black text-brand shadow-sm transition hover:border-brand">See Sample Report</Link>
          </div>
          <div className="mt-7 grid max-w-xl grid-cols-3 gap-3">
            {['No setup fees', 'Fast first report', 'Cancel anytime'].map((item) => <div key={item} className="rounded-2xl border border-slate-100 bg-white p-3 text-center text-xs font-black text-muted shadow-sm"><Check className="mx-auto mb-1 h-4 w-4 text-emerald" />{item}</div>)}
          </div>
        </div>
        <OverviewPreview />
      </section>

      <section className="border-y border-slate-100 bg-white py-7">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-6 text-center md:grid-cols-4">
          {[
            ['12+', 'missed searches surfaced'],
            ['148', 'review gap example'],
            ['17', 'captured leads shown'],
            ['$199', 'core growth plan']
          ].map(([value, label]) => <div key={label}><div className="text-3xl font-black text-ink">{value}</div><div className="text-xs font-black uppercase tracking-widest text-muted">{label}</div></div>)}
        </div>
      </section>

      <section id="platform" className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <div className="mb-4 text-sm font-black uppercase tracking-[0.25em] text-brand">Platform Overview</div>
            <h2 className="text-4xl font-black tracking-tight text-ink md:text-5xl">A growth command center, not another SEO dashboard.</h2>
            <p className="mt-5 text-lg font-medium leading-8 text-muted">Owners do not want 300 metrics. They want to know where jobs are leaking, who is taking them, and what to fix first. JobLeak packages local search, reviews, competitor checks, and lead capture into one owner-ready report.</p>
            <div className="mt-8 space-y-4">
              {['Find the lost job searches', 'Explain the competitor advantage', 'Create the 30-day action plan', 'Capture the website visitors that arrive'].map((item) => <div key={item} className="flex items-center gap-3 rounded-2xl bg-white p-4 font-black text-ink shadow-sm"><Check className="h-5 w-5 rounded-full bg-emerald p-1 text-white" />{item}</div>)}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {['Google Profile Check', 'Review Gap Report', 'Competitor Pages', 'Lead Widget', 'Service Area Ideas', 'Monthly Owner PDF'].map((tool, i) => (
              <div key={tool} className="rounded-3xl border border-slate-100 bg-white p-6 shadow-card">
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-brand"><Sparkles className="h-6 w-6" /></div>
                <div className="text-lg font-black text-ink">{tool}</div>
                <div className="mt-2 text-sm font-medium leading-6 text-muted">{i % 2 === 0 ? 'Scans market gaps and turns them into clear next steps.' : 'Helps convert attention into calls, quote requests, and reviews.'}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="bg-slate-50 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center"><h2 className="text-4xl font-black tracking-tight text-ink">Everything owners need to stop losing jobs</h2><p className="mt-4 text-lg font-medium text-muted">Simple, visual, and built for sales conversations.</p></div>
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{features.map((feature) => <div key={feature.title} className="rounded-3xl border border-slate-100 bg-white p-7 shadow-card"><feature.icon className="h-8 w-8 text-brand" /><h3 className="mt-5 text-xl font-black text-ink">{feature.title}</h3><p className="mt-3 font-medium leading-7 text-muted">{feature.text}</p></div>)}</div>
        </div>
      </section>

      <section id="industries" className="mx-auto max-w-7xl px-6 py-20">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><div className="text-sm font-black uppercase tracking-[0.25em] text-brand">Vertical-ready</div><h2 className="mt-2 text-4xl font-black tracking-tight text-ink">Looks built for their trade.</h2></div><p className="max-w-xl font-medium leading-7 text-muted">The same engine can be packaged as Roofing Growth Radar, HVAC Growth Radar, Plumbing Growth Radar, and more.</p></div>
        <div className="mt-10 grid gap-6 md:grid-cols-3">{industries.map((industry) => <div key={industry.title} className="overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-card"><div className={`h-44 bg-gradient-to-br ${industry.bg} p-6 text-white`}><industry.icon className="h-10 w-10" /><div className="mt-16 text-sm font-black uppercase tracking-widest text-white/70">{industry.image}</div></div><div className="p-7"><h3 className="text-2xl font-black text-ink">{industry.title}</h3><ul className="mt-4 space-y-3 text-sm font-bold text-muted">{industry.points.map((point) => <li key={point} className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald" />{point}</li>)}</ul></div></div>)}</div>
      </section>

      <section id="scan" className="bg-ink py-20 text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div><div className="mb-4 text-sm font-black uppercase tracking-[0.25em] text-emerald">Free scan</div><h2 className="text-4xl font-black tracking-tight md:text-5xl">Give prospects a report they actually want to read.</h2><p className="mt-5 text-lg font-medium leading-8 text-white/70">Collect the business name, market, service type, and growth goal. Use the report as the sales hook for $199/month Growth Radar.</p><div className="mt-8 rounded-3xl bg-white/10 p-6"><div className="flex items-center gap-3 text-xl font-black"><Clock className="h-6 w-6 text-emerald" /> First version captures intent</div><p className="mt-3 text-white/60">Backend capture comes next: Supabase, email notifications, and admin review queue.</p></div></div>
          <form className="rounded-[2rem] bg-white p-7 text-ink shadow-soft"><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-black">Business name<input className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand" placeholder="Austin Pro Roofing" /></label><label className="text-sm font-black">Industry<select className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand"><option>Roofing</option><option>HVAC</option><option>Plumbing</option><option>Other home service</option></select></label><label className="text-sm font-black">City / market<input className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand" placeholder="Austin, TX" /></label><label className="text-sm font-black">Website<input className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand" placeholder="https://example.com" /></label><label className="text-sm font-black">Email<input className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand" placeholder="owner@example.com" /></label><label className="text-sm font-black">Phone<input className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand" placeholder="(555) 123-4567" /></label></div><label className="mt-4 block text-sm font-black">What do you want more of?<textarea className="mt-2 h-24 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand" placeholder="More emergency calls, reviews, quote requests..." /></label><button type="button" className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-brand px-6 py-4 font-black text-white shadow-card transition hover:bg-brandDark">Generate Free Scan <TrendingUp className="h-5 w-5" /></button><p className="mt-3 text-center text-xs font-bold text-muted">Demo form. Backend lead capture is next.</p></form>
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-7xl px-6 py-20"><h2 className="text-center text-4xl font-black tracking-tight text-ink">Simple pricing built around ROI</h2><div className="mt-10 grid gap-6 lg:grid-cols-3">{pricing.map((plan) => <div key={plan.name} className={`relative rounded-[2rem] border p-8 shadow-card ${plan.highlighted ? 'border-brand bg-white ring-4 ring-blue-50' : 'border-slate-100 bg-white'}`}>{plan.highlighted ? <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-brand px-4 py-2 text-xs font-black uppercase tracking-widest text-white">Most Popular</div> : null}<h3 className="text-2xl font-black text-ink">{plan.name}</h3><p className="mt-3 min-h-12 font-medium text-muted">{plan.desc}</p><div className="mt-6"><span className="text-5xl font-black text-ink">{plan.price}</span><span className="font-bold text-muted">/mo</span></div><ul className="mt-6 space-y-3">{plan.features.map((item) => <li key={item} className="flex items-center gap-2 text-sm font-bold text-muted"><Check className="h-4 w-4 text-brand" />{item}</li>)}</ul><a href="#scan" className={`mt-8 flex justify-center rounded-2xl px-5 py-3 font-black ${plan.highlighted ? 'bg-brand text-white' : 'border border-blue-200 text-brand'}`}>Start Free Scan</a></div>)}</div></section>

      <section className="mx-auto mb-14 max-w-7xl px-6"><div className="noise overflow-hidden rounded-[2rem] bg-ink p-8 text-white shadow-soft md:p-12"><div className="grid items-center gap-6 md:grid-cols-[1fr_auto]"><div><h2 className="text-3xl font-black tracking-tight md:text-4xl">Stop losing jobs. Start winning more.</h2><p className="mt-3 max-w-2xl text-white/70">Get the scan, show the leaks, and turn the report into your first customer conversation.</p></div><a href="#scan" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald px-6 py-4 font-black text-white shadow-card">Get Free Growth Scan <ChevronRight className="h-5 w-5" /></a></div></div></section>

      <footer className="border-t border-slate-100 bg-white py-10"><div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 md:flex-row md:items-center md:justify-between"><BrandLogo /><div className="flex flex-wrap gap-5 text-sm font-bold text-muted"><Link href="/login">Client Login</Link><Link href="/sample-report">Sample Report</Link><a href="#pricing">Pricing</a><a href="#scan">Free Scan</a></div><div className="text-sm font-bold text-muted">© 2026 JobLeak. Built for home-service growth.</div></div></footer>
    </main>
  );
}
