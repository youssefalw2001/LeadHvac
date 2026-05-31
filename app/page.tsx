import {
  ArrowRight,
  BarChart3,
  Check,
  Clock,
  Flame,
  Home,
  MapPin,
  Phone,
  Search,
  ShieldCheck,
  Star,
  Target,
  TrendingUp,
  Wrench
} from 'lucide-react';
import { BrandLogo } from '@/components/brand-logo';

const features = [
  {
    icon: Target,
    title: 'Missed Revenue Scan',
    text: 'Find high-intent local searches your competitors are winning first.'
  },
  {
    icon: BarChart3,
    title: 'Competitor Tracker',
    text: 'See who outranks you, why they show up, and what to fix.'
  },
  {
    icon: Star,
    title: 'Review Booster',
    text: 'Measure your review gap and get a simple plan to close it.'
  },
  {
    icon: Phone,
    title: 'Lead Capture Widget',
    text: 'Turn website visitors into calls, quote requests, and booked jobs.'
  },
  {
    icon: MapPin,
    title: 'Local Page Ideas',
    text: 'Get city and service page ideas that can attract more local demand.'
  },
  {
    icon: Check,
    title: 'Monthly Action Plan',
    text: 'A plain-English checklist so owners know what to do next.'
  }
];

const industries = [
  {
    icon: Home,
    title: 'Roofing',
    points: ['Roof leak searches', 'Storm damage gaps', 'Review gap tracking'],
    bg: 'from-blue-50 to-white'
  },
  {
    icon: Flame,
    title: 'HVAC',
    points: ['AC repair demand', 'Seasonal keyword gaps', 'Emergency service pages'],
    bg: 'from-orange-50 to-white'
  },
  {
    icon: Wrench,
    title: 'Plumbing',
    points: ['Leak and drain searches', 'Water heater gaps', 'Fast-call conversion'],
    bg: 'from-emerald-50 to-white'
  }
];

const pricing = [
  {
    name: 'Starter',
    price: '$99',
    desc: 'For one local business that wants a clear monthly scan.',
    features: ['1 location', 'Monthly Revenue Scan', 'Review Gap Analysis', 'Action Plan', 'Email support'],
    highlighted: false
  },
  {
    name: 'Growth',
    price: '$199',
    desc: 'For owners ready to track competitors and capture more leads.',
    features: ['Up to 3 locations', 'Everything in Starter', 'Competitor Tracker', 'Lead Capture Widget', 'Priority support'],
    highlighted: true
  },
  {
    name: 'Pro',
    price: '$299',
    desc: 'For teams that want deeper insights and faster implementation.',
    features: ['Up to 10 locations', 'Everything in Growth', 'Advanced competitor insights', 'Local page ideas', 'Phone support'],
    highlighted: false
  }
];

