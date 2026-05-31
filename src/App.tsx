import { useMemo, useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  Check,
  ChevronRight,
  Clock,
  Home,
  LockKeyhole,
  MapPin,
  Menu,
  Phone,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Wrench,
  X
} from 'lucide-react';

type Route = 'home' | 'report' | 'login' | 'dashboard';
type Industry = 'roofing' | 'hvac' | 'plumbing' | 'electrical' | 'pest';

type ScanInput = {
  businessName: string;
  industry: Industry;
  city: string;
  website: string;
  email: string;
  phone: string;
  goal: string;
};

const industryLabels: Record<Industry, string> = {
  roofing: 'Roofing',
  hvac: 'HVAC',
  plumbing: 'Plumbing',
  electrical: 'Electrical',
  pest: 'Pest Control'
};

const industryData: Record<Industry, { keywords: string[]; actions: string[]; icon: string; gradient: string }> = {
  roofing: {
    icon: '🏠',
    gradient: 'blue',
    keywords: ['emergency roof repair', 'storm damage roof repair', 'roof leak repair near me', 'same day roofing', 'roof inspection'],
    actions: ['Add emergency roof repair page', 'Create storm damage landing page', 'Request 20 reviews', 'Add city service pages', 'Install quote widget']
  },
  hvac: {
    icon: '🔥',
    gradient: 'orange',
    keywords: ['AC repair near me', 'emergency HVAC', 'furnace repair', 'commercial HVAC maintenance', 'duct cleaning'],
    actions: ['Add emergency AC repair page', 'Promote seasonal tune-ups', 'Add booking CTA above fold', 'Request reviews after service calls', 'Create city pages']
  },
  plumbing: {
    icon: '🔧',
    gradient: 'green',
    keywords: ['emergency plumber', 'water heater repair', 'drain cleaning near me', 'burst pipe repair', 'sewer backup service'],
    actions: ['Add emergency plumber page', 'Create water heater page', 'Add photo upload widget', 'Improve call button visibility', 'Request reviews after jobs']
  },
  electrical: {
    icon: '⚡',
    gradient: 'purple',
    keywords: ['emergency electrician', 'EV charger installation', 'breaker panel upgrade', 'recessed lighting installer', 'surge protection'],
    actions: ['Add EV charger page', 'Create panel upgrade page', 'Post job photos weekly', 'Add service pricing examples', 'Create quote request form']
  },
  pest: {
    icon: '🛡️',
    gradient: 'teal',
    keywords: ['emergency pest control', 'termite treatment cost', 'wasp nest removal', 'bed bug inspection', 'rodent control'],
    actions: ['Add termite treatment page', 'Create inspection lead magnet', 'Request reviews from contracts', 'Add seasonal pest pages', 'Install callback widget']
  }
};

const pricing = [
  ['Starter', '$99', 'For one local business that wants a clean monthly scan.', ['1 location', 'Monthly growth scan', 'Review gap report', '30-day action plan', 'Email support']],
  ['Growth', '$199', 'For owners ready to track competitors and capture more leads.', ['Up to 3 locations', 'Weekly scan updates', 'Competitor tracker', 'Lead capture widget', 'Priority support']],
  ['Pro', '$299', 'For teams that want deeper insights and implementation help.', ['Up to 10 locations', 'Advanced insights', 'Service page ideas', 'PDF owner reports', 'Phone support']]
];

const defaultScan: ScanInput = {
  businessName: 'Austin Pro Roofing',
  industry: 'roofing',
  city: 'Austin, TX',
  website: 'austinproroofing.com',
  email: 'owner@example.com',
  phone: '(512) 555-0199',
  goal: 'More emergency roof repair calls and better reviews.'
};

function Logo() {
  return (
    <button className="brand" onClick={() => (window.location.hash = '#home')}>
      <div className="brand-mark"><TrendingUp size={22} /></div>
      <div>
        <strong>JobLeak</strong>
        <span>Growth Radar</span>
      </div>
    </button>
  );
}