function DashboardPreview() {
  return (
    <div className="gradient-border rounded-[2rem] p-3 shadow-soft">
      <div className="overflow-hidden rounded-[1.5rem] bg-white">
        <div className="grid grid-cols-[150px_1fr]">
          <aside className="hidden border-r border-slate-100 bg-slate-50/70 p-5 sm:block">
            <div className="mb-6 text-sm font-black text-ink">JobLeak</div>
            {['Overview', 'Missed Searches', 'Competitors', 'Reviews', 'Leads', 'Action Plan'].map((item, index) => (
              <div
                key={item}
                className={`mb-2 rounded-xl px-3 py-2 text-xs font-bold ${
                  index === 0 ? 'bg-brand text-white' : 'text-slate-500'
                }`}
              >
                {item}
              </div>
            ))}
            <div className="mt-10 rounded-2xl bg-white p-3 text-xs text-slate-500 shadow-sm">
              <MapPin className="mb-2 h-4 w-4 text-brand" />
              Market
              <div className="font-black text-ink">Austin, TX</div>
            </div>
          </aside>

          <main className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="text-lg font-black text-ink">Overview</div>
                <div className="text-xs font-semibold text-muted">Last 30 days</div>
              </div>
              <div className="rounded-full border border-slate-200 px-3 py-1 text-xs font-bold text-muted">Next report in 6 days</div>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <MetricCard title="Missed Searches" value="12" note="high-intent searches" trend="+29%" />
              <MetricCard title="Review Gap" value="148" note="reviews vs top competitor" danger />
              <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                <div className="text-sm font-black text-ink">Visibility Score</div>
                <div className="mt-4 flex items-center gap-4">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full border-[10px] border-blue-100 border-t-brand text-xl font-black text-ink">
                    68
                  </div>
                  <div className="text-xs font-bold text-emerald">+18 pts</div>
                </div>
              </div>
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                <div className="text-sm font-black text-ink">Leads Captured</div>
                <div className="mt-2 text-3xl font-black text-ink">17</div>
                <div className="text-xs font-bold text-emerald">+42% this month</div>
                <div className="mt-4 flex h-14 items-end gap-1">
                  {[22, 34, 28, 45, 54, 70].map((h) => (
                    <div key={h} className="w-full rounded-t bg-emerald" style={{ height: `${h}%` }} />
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                <div className="text-sm font-black text-ink">Top Competitors</div>
                {['Rapid Roofing', 'Atlas Exteriors', 'CityTop Roofing'].map((name, i) => (
                  <div key={name} className="mt-3 flex items-center justify-between text-xs font-bold text-slate-600">
                    <span>{i + 1}. {name}</span>
                    <span>{[84, 72, 58][i]}</span>
                  </div>
                ))}
                <div className="mt-4 text-xs font-black text-brand">View full report →</div>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                <div className="text-sm font-black text-ink">30-Day Action Plan</div>
                {['Add emergency service page', 'Request 20 reviews', 'Add city pages', 'Optimize Google profile'].map((item, i) => (
                  <div key={item} className="mt-3 flex items-center gap-2 text-xs font-bold text-slate-600">
                    <span className={`flex h-4 w-4 items-center justify-center rounded-full ${i < 2 ? 'bg-emerald text-white' : 'border border-slate-300'}`}>
                      {i < 2 ? <Check className="h-3 w-3" /> : null}
                    </span>
                    {item}
                  </div>
                ))}
                <div className="mt-4 h-2 rounded-full bg-slate-100"><div className="h-2 w-1/2 rounded-full bg-emerald" /></div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, note, trend, danger }: { title: string; value: string; note: string; trend?: string; danger?: boolean }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="text-sm font-black text-ink">{title}</div>
        {trend ? <div className="text-xs font-black text-rose-500">{trend}</div> : null}
      </div>
      <div className="mt-2 text-3xl font-black text-ink">{value}</div>
      <div className="text-xs font-bold text-muted">{note}</div>
      <div className="mt-4 h-2 rounded-full bg-slate-100">
        <div className={`h-2 rounded-full ${danger ? 'w-2/3 bg-rose-500' : 'w-3/4 bg-brand'}`} />
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <BrandLogo />
        <nav className="hidden items-center gap-8 text-sm font-bold text-ink lg:flex">
          <a href="#how">How It Works</a>
          <a href="#features">Features</a>
          <a href="#industries">Industries</a>
          <a href="#pricing">Pricing</a>
          <a href="#scan">Free Scan</a>
        </nav>
        <a href="#scan" className="rounded-2xl bg-brand px-5 py-3 text-sm font-black text-white shadow-card transition hover:bg-brandDark">
          Get Free Scan
        </a>
      </header>

      <section className="mx-auto grid max-w-7xl items-center gap-12 px-6 pb-20 pt-10 lg:grid-cols-[0.88fr_1.12fr]">
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-black text-brand">
            <ShieldCheck className="h-4 w-4" /> Built for roofers, HVAC, and plumbers
          </div>
          <h1 className="max-w-3xl text-5xl font-black leading-[0.95] tracking-[-0.06em] text-ink md:text-7xl">
            Stop leaking local jobs to your <span className="text-brand underline decoration-brand/25 decoration-[10px] underline-offset-[-4px]">competitors.</span>
          </h1>
          <p className="mt-7 max-w-2xl text-lg font-medium leading-8 text-muted">
            Find missed searches, review gaps, competitor advantages, and website fixes that help home-service businesses win more calls and booked jobs.
          </p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <a href="#scan" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand px-6 py-4 font-black text-white shadow-card transition hover:bg-brandDark">
              Get Free Job Leak Scan <ArrowRight className="h-5 w-5" />
            </a>
            <a href="/sample-report" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-blue-200 bg-white px-6 py-4 font-black text-brand shadow-sm transition hover:border-brand">
              See Sample Report
            </a>
          </div>
          <div className="mt-6 flex flex-wrap gap-4 text-sm font-bold text-muted">
            {['No setup fees', 'Fast first report', 'Cancel anytime'].map((item) => (
              <span key={item} className="flex items-center gap-2"><Check className="h-4 w-4 rounded-full bg-emerald p-0.5 text-white" />{item}</span>
            ))}
          </div>
        </div>
        <DashboardPreview />
      </section>

      <section id="how" className="border-y border-slate-100 bg-white/75 py-16">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-4xl font-black tracking-tight text-ink">How It Works</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              ['Scan', Search, 'We analyze reviews, competitors, and local search visibility.'],
              ['Fix', Wrench, 'We show what service pages, profile updates, and review actions matter most.'],
              ['Capture', Phone, 'Use tools to turn traffic into calls, quote requests, and reviews.']
            ].map(([title, Icon, text], index) => (
              <div key={title as string} className="rounded-3xl border border-slate-100 bg-white p-8 shadow-card">
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand text-white shadow-card">
                  <Icon className="h-7 w-7" />
                </div>
                <div className="text-sm font-black text-brand">0{index + 1}</div>
                <h3 className="mt-1 text-2xl font-black text-ink">{title as string}</h3>
                <p className="mt-3 font-medium leading-7 text-muted">{text as string}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-7xl px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-4xl font-black tracking-tight text-ink">Everything owners need to stop losing jobs</h2>
          <p className="mt-4 text-lg font-medium text-muted">Plain-English growth intelligence, not a confusing SEO dashboard.</p>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div key={feature.title} className="rounded-3xl border border-slate-100 bg-white p-7 shadow-card">
              <feature.icon className="h-8 w-8 text-brand" />
              <h3 className="mt-5 text-xl font-black text-ink">{feature.title}</h3>
              <p className="mt-3 font-medium leading-7 text-muted">{feature.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="industries" className="bg-slate-50/80 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="text-center text-4xl font-black tracking-tight text-ink">Built for high-value local jobs</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {industries.map((industry) => (
              <div key={industry.title} className={`rounded-3xl bg-gradient-to-br ${industry.bg} border border-slate-100 p-8 shadow-card`}>
                <industry.icon className="h-10 w-10 text-brand" />
                <h3 className="mt-5 text-2xl font-black text-ink">{industry.title}</h3>
                <ul className="mt-4 space-y-3 text-sm font-bold text-muted">
                  {industry.points.map((point) => <li key={point} className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald" />{point}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="scan" className="mx-auto grid max-w-7xl gap-8 px-6 py-20 lg:grid-cols-[0.95fr_1.05fr]">
        <div>
          <h2 className="text-4xl font-black tracking-tight text-ink">Get your free Job Leak Scan</h2>
          <p className="mt-4 text-lg font-medium leading-8 text-muted">
            Enter a business and city. The first report shows missed searches, review gaps, competitor issues, and the fastest fixes to win more local calls.
          </p>
          <div className="mt-8 rounded-3xl bg-ink p-6 text-white shadow-soft">
            <div className="flex items-center gap-3 text-xl font-black"><Clock className="h-6 w-6 text-emerald" /> Takes 60 seconds</div>
            <p className="mt-3 text-white/70">No credit card. No setup fee. Built to start sales conversations fast.</p>
          </div>
        </div>
        <form className="rounded-[2rem] border border-slate-100 bg-white p-7 shadow-soft">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-black text-ink">Business name<input className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand" placeholder="Austin Pro Roofing" /></label>
            <label className="text-sm font-black text-ink">Industry<select className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand"><option>Roofing</option><option>HVAC</option><option>Plumbing</option><option>Other home service</option></select></label>
            <label className="text-sm font-black text-ink">City / market<input className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand" placeholder="Austin, TX" /></label>
            <label className="text-sm font-black text-ink">Website<input className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand" placeholder="https://example.com" /></label>
          </div>
          <label className="mt-4 block text-sm font-black text-ink">What do you want more of?<textarea className="mt-2 h-24 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand" placeholder="More emergency roof repair calls, more reviews, more quote requests..." /></label>
          <button type="button" className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-brand px-6 py-4 font-black text-white shadow-card transition hover:bg-brandDark">
            Generate Free Scan <TrendingUp className="h-5 w-5" />
          </button>
          <p className="mt-3 text-center text-xs font-bold text-muted">MVP form only. We will connect submissions to the backend next.</p>
        </form>
      </section>

      <section id="pricing" className="mx-auto max-w-7xl px-6 pb-20">
        <h2 className="text-center text-4xl font-black tracking-tight text-ink">Simple pricing built around ROI</h2>
        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {pricing.map((plan) => (
            <div key={plan.name} className={`relative rounded-[2rem] border p-8 shadow-card ${plan.highlighted ? 'border-brand bg-white ring-4 ring-blue-50' : 'border-slate-100 bg-white'}`}>
              {plan.highlighted ? <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-brand px-4 py-2 text-xs font-black uppercase tracking-widest text-white">Most Popular</div> : null}
              <h3 className="text-2xl font-black text-ink">{plan.name}</h3>
              <p className="mt-3 min-h-12 font-medium text-muted">{plan.desc}</p>
              <div className="mt-6"><span className="text-5xl font-black text-ink">{plan.price}</span><span className="font-bold text-muted">/mo</span></div>
              <ul className="mt-6 space-y-3">
                {plan.features.map((item) => <li key={item} className="flex items-center gap-2 text-sm font-bold text-muted"><Check className="h-4 w-4 text-brand" />{item}</li>)}
              </ul>
              <a href="#scan" className={`mt-8 flex justify-center rounded-2xl px-5 py-3 font-black ${plan.highlighted ? 'bg-brand text-white' : 'border border-blue-200 text-brand'}`}>Start Free Scan</a>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto mb-14 max-w-7xl px-6">
        <div className="noise overflow-hidden rounded-[2rem] bg-ink p-8 text-white shadow-soft md:p-12">
          <div className="grid items-center gap-6 md:grid-cols-[1fr_auto]">
            <div>
              <h2 className="text-3xl font-black tracking-tight md:text-4xl">Stop losing jobs. Start winning more.</h2>
              <p className="mt-3 max-w-2xl text-white/70">Get your free scan and see where your next customers are searching — and how to capture them.</p>
            </div>
            <a href="#scan" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald px-6 py-4 font-black text-white shadow-card">
              Get Free Growth Scan <ArrowRight className="h-5 w-5" />
            </a>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-100 bg-white py-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 md:flex-row md:items-center md:justify-between">
          <BrandLogo />
          <div className="text-sm font-bold text-muted">© 2026 JobLeak. Built for home-service growth.</div>
        </div>
      </footer>
    </main>
  );
}