function App() {
  const [route, setRoute] = useState<Route>(() => getRoute());
  const [scan, setScan] = useState<ScanInput | null>(null);

  function go(next: Route) {
    setRoute(next);
    window.location.hash = next;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  window.onhashchange = () => setRoute(getRoute());

  return (
    <div>
      {route === 'home' && <Home go={go} onScan={(input) => { setScan(input); go('report'); }} />}
      {route === 'report' && <Report go={go} scan={scan || defaultScan} />}
      {route === 'login' && <Login go={go} />}
      {route === 'dashboard' && <Dashboard go={go} scan={scan || defaultScan} />}
    </div>
  );
}

function getRoute(): Route {
  const hash = window.location.hash.replace('#', '') as Route;
  return ['home', 'report', 'login', 'dashboard'].includes(hash) ? hash : 'home';
}

function Nav({ go }: { go: (r: Route) => void }) {
  const [open, setOpen] = useState(false);
  const links = [
    ['Platform', 'platform'],
    ['Features', 'features'],
    ['Industries', 'industries'],
    ['Pricing', 'pricing']
  ];
  const scroll = (id: string) => {
    setOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  return (
    <header className="nav">
      <div className="container nav-inner">
        <Logo />
        <nav className="desktop-links">
          {links.map(([label, id]) => <button key={id} onClick={() => scroll(id)}>{label}</button>)}
          <button onClick={() => go('report')}>Sample Report</button>
          <button onClick={() => go('dashboard')}>Demo Portal</button>
          <button className="login-link" onClick={() => go('login')}><LockKeyhole size={15} /> Login</button>
        </nav>
        <button className="primary small" onClick={() => scroll('scan')}>Get Free Scan</button>
        <button className="mobile-menu" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
      </div>
      {open && (
        <div className="mobile-panel">
          {links.map(([label, id]) => <button key={id} onClick={() => scroll(id)}>{label}</button>)}
          <button onClick={() => go('report')}>Sample Report</button>
          <button onClick={() => go('dashboard')}>Demo Portal</button>
          <button onClick={() => go('login')}>Login</button>
        </div>
      )}
    </header>
  );
}

function Home({ go, onScan }: { go: (r: Route) => void; onScan: (input: ScanInput) => void }) {
  return (
    <main>
      <Nav go={go} />
      <section className="hero section">
        <div className="container hero-grid">
          <div className="hero-copy">
            <div className="eyebrow"><ShieldCheck size={16} /> Built for home-service growth</div>
            <h1>Stop losing local jobs to your competitors.</h1>
            <p>JobLeak shows owners the searches, review gaps, competitor moves, and website fixes costing them calls — then turns the fixes into a simple action plan.</p>
            <div className="cta-row">
              <a className="primary" href="#scan">Generate Free Scan <ArrowRight size={18} /></a>
              <button className="secondary" onClick={() => go('report')}>See Sample Report</button>
            </div>
            <div className="trust-row">
              {['No setup fees', 'Fast first report', 'Cancel anytime'].map((x) => <span key={x}><Check size={14} /> {x}</span>)}
            </div>
          </div>
          <DashboardPreview />
        </div>
      </section>

      <section className="metric-strip">
        <div className="container metric-grid">
          {[
            ['12+', 'missed searches surfaced'],
            ['148', 'review gap example'],
            ['17', 'leads captured demo'],
            ['$199', 'core growth plan']
          ].map(([n, l]) => <div key={l}><strong>{n}</strong><span>{l}</span></div>)}
        </div>
      </section>

      <section id="platform" className="section white">
        <div className="container split">
          <div>
            <div className="label">Platform overview</div>
            <h2>A growth command center, not another SEO dashboard.</h2>
            <p>Owners do not need 300 marketing metrics. They need to know where jobs are being lost, who is taking them, and what to fix first.</p>
            <div className="check-list">
              {['Find the lost job searches', 'Explain the competitor advantage', 'Create the 30-day action plan', 'Capture website visitors before they bounce'].map((x) => <div key={x}><Check size={18} /> {x}</div>)}
            </div>
          </div>
          <div className="tool-grid">
            {[
              ['Google Profile Check', Search],
              ['Review Gap Report', Star],
              ['Competitor Pages', Target],
              ['Lead Widget', Phone],
              ['Service Area Ideas', MapPin],
              ['Monthly Owner PDF', BarChart3]
            ].map(([title, Icon]) => <div className="tool-card" key={title as string}><Icon size={24} /><strong>{title as string}</strong><p>Turns local growth signals into clear next steps.</p></div>)}
          </div>
        </div>
      </section>

      <section id="features" className="section muted">
        <div className="container centered">
          <div className="label">Features</div>
          <h2>Everything owners need to stop losing jobs.</h2>
          <p>Simple, visual, and built for real sales conversations.</p>
          <div className="feature-grid">
            {[
              ['Missed Job Scan', Target, 'Find high-intent searches competitors are winning.'],
              ['Competitor Intelligence', BarChart3, 'Compare reviews, pages, CTAs, and profile strength.'],
              ['Review Gap Engine', Star, 'Show the exact review gap against local leaders.'],
              ['Lead Capture Widget', Phone, 'Capture calls, callbacks, quote requests, and photo uploads.'],
              ['Service Area Ideas', MapPin, 'Find city and service pages worth creating.'],
              ['Monthly Owner Report', TrendingUp, 'Show what changed, what to fix, and what to do next.']
            ].map(([title, Icon, text]) => <div className="feature-card" key={title as string}><Icon size={26} /><strong>{title as string}</strong><p>{text as string}</p></div>)}
          </div>
        </div>
      </section>

      <section id="industries" className="section white">
        <div className="container">
          <div className="section-head">
            <div><div className="label">Vertical-ready</div><h2>Looks built for their trade.</h2></div>
            <p>The same engine can be packaged for roofers, HVAC, plumbers, electricians, pest control, and more.</p>
          </div>
          <div className="industry-grid">
            {(['roofing', 'hvac', 'plumbing'] as Industry[]).map((key) => {
              const d = industryData[key];
              return <div className="industry-card" key={key}><div className={`industry-art ${d.gradient}`}><span>{d.icon}</span><strong>{industryLabels[key]}</strong></div><ul>{d.keywords.slice(0, 3).map((x) => <li key={x}><Check size={15} /> {x}</li>)}</ul></div>;
            })}
          </div>
        </div>
      </section>

      <section id="scan" className="section dark">
        <div className="container split">
          <div>
            <div className="label green">Free scan</div>
            <h2>Give prospects a report they actually want to read.</h2>
            <p>Use the free scan as the hook. Show the gaps. Then sell the Growth Radar subscription.</p>
            <div className="dark-note"><Clock size={20} /> First version captures intent. Backend lead capture comes next.</div>
          </div>
          <ScanForm onScan={onScan} />
        </div>
      </section>

      <section id="pricing" className="section white">
        <div className="container centered">
          <div className="label">Pricing</div>
          <h2>Simple pricing built around ROI.</h2>
          <div className="pricing-grid">
            {pricing.map(([name, price, desc, items], i) => <div key={name as string} className={`price-card ${i === 1 ? 'popular' : ''}`}>{i === 1 && <span className="popular-badge">Most Popular</span>}<h3>{name as string}</h3><p>{desc as string}</p><div className="price">{price as string}<span>/mo</span></div><ul>{(items as string[]).map((x) => <li key={x}><Check size={15} /> {x}</li>)}</ul><a href="#scan" className={i === 1 ? 'primary full' : 'secondary full'}>Start Free Scan</a></div>)}
          </div>
        </div>
      </section>

      <section className="container final-cta"><div><h2>Stop losing jobs. Start winning more.</h2><p>Get the scan, show the gaps, and turn the report into your first customer conversation.</p></div><a className="primary" href="#scan">Get Free Growth Scan <ChevronRight size={18} /></a></section>
      <Footer go={go} />
    </main>
  );
}

function DashboardPreview() {
  return (
    <div className="dashboard-shell">
      <div className="dash-top"><div><span>Live Market Overview</span><strong>Austin Pro Roofing</strong></div><em>12 job gaps found</em></div>
      <div className="dash-body">
        <aside>{['Overview', 'Lost Jobs', 'Competitors', 'Reviews', 'Lead Widget'].map((x, i) => <div className={i === 0 ? 'active' : ''} key={x}>{x}</div>)}</aside>
        <section>
          <div className="dash-title"><div><strong>Growth Overview</strong><span>Missed searches, review gaps, and action items.</span></div><button>Updated today</button></div>
          <div className="stat-grid"><Stat label="Visibility" value="68/100" /><Stat label="Missed Searches" value="12" /><Stat label="Review Gap" value="148" /><Stat label="Leads Captured" value="17" /></div>
          <div className="dash-lower"><div className="panel"><strong>Top leaking searches</strong>{['emergency roof repair Austin', 'storm damage roof repair', 'roof leak repair near me'].map((x) => <div className="search-row" key={x}><span>{x}</span><em>High</em></div>)}</div><div className="panel"><strong>Competitor scorecard</strong>{[['Rapid Roofing', 87], ['Atlas Exteriors', 81], ['CityTop Roofing', 76]].map(([n, s]) => <div className="bar-row" key={n as string}><span>{n as string}</span><div><i style={{ width: `${s}%` }} /></div></div>)}<p className="recommendation">Recommended: add emergency page + request 20 reviews.</p></div></div>
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="stat-card"><span>{label}</span><strong>{value}</strong></div>;
}

function ScanForm({ onScan }: { onScan: (input: ScanInput) => void }) {
  const [form, setForm] = useState<ScanInput>({ ...defaultScan, businessName: '', city: '', website: '', email: '', phone: '', goal: '' });
  const [loading, setLoading] = useState(false);
  const update = (key: keyof ScanInput, value: string) => setForm((f) => ({ ...f, [key]: value }));
  const submit = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onScan({ ...defaultScan, ...form, businessName: form.businessName || defaultScan.businessName, city: form.city || defaultScan.city });
    }, 1200);
  };
  return (
    <div className="scan-card">
      <div className="form-grid">
        <label>Business name<input value={form.businessName} onChange={(e) => update('businessName', e.target.value)} placeholder="Austin Pro Roofing" /></label>
        <label>Industry<select value={form.industry} onChange={(e) => update('industry', e.target.value)}>{Object.entries(industryLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
        <label>City / market<input value={form.city} onChange={(e) => update('city', e.target.value)} placeholder="Austin, TX" /></label>
        <label>Website<input value={form.website} onChange={(e) => update('website', e.target.value)} placeholder="https://example.com" /></label>
        <label>Email<input value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="owner@example.com" /></label>
        <label>Phone<input value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="(555) 123-4567" /></label>
      </div>
      <label>What do you want more of?<textarea value={form.goal} onChange={(e) => update('goal', e.target.value)} placeholder="More emergency calls, reviews, quote requests..." /></label>
      <button className="primary full" onClick={submit}>{loading ? 'Scanning market...' : 'Generate Free Scan'} <TrendingUp size={18} /></button>
      <small>Demo flow. Real lead storage comes next.</small>
    </div>
  );
}

function Report({ go, scan }: { go: (r: Route) => void; scan: ScanInput }) {
  const data = useMemo(() => industryData[scan.industry], [scan.industry]);
  return <main><TopBar go={go} /><section className="report-hero"><div className="container"><div className="report-card dark-card"><div><div className="label green">Sample growth report</div><h1>{scan.businessName} is losing local {industryLabels[scan.industry].toLowerCase()} jobs.</h1><p>{scan.city} • {scan.website || 'website not provided'}</p></div><div className="score-circle"><strong>68</strong><span>/100</span></div></div><div className="report-metrics"><Stat label="Missed Searches" value="12" /><Stat label="Review Gap" value="148" /><Stat label="Captured Leads" value="17" /><Stat label="Priority Fixes" value="5" /></div><div className="report-grid"><div className="panel big"><h2>Top missed local searches</h2>{data.keywords.map((k, i) => <div className="table-row" key={k}><strong>{i + 1}. {k} {scan.city.split(',')[0]}</strong><span>{i < 2 ? 'Critical' : 'High'}</span><p>Competitors have stronger reviews, pages, or Google profile signals.</p></div>)}</div><div className="panel big"><h2>30-day action plan</h2>{data.actions.map((a) => <div className="action-row" key={a}><Check size={17} /> {a}</div>)}<button className="primary full" onClick={() => go('dashboard')}>View Demo Portal</button></div></div></div></section><Footer go={go} /></main>;
}

function Login({ go }: { go: (r: Route) => void }) {
  return <main><TopBar go={go} /><section className="login-section"><div className="container login-grid"><div className="dark-card"><div className="label green">Client portal</div><h1>Your local growth command center.</h1><p>Clients will use this portal to view reports, competitors, review goals, lead requests, and monthly action plans.</p><div className="check-list light">{['Weekly scans', 'Lead inbox', 'Review goals', 'Action plan'].map((x) => <div key={x}><Check size={18} /> {x}</div>)}</div></div><div className="login-card"><LockKeyhole size={34} /><h2>Client Login</h2><p>Demo placeholder for the client portal experience.</p><label>Email<input placeholder="owner@company.com" /></label><label>Password<input type="password" placeholder="••••••••" /></label><button className="primary full" onClick={() => go('dashboard')}>View Demo Portal <Sparkles size={18} /></button></div></div></section></main>;
}

function Dashboard({ go, scan }: { go: (r: Route) => void; scan: ScanInput }) {
  const data = industryData[scan.industry];
  return <main><TopBar go={go} /><section className="dashboard-page"><div className="container"><div className="portal-head"><div><div className="label">Demo portal</div><h1>{scan.businessName}</h1><p>{industryLabels[scan.industry]} growth dashboard • {scan.city}</p></div><button className="secondary" onClick={() => go('report')}>View Report</button></div><div className="report-metrics"><Stat label="Visibility" value="68/100" /><Stat label="Missed Searches" value="12" /><Stat label="Review Gap" value="148" /><Stat label="New Leads" value="17" /></div><div className="portal-grid"><div className="panel big"><h2>Recent lead requests</h2>{['Emergency service callback', 'Quote request with photos', 'Free inspection request', 'Review follow-up'].map((l, i) => <div className="lead-row" key={l}><div><strong>{l}</strong><span>{['12 mins ago', '2 hours ago', '5 hours ago', '1 day ago'][i]}</span></div><em>{i === 0 ? 'New' : i === 1 ? 'Booked' : 'Contacted'}</em></div>)}</div><div className="panel big"><h2>Action plan</h2>{data.actions.map((a, i) => <div className="action-row" key={a}><Check size={17} /> {a}<span>{i < 2 ? 'Critical' : 'High'}</span></div>)}</div></div></div></section></main>;
}

function TopBar({ go }: { go: (r: Route) => void }) {
  return <header className="simple-top"><div className="container nav-inner"><Logo /><button className="secondary" onClick={() => go('home')}>Back Home</button></div></header>;
}

function Footer({ go }: { go: (r: Route) => void }) {
  return <footer><div className="container footer-grid"><Logo /><div><button onClick={() => go('login')}>Client Login</button><button onClick={() => go('report')}>Sample Report</button><a href="#pricing">Pricing</a><a href="#scan">Free Scan</a></div><span>© 2026 JobLeak. Built for home-service growth.</span></div></footer>;
}

export default App;
