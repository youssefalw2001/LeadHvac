import { useEffect, useMemo, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowRight,
  BarChart3,
  Check,
  ChevronRight,
  Clipboard,
  Clock,
  Copy,
  FileText,
  Gauge,
  ListChecks,
  LockKeyhole,
  Mail,
  MapPin,
  Megaphone,
  Menu,
  MessageSquare,
  Phone,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Users,
  X,
  Zap
} from 'lucide-react';
import { saveLead } from './leadCapture';

type Route = 'home' | 'radar' | 'campaign' | 'login' | 'dashboard' | 'report';
type Industry = 'roofing' | 'hvac' | 'plumbing' | 'electrical' | 'pest' | 'garage';
type Confidence = 'High' | 'Medium' | 'Rising';
type LaunchType = 'google-search' | 'lsa' | 'reactivation';
type CampaignTab = 'google-search' | 'lsa' | 'reactivation' | 'checklist';

type ScanInput = {
  businessName: string;
  industry: Industry;
  city: string;
  service: string;
  website: string;
  email: string;
  phone: string;
  goal: string;
};

type Opportunity = {
  id: string;
  title: string;
  industry: Industry;
  market: string;
  service: string;
  signalSource: string;
  signal: string;
  why: string;
  offer: string;
  action: string;
  confidence: Confidence;
  launchType: LaunchType;
  audience: string;
  urgency: string;
};

type CampaignPack = {
  opportunity: Opportunity;
  name: string;
  objective: string;
  budget: string;
  landingHeadline: string;
  landingSubheadline: string;
  offer: string;
  cta: string;
  google: {
    keywords: string[];
    negatives: string[];
    headlines: string[];
    descriptions: string[];
    assets: string[];
  };
  lsa: {
    categories: string[];
    serviceAreas: string[];
    profileTasks: string[];
    leadRules: string[];
  };
  reactivation: {
    audience: string;
    emailSubject: string;
    emailBody: string;
    sms: string;
    facebookPost: string;
  };
  callScript: string[];
  checklist: string[];
};

type Playbook = {
  icon: string;
  gradient: string;
  services: string[];
  emergencyTitle: string;
  emergencySignal: string;
  emergencyWhy: string;
  emergencyOffer: string;
  emergencyAction: string;
  lsaTitle: string;
  lsaSignal: string;
  lsaWhy: string;
  lsaOffer: string;
  lsaAction: string;
  reactivationTitle: string;
  reactivationSignal: string;
  reactivationWhy: string;
  reactivationOffer: string;
  reactivationAction: string;
};

const industryLabels: Record<Industry, string> = {
  roofing: 'Roofing',
  hvac: 'HVAC',
  plumbing: 'Plumbing',
  electrical: 'Electrical',
  pest: 'Pest Control',
  garage: 'Garage Door'
};

const playbooks: Record<Industry, Playbook> = {
  hvac: {
    icon: 'HVAC',
    gradient: 'orange',
    services: ['AC Repair', 'Emergency HVAC', 'Furnace Repair', 'Tune-Ups', 'Duct Cleaning'],
    emergencyTitle: 'Emergency AC Repair Spike',
    emergencySignal: 'Extreme heat and urgent cooling demand',
    emergencyWhy: 'AC systems fail when temperatures jump. Homeowners searching now are usually ready to call, not research for weeks.',
    emergencyOffer: 'Same-day AC repair appointments',
    emergencyAction: 'Launch a call-focused Google Search campaign for emergency AC repair terms.',
    lsaTitle: 'Top Placement HVAC Opportunity',
    lsaSignal: 'High-intent local service searches',
    lsaWhy: 'HVAC buyers often call the first trusted provider they see. Strong Local Services Ads setup can capture ready-to-book calls.',
    lsaOffer: 'Verified local HVAC service with fast scheduling',
    lsaAction: 'Tighten Google Local Services categories, service area, reviews, and call response process.',
    reactivationTitle: 'Past Customer Tune-Up Reactivation',
    reactivationSignal: 'Seasonal maintenance window',
    reactivationWhy: 'Past HVAC customers already know the company. A simple seasonal message can bring back tune-ups, repairs, and replacements.',
    reactivationOffer: 'Priority seasonal system check',
    reactivationAction: 'Send email and opt-in SMS to past customers, then retarget site visitors.'
  },
  roofing: {
    icon: 'ROOF',
    gradient: 'blue',
    services: ['Storm Damage Inspection', 'Roof Repair', 'Roof Leak Repair', 'Roof Replacement', 'Gutter Repair'],
    emergencyTitle: 'Storm Damage Roofing Opportunity',
    emergencySignal: 'Wind, hail, and roof inspection demand',
    emergencyWhy: 'After storms, homeowners look for roof inspections, leak checks, and repair estimates quickly.',
    emergencyOffer: 'Free storm damage roof inspection',
    emergencyAction: 'Launch a Google Search campaign around storm damage, roof leak, and inspection searches.',
    lsaTitle: 'Roofing Trust Gap Opportunity',
    lsaSignal: 'Trust-heavy local roofing searches',
    lsaWhy: 'Roofing customers care about reviews, verification, photos, and speed. Local Services Ads can help capture calls when trust matters.',
    lsaOffer: 'Verified local roof inspection and repair',
    lsaAction: 'Improve Local Services profile, review request flow, photos, and service area coverage.',
    reactivationTitle: 'Old Estimate Follow-Up Opportunity',
    reactivationSignal: 'Unclosed estimates and aging roof concerns',
    reactivationWhy: 'Many homeowners delay roof work until weather or leaks force action. Past estimates are warm opportunities.',
    reactivationOffer: 'Updated roof repair or replacement estimate',
    reactivationAction: 'Reactivate old estimates with email, opt-in SMS, and call follow-up.'
  },
  plumbing: {
    icon: 'PLUMB',
    gradient: 'green',
    services: ['Drain Cleaning', 'Water Heater Repair', 'Emergency Plumbing', 'Leak Repair', 'Sewer Line Service'],
    emergencyTitle: 'Emergency Plumbing Call Spike',
    emergencySignal: 'Urgent leak, clog, and water heater demand',
    emergencyWhy: 'Plumbing problems are immediate. When customers search, they often need a same-day answer and a live phone response.',
    emergencyOffer: 'Same-day plumbing service',
    emergencyAction: 'Launch a Google Search campaign for emergency plumber, drain cleaning, and water heater terms.',
    lsaTitle: 'Local Plumber Top Placement Opportunity',
    lsaSignal: 'High-trust local service searches',
    lsaWhy: 'Plumbing buyers compare trust signals fast. Local Services Ads can convert high-intent searchers into calls.',
    lsaOffer: 'Verified local plumber with fast scheduling',
    lsaAction: 'Optimize LSA categories, hours, service radius, review count, and call handling.',
    reactivationTitle: 'Water Heater Reactivation Opportunity',
    reactivationSignal: 'Past customers and replacement timing',
    reactivationWhy: 'Past customers with older water heaters, recurring drain issues, or previous repairs are easier to convert than cold prospects.',
    reactivationOffer: 'Water heater check or drain cleaning offer',
    reactivationAction: 'Send opt-in SMS/email to past customers and retarget website visitors.'
  },
  electrical: {
    icon: 'ELEC',
    gradient: 'purple',
    services: ['Panel Upgrade', 'Emergency Electrician', 'EV Charger Install', 'Outlet Repair', 'Generator Install'],
    emergencyTitle: 'Same-Day Electrical Service Opportunity',
    emergencySignal: 'Urgent electrician and safety-related searches',
    emergencyWhy: 'Electrical issues feel risky to homeowners. Fast, trusted messaging can turn urgent searches into calls.',
    emergencyOffer: 'Same-day electrical troubleshooting',
    emergencyAction: 'Launch a Google Search campaign for emergency electrician and panel issue terms.',
    lsaTitle: 'Verified Electrician Trust Opportunity',
    lsaSignal: 'Trust-driven electrician searches',
    lsaWhy: 'Electricians benefit from visible verification, reviews, and fast response. Local Services Ads are built for this behavior.',
    lsaOffer: 'Verified local electrical service',
    lsaAction: 'Improve LSA service categories, business hours, review flow, and lead response.',
    reactivationTitle: 'Panel and EV Charger Reactivation',
    reactivationSignal: 'Past estimate and upgrade interest',
    reactivationWhy: 'Upgrade work often takes follow-up. Customers who asked before may convert when given a clear offer and schedule window.',
    reactivationOffer: 'Panel upgrade or EV charger estimate',
    reactivationAction: 'Follow up with past estimates using email, opt-in SMS, and retargeting.'
  },
  pest: {
    icon: 'PEST',
    gradient: 'teal',
    services: ['Pest Control', 'Termite Treatment', 'Rodent Control', 'Wasp Removal', 'Bed Bug Inspection'],
    emergencyTitle: 'Pest Activity Spike',
    emergencySignal: 'Seasonal pest pressure and urgent removal demand',
    emergencyWhy: 'Pest problems create urgency and discomfort. Customers want fast scheduling and clear pricing.',
    emergencyOffer: 'Fast pest inspection and treatment',
    emergencyAction: 'Launch a Google Search campaign for urgent pest control and treatment terms.',
    lsaTitle: 'Pest Control Trust Opportunity',
    lsaSignal: 'Local service searches where trust matters',
    lsaWhy: 'Pest buyers often compare providers quickly. Reviews, verification, and fast response can win the call.',
    lsaOffer: 'Verified local pest treatment',
    lsaAction: 'Optimize LSA services, photos, reviews, and response process.',
    reactivationTitle: 'Seasonal Pest Plan Reactivation',
    reactivationSignal: 'Past customers entering seasonal pest window',
    reactivationWhy: 'Past pest customers are strong reactivation targets when seasonal activity returns.',
    reactivationOffer: 'Seasonal pest protection visit',
    reactivationAction: 'Send email and opt-in SMS to previous customers and retarget site visitors.'
  },
  garage: {
    icon: 'DOOR',
    gradient: 'slate',
    services: ['Garage Door Repair', 'Spring Replacement', 'Opener Repair', 'Emergency Garage Door', 'New Door Install'],
    emergencyTitle: 'Garage Door Repair Demand Spike',
    emergencySignal: 'Urgent broken spring and stuck door searches',
    emergencyWhy: 'Garage door problems block cars, deliveries, and daily routines. Customers usually want same-day help.',
    emergencyOffer: 'Same-day garage door repair',
    emergencyAction: 'Launch a Google Search campaign for broken spring, stuck door, and opener repair terms.',
    lsaTitle: 'Garage Door Top Placement Opportunity',
    lsaSignal: 'High-intent repair searches',
    lsaWhy: 'Fast response and trust signals matter when a garage door is stuck or unsafe.',
    lsaOffer: 'Verified local garage door repair',
    lsaAction: 'Optimize LSA categories, hours, review flow, and service areas.',
    reactivationTitle: 'Past Repair Maintenance Reactivation',
    reactivationSignal: 'Past customers due for service or opener upgrades',
    reactivationWhy: 'Customers with prior garage door issues may need tune-ups, opener replacements, or spring inspections.',
    reactivationOffer: 'Garage door safety and tune-up visit',
    reactivationAction: 'Reactivate past customers with email, opt-in SMS, and retargeting.'
  }
};

const launchTypeLabels: Record<LaunchType, string> = {
  'google-search': 'Google Search Campaign',
  lsa: 'Google Local Services Pack',
  reactivation: 'Reactivation + Retargeting'
};

const pricing = [
  ['Starter', '$99', 'For contractors who want to know what local jobs to chase this week.', ['Opportunity Radar', 'Weekly opportunity scan', 'Suggested offers', 'Basic campaign ideas']],
  ['Growth', '$199', 'For contractors who want JobLeak to generate the ads and campaign assets.', ['Opportunity Radar', 'Instant Campaign Packs', 'Google Search assets', 'Email, SMS, and call scripts']],
  ['Pro', '$299', 'For teams that want campaigns, lead inbox, and launch tracking.', ['Everything in Growth', 'Lead Inbox', 'Campaign history', 'Launch checklist tracking']]
];

const defaultScan: ScanInput = {
  businessName: 'Phoenix Comfort Pros',
  industry: 'hvac',
  city: 'Phoenix, AZ',
  service: 'AC Repair',
  website: 'phoenixcomfortpros.com',
  email: 'owner@example.com',
  phone: '(602) 555-0199',
  goal: 'More emergency AC repair calls this week.'
};

function App() {
  const [route, setRoute] = useState<Route>(() => getRoute());
  const [scan, setScan] = useState<ScanInput>(defaultScan);
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);

  useEffect(() => {
    const syncRoute = () => setRoute(getRoute());
    window.addEventListener('hashchange', syncRoute);
    return () => window.removeEventListener('hashchange', syncRoute);
  }, []);

  function go(next: Route) {
    setRoute(next);
    window.location.hash = next;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function startScan(input: ScanInput) {
    setScan(input);
    const firstOpportunity = buildOpportunities(input)[0];
    setSelectedOpportunity(firstOpportunity);
    go('radar');
  }

  function openCampaign(opportunity: Opportunity) {
    setSelectedOpportunity(opportunity);
    go('campaign');
  }

  const activeOpportunity = selectedOpportunity || buildOpportunities(scan)[0];

  return (
    <div>
      {route === 'home' && <Home go={go} onScan={startScan} openCampaign={openCampaign} scan={scan} />}
      {(route === 'radar' || route === 'report') && <OpportunityRadar go={go} scan={scan} setScan={setScan} openCampaign={openCampaign} />}
      {route === 'campaign' && <CampaignPage go={go} opportunity={activeOpportunity} />}
      {route === 'login' && <Login go={go} />}
      {route === 'dashboard' && <Dashboard go={go} scan={scan} openCampaign={openCampaign} />}
    </div>
  );
}

function getRoute(): Route {
  const hash = window.location.hash.replace('#', '') as Route;
  return ['home', 'radar', 'campaign', 'login', 'dashboard', 'report'].includes(hash) ? hash : 'home';
}

function Logo() {
  return (
    <button className="brand" onClick={() => (window.location.hash = '#home')}>
      <div className="brand-mark"><TrendingUp size={22} /></div>
      <div>
        <strong>JobLeak</strong>
        <span>Opportunity Radar</span>
      </div>
    </button>
  );
}

function Nav({ go }: { go: (r: Route) => void }) {
  const [open, setOpen] = useState(false);
  const navItems: Array<[string, () => void]> = [
    ['Opportunity Radar', () => go('radar')],
    ['Campaign Generator', () => go('campaign')],
    ['Industries', () => scrollHomeSection('industries', go)],
    ['Pricing', () => scrollHomeSection('pricing', go)],
    ['Admin Inbox', () => { window.location.hash = '#admin'; }],
    ['Login', () => go('login')]
  ];

  return (
    <header className="nav">
      <div className="container nav-inner">
        <Logo />
        <nav className="desktop-links">
          {navItems.map(([label, action]) => <button key={label} onClick={action}>{label}</button>)}
        </nav>
        <button className="primary small" onClick={() => go('radar')}>Generate Opportunity Scan</button>
        <button className="mobile-menu" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
      </div>
      {open && (
        <div className="mobile-panel">
          {navItems.map(([label, action]) => <button key={label} onClick={() => { setOpen(false); action(); }}>{label}</button>)}
        </div>
      )}
    </header>
  );
}

function scrollHomeSection(id: string, go: (r: Route) => void) {
  if (window.location.hash.replace('#', '') !== 'home') {
    go('home');
    setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
  } else {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function Home({ go, onScan, openCampaign, scan }: { go: (r: Route) => void; onScan: (input: ScanInput) => void; openCampaign: (opportunity: Opportunity) => void; scan: ScanInput }) {
  const heroOpportunity = buildOpportunities(scan)[0];
  return (
    <main>
      <Nav go={go} />
      <section className="hero section">
        <div className="container hero-grid">
          <div className="hero-copy">
            <div className="eyebrow"><ShieldCheck size={16} /> AI opportunity radar for home services</div>
            <h1>Find local job opportunities before your competitors do.</h1>
            <p>JobLeak spots local demand signals for contractors and turns them into ready-to-run Google ads, Local Services checklists, reactivation messages, and call scripts.</p>
            <div className="cta-row">
              <button className="primary" onClick={() => go('radar')}>Generate Opportunity Scan <ArrowRight size={18} /></button>
              <button className="secondary" onClick={() => openCampaign(heroOpportunity)}>Generate Google Campaign Pack</button>
            </div>
            <div className="trust-row">
              {['No SEO jargon', 'Google-ready campaign assets', 'Opt-in customer messaging only'].map((x) => <span key={x}><Check size={14} /> {x}</span>)}
            </div>
          </div>
          <OpportunityPreview opportunity={heroOpportunity} openCampaign={openCampaign} />
        </div>
      </section>

      <section className="metric-strip">
        <div className="container metric-grid">
          {[
            ['3', 'launch engines'],
            ['1 click', 'campaign pack'],
            ['Today', 'copy and launch'],
            ['$199', 'Growth plan target']
          ].map(([n, l]) => <div key={l}><strong>{n}</strong><span>{l}</span></div>)}
        </div>
      </section>

      <section id="platform" className="section white">
        <div className="container split">
          <div>
            <div className="label">The product</div>
            <h2>One screen tells owners what jobs to chase this week.</h2>
            <p>Contractors should not need to understand analytics. JobLeak shows the opportunity, why it matters, the offer to run, and the campaign assets to launch.</p>
            <div className="check-list">
              {['Spot urgent local demand signals', 'Recommend the best of 3 launch engines', 'Generate copy, keywords, scripts, and checklist', 'Track leads through the existing JobLeak inbox'].map((x) => <div key={x}><Check size={18} /> {x}</div>)}
            </div>
          </div>
          <div className="tool-grid">
            {campaignEngines.map(({ title, text, Icon }) => <div className="tool-card" key={title}><Icon size={25} /><strong>{title}</strong><p>{text}</p></div>)}
          </div>
        </div>
      </section>

      <section className="section muted">
        <div className="container centered">
          <div className="label">How it works</div>
          <h2>Opportunity to campaign in seconds.</h2>
          <p>JobLeak focuses on the fastest contractor workflow: signal, offer, campaign, call.</p>
          <div className="feature-grid">
            {[
              ['1. Select market', MapPin, 'Choose industry, city, and service type.'],
              ['2. Pick opportunity', Target, 'Review local job opportunities and confidence level.'],
              ['3. Launch campaign', Megaphone, 'Copy Google ads, LSA checklist, reactivation messages, and call scripts.']
            ].map(([title, Icon, text]) => <div className="feature-card" key={title as string}><Icon size={26} /><strong>{title as string}</strong><p>{text as string}</p></div>)}
          </div>
        </div>
      </section>

      <section id="industries" className="section white">
        <div className="container">
          <div className="section-head">
            <div><div className="label">Industries</div><h2>Built for urgent home-service demand.</h2></div>
            <p>Start with the trades where search intent, weather events, and trust signals turn into booked jobs quickly.</p>
          </div>
          <div className="industry-grid">
            {(Object.keys(industryLabels) as Industry[]).map((key) => <IndustryCard key={key} industry={key} />)}
          </div>
        </div>
      </section>

      <section id="scan" className="section dark">
        <div className="container split">
          <div>
            <div className="label green">Lead capture stays live</div>
            <h2>Turn the free scan into the sales hook.</h2>
            <p>The form still saves scan requests to your existing Supabase table when Render has the Vite Supabase environment variables set.</p>
            <div className="dark-note"><Clock size={20} /> No private homeowner scraping. No spam tools. Own-list SMS only.</div>
          </div>
          <ScanForm onScan={onScan} />
        </div>
      </section>

      <Pricing />
      <section className="container final-cta">
        <div><h2>Give contractors the campaign to run today.</h2><p>JobLeak answers the question: what local jobs should I go after this week?</p></div>
        <button className="primary" onClick={() => go('radar')}>Open Opportunity Radar <ChevronRight size={18} /></button>
      </section>
      <Footer go={go} />
    </main>
  );
}

const campaignEngines: Array<{ title: string; text: string; Icon: LucideIcon }> = [
  { title: 'Google Search Campaigns', text: 'For urgent, ready-to-call searches like emergency AC repair, roof leak, or drain cleaning.', Icon: Search },
  { title: 'Google Local Services Pack', text: 'For top placement, trust, reviews, service areas, and fast lead handling.', Icon: Star },
  { title: 'Reactivation + Retargeting', text: 'For past customers, old estimates, site visitors, and opted-in customer lists.', Icon: Users }
];

function OpportunityPreview({ opportunity, openCampaign }: { opportunity: Opportunity; openCampaign: (opportunity: Opportunity) => void }) {
  return (
    <div className="radar-preview">
      <div className="radar-screen-top"><span>Live JobLeak Radar</span><strong>{opportunity.market}</strong></div>
      <OpportunityCard opportunity={opportunity} openCampaign={openCampaign} featured />
      <div className="mini-pack">
        <div><Search size={18} /><strong>Google Search</strong><span>Keywords + ads</span></div>
        <div><Star size={18} /><strong>Local Services</strong><span>Setup checklist</span></div>
        <div><MessageSquare size={18} /><strong>Reactivation</strong><span>Email + SMS</span></div>
      </div>
    </div>
  );
}

function OpportunityRadar({ go, scan, setScan, openCampaign }: { go: (r: Route) => void; scan: ScanInput; setScan: (input: ScanInput) => void; openCampaign: (opportunity: Opportunity) => void }) {
  const [draft, setDraft] = useState<ScanInput>(scan);
  const opportunities = useMemo(() => buildOpportunities(draft), [draft]);

  function update<K extends keyof ScanInput>(key: K, value: ScanInput[K]) {
    const next = { ...draft, [key]: value };
    if (key === 'industry') {
      next.service = playbooks[value as Industry].services[0];
    }
    setDraft(next);
    setScan(next);
  }

  return (
    <main>
      <TopBar go={go} />
      <section className="radar-page">
        <div className="container">
          <div className="portal-head">
            <div>
              <div className="label">Opportunity Radar</div>
              <h1>What jobs should you chase this week?</h1>
              <p>Choose the trade, market, and service. JobLeak recommends the opportunity and the launch engine.</p>
            </div>
            <button className="secondary" onClick={() => go('campaign')}>Open Campaign Generator</button>
          </div>

          <div className="radar-controls">
            <label>Industry
              <select value={draft.industry} onChange={(e) => update('industry', e.target.value as Industry)}>
                {Object.entries(industryLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <label>City / market
              <input value={draft.city} onChange={(e) => update('city', e.target.value)} placeholder="Phoenix, AZ" />
            </label>
            <label>Service type
              <select value={draft.service} onChange={(e) => update('service', e.target.value)}>
                {playbooks[draft.industry].services.map((service) => <option key={service} value={service}>{service}</option>)}
              </select>
            </label>
          </div>

          <div className="radar-grid">
            {opportunities.map((opportunity) => <OpportunityCard key={opportunity.id} opportunity={opportunity} openCampaign={openCampaign} />)}
          </div>
        </div>
      </section>
      <Footer go={go} />
    </main>
  );
}

function OpportunityCard({ opportunity, openCampaign, featured = false }: { opportunity: Opportunity; openCampaign: (opportunity: Opportunity) => void; featured?: boolean }) {
  return (
    <article className={`opportunity-card ${featured ? 'featured' : ''}`}>
      <div className="opp-head">
        <div>
          <span className="confidence">{opportunity.confidence} confidence</span>
          <h3>{opportunity.title}</h3>
        </div>
        <span className={`launch-badge ${opportunity.launchType}`}>{launchTypeLabels[opportunity.launchType]}</span>
      </div>
      <div className="opp-meta"><MapPin size={16} /> {opportunity.market} <span /> <Zap size={16} /> {opportunity.service}</div>
      <div className="signal-box"><strong>Signal:</strong> {opportunity.signal}</div>
      <p><strong>Why it matters:</strong> {opportunity.why}</p>
      <div className="opp-details">
        <div><span>Suggested offer</span><strong>{opportunity.offer}</strong></div>
        <div><span>Recommended action</span><strong>{opportunity.action}</strong></div>
      </div>
      <button className="primary full" onClick={() => openCampaign(opportunity)}>Generate Campaign Pack <ArrowRight size={18} /></button>
    </article>
  );
}

function CampaignPage({ go, opportunity }: { go: (r: Route) => void; opportunity: Opportunity }) {
  const [tab, setTab] = useState<CampaignTab>(opportunity.launchType);
  const [copied, setCopied] = useState('');
  const pack = useMemo(() => generateCampaignPack(opportunity), [opportunity]);

  async function copyText(label: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(''), 1600);
    } catch {
      setCopied('Copy failed');
      setTimeout(() => setCopied(''), 1600);
    }
  }

  function exportPack() {
    const blob = new Blob([campaignToText(pack)], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${pack.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main>
      <TopBar go={go} />
      <section className="campaign-page">
        <div className="container campaign-grid">
          <aside className="campaign-summary">
            <div className="label green">Instant Campaign Pack</div>
            <h1>{pack.name}</h1>
            <p>{pack.objective}</p>
            <div className="summary-card"><span>Recommended launch</span><strong>{launchTypeLabels[opportunity.launchType]}</strong></div>
            <div className="summary-card"><span>Budget starter</span><strong>{pack.budget}</strong></div>
            <div className="summary-card"><span>Offer</span><strong>{pack.offer}</strong></div>
            <button className="primary full" onClick={() => copyText('Full campaign copied', campaignToText(pack))}><Copy size={18} /> Copy Full Pack</button>
            <button className="secondary full" onClick={exportPack}><FileText size={18} /> Export Launch File</button>
            <a className="secondary full" href="https://ads.google.com" target="_blank" rel="noreferrer"><Search size={18} /> Open Google Ads</a>
            <small>{copied || 'Creates real launch assets. Direct Google publishing needs secure OAuth/backend later.'}</small>
          </aside>

          <div className="campaign-workspace">
            <div className="tabs">
              {([
                ['google-search', 'Google Search'],
                ['lsa', 'Local Services'],
                ['reactivation', 'Reactivation'],
                ['checklist', 'Checklist']
              ] as Array<[CampaignTab, string]>).map(([key, label]) => <button key={key} className={tab === key ? 'active' : ''} onClick={() => setTab(key)}>{label}</button>)}
            </div>

            {tab === 'google-search' && <GoogleSearchPack pack={pack} copyText={copyText} />}
            {tab === 'lsa' && <LsaPack pack={pack} copyText={copyText} />}
            {tab === 'reactivation' && <ReactivationPack pack={pack} copyText={copyText} />}
            {tab === 'checklist' && <ChecklistPack pack={pack} copyText={copyText} />}
          </div>
        </div>
      </section>
      <Footer go={go} />
    </main>
  );
}

function GoogleSearchPack({ pack, copyText }: { pack: CampaignPack; copyText: (label: string, text: string) => void }) {
  const googleText = [
    `Campaign: ${pack.name}`,
    `Budget: ${pack.budget}`,
    `Landing page headline: ${pack.landingHeadline}`,
    `Offer: ${pack.offer}`,
    '',
    'Keywords:',
    ...pack.google.keywords.map((x) => `- ${x}`),
    '',
    'Negative keywords:',
    ...pack.google.negatives.map((x) => `- ${x}`),
    '',
    'Headlines:',
    ...pack.google.headlines.map((x) => `- ${x}`),
    '',
    'Descriptions:',
    ...pack.google.descriptions.map((x) => `- ${x}`)
  ].join('\n');

  return (
    <div className="pack-panel">
      <PackHeader icon={Search} title="Google Search Campaign" subtitle="Use this for urgent ready-to-call demand." onCopy={() => copyText('Google Search copied', googleText)} />
      <div className="pack-grid two">
        <CopyBlock title="Campaign setup" lines={[`Name: ${pack.name}`, `Daily budget: ${pack.budget}`, `Location: ${pack.opportunity.market}`, `Objective: Calls and booked jobs`, `Landing CTA: ${pack.cta}`]} />
        <CopyBlock title="Landing page" lines={[pack.landingHeadline, pack.landingSubheadline, `Offer: ${pack.offer}`, `CTA: ${pack.cta}`]} />
        <CopyBlock title="Keywords" lines={pack.google.keywords} />
        <CopyBlock title="Negative keywords" lines={pack.google.negatives} />
        <CopyBlock title="Ad headlines" lines={pack.google.headlines} />
        <CopyBlock title="Ad descriptions" lines={pack.google.descriptions} />
      </div>
      <CopyBlock title="Recommended assets" lines={pack.google.assets} />
    </div>
  );
}

function LsaPack({ pack, copyText }: { pack: CampaignPack; copyText: (label: string, text: string) => void }) {
  const text = ['Google Local Services Pack', ...pack.lsa.categories, ...pack.lsa.profileTasks, ...pack.lsa.leadRules].join('\n');
  return (
    <div className="pack-panel">
      <PackHeader icon={Star} title="Google Local Services Pack" subtitle="Use this for trust, top placement, and high-intent local calls." onCopy={() => copyText('Local Services copied', text)} />
      <div className="pack-grid two">
        <CopyBlock title="Service categories to check" lines={pack.lsa.categories} />
        <CopyBlock title="Service areas" lines={pack.lsa.serviceAreas} />
        <CopyBlock title="Profile tasks" lines={pack.lsa.profileTasks} />
        <CopyBlock title="Lead handling rules" lines={pack.lsa.leadRules} />
      </div>
    </div>
  );
}

function ReactivationPack({ pack, copyText }: { pack: CampaignPack; copyText: (label: string, text: string) => void }) {
  const text = [pack.reactivation.emailSubject, pack.reactivation.emailBody, pack.reactivation.sms, pack.reactivation.facebookPost].join('\n\n');
  return (
    <div className="pack-panel">
      <PackHeader icon={MessageSquare} title="Reactivation + Retargeting" subtitle="Use only for owned audiences, opted-in customers, and retargeting pools." onCopy={() => copyText('Reactivation copied', text)} />
      <CopyBlock title="Audience" lines={[pack.reactivation.audience]} />
      <div className="pack-grid two">
        <CopyBlock title="Email" lines={[`Subject: ${pack.reactivation.emailSubject}`, pack.reactivation.emailBody]} />
        <CopyBlock title="SMS for opted-in list" lines={[pack.reactivation.sms]} />
        <CopyBlock title="Facebook / Instagram post" lines={[pack.reactivation.facebookPost]} />
        <CopyBlock title="Call script" lines={pack.callScript} />
      </div>
    </div>
  );
}

function ChecklistPack({ pack, copyText }: { pack: CampaignPack; copyText: (label: string, text: string) => void }) {
  return (
    <div className="pack-panel">
      <PackHeader icon={ListChecks} title="Launch Checklist" subtitle="Use this to launch safely and track booked jobs." onCopy={() => copyText('Checklist copied', pack.checklist.join('\n'))} />
      <div className="checklist-list">
        {pack.checklist.map((item) => <div key={item}><Check size={18} /> {item}</div>)}
      </div>
      <div className="safe-note"><ShieldCheck size={18} /> JobLeak does not scrape private homeowners, provide private phone numbers, or send SMS to non-opted-in people.</div>
    </div>
  );
}

function PackHeader({ icon: Icon, title, subtitle, onCopy }: { icon: LucideIcon; title: string; subtitle: string; onCopy: () => void }) {
  return (
    <div className="pack-header">
      <div><Icon size={24} /><div><h2>{title}</h2><p>{subtitle}</p></div></div>
      <button className="secondary" onClick={onCopy}><Copy size={16} /> Copy</button>
    </div>
  );
}

function CopyBlock({ title, lines }: { title: string; lines: string[] }) {
  return (
    <div className="copy-block">
      <strong>{title}</strong>
      <div>{lines.map((line) => <p key={line}>{line}</p>)}</div>
    </div>
  );
}

function ScanForm({ onScan }: { onScan: (input: ScanInput) => void }) {
  const [form, setForm] = useState<ScanInput>({ ...defaultScan, businessName: '', city: '', website: '', email: '', phone: '', goal: '' });
  const [status, setStatus] = useState('');

  function update<K extends keyof ScanInput>(key: K, value: ScanInput[K]) {
    const next = { ...form, [key]: value };
    if (key === 'industry') {
      next.service = playbooks[value as Industry].services[0];
    }
    setForm(next);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized: ScanInput = {
      ...defaultScan,
      ...form,
      businessName: form.businessName || defaultScan.businessName,
      city: form.city || defaultScan.city,
      service: form.service || playbooks[form.industry].services[0]
    };

    setStatus('Saving scan request...');
    try {
      await saveLead({
        businessName: normalized.businessName,
        industry: industryLabels[normalized.industry],
        city: normalized.city,
        website: normalized.website,
        email: normalized.email,
        phone: normalized.phone,
        goal: `Opportunity scan request. Service: ${normalized.service}. Goal: ${normalized.goal}`
      });
      setStatus('Saved. Opening radar...');
    } catch {
      setStatus('Opening radar. Lead storage needs Render Supabase env vars or table access.');
    }
    setTimeout(() => onScan(normalized), 300);
  }

  return (
    <form className="scan-card" onSubmit={submit}>
      <div className="form-grid">
        <label>Business name<input value={form.businessName} onChange={(e) => update('businessName', e.target.value)} placeholder="Phoenix Comfort Pros" /></label>
        <label>Industry<select value={form.industry} onChange={(e) => update('industry', e.target.value as Industry)}>{Object.entries(industryLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
        <label>City / market<input value={form.city} onChange={(e) => update('city', e.target.value)} placeholder="Phoenix, AZ" /></label>
        <label>Service type<select value={form.service} onChange={(e) => update('service', e.target.value)}>{playbooks[form.industry].services.map((service) => <option key={service} value={service}>{service}</option>)}</select></label>
        <label>Website<input value={form.website} onChange={(e) => update('website', e.target.value)} placeholder="https://example.com" /></label>
        <label>Phone<input value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="(555) 123-4567" /></label>
      </div>
      <label>Email<input value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="owner@example.com" /></label>
      <label>Goal<textarea value={form.goal} onChange={(e) => update('goal', e.target.value)} placeholder="More emergency repair calls this week..." /></label>
      <button className="primary full" type="submit">Generate Opportunity Scan <TrendingUp size={18} /></button>
      <small>{status || 'Saves to public.jobleak_leads when Supabase env variables are configured.'}</small>
    </form>
  );
}

function Pricing() {
  return (
    <section id="pricing" className="section white">
      <div className="container centered">
        <div className="label">Pricing</div>
        <h2>Simple pricing around campaigns, not dashboards.</h2>
        <div className="pricing-grid">
          {pricing.map(([name, price, desc, items], i) => <div key={name as string} className={`price-card ${i === 1 ? 'popular' : ''}`}>{i === 1 && <span className="popular-badge">Best first offer</span>}<h3>{name as string}</h3><p>{desc as string}</p><div className="price">{price as string}<span>/mo</span></div><ul>{(items as string[]).map((x) => <li key={x}><Check size={15} /> {x}</li>)}</ul><a href="#scan" className={i === 1 ? 'primary full' : 'secondary full'}>Start Opportunity Scan</a></div>)}
        </div>
      </div>
    </section>
  );
}

function Dashboard({ go, scan, openCampaign }: { go: (r: Route) => void; scan: ScanInput; openCampaign: (opportunity: Opportunity) => void }) {
  const opportunities = buildOpportunities(scan);
  return (
    <main>
      <TopBar go={go} />
      <section className="dashboard-page">
        <div className="container">
          <div className="portal-head">
            <div><div className="label">Client command center</div><h1>{scan.businessName}</h1><p>{industryLabels[scan.industry]} opportunity dashboard - {scan.city}</p></div>
            <button className="primary" onClick={() => go('radar')}>New Opportunity Scan</button>
          </div>
          <div className="report-metrics"><Stat label="Open opportunities" value="3" /><Stat label="Recommended engine" value="Google" /><Stat label="Campaign packs" value="Ready" /><Stat label="Lead inbox" value="Live" /></div>
          <div className="portal-grid">
            <div className="panel big"><h2>Top opportunities</h2>{opportunities.map((opportunity) => <div className="lead-row" key={opportunity.id}><div><strong>{opportunity.title}</strong><span>{opportunity.signal}</span></div><button onClick={() => openCampaign(opportunity)}>Campaign</button></div>)}</div>
            <div className="panel big"><h2>Lead follow-up</h2>{['Call new scan requests within 5 minutes', 'Ask which service they want more of this week', 'Offer Growth plan for campaign packs', 'Track calls and booked jobs'].map((a) => <div className="action-row" key={a}><Check size={17} /> {a}</div>)}</div>
          </div>
        </div>
      </section>
    </main>
  );
}

function Login({ go }: { go: (r: Route) => void }) {
  return <main><TopBar go={go} /><section className="login-section"><div className="container login-grid"><div className="dark-card"><div className="label green">Client portal</div><h1>Your local job opportunity command center.</h1><p>Clients use this portal to see what jobs to chase, generate campaigns, and track follow-up.</p><div className="check-list light">{['Opportunity Radar', 'Instant Campaign Packs', 'Lead Inbox', 'Launch checklist'].map((x) => <div key={x}><Check size={18} /> {x}</div>)}</div></div><div className="login-card"><LockKeyhole size={34} /><h2>Client Login</h2><p>Portal placeholder for launch. Connect authentication after the landing flow is converting.</p><label>Email<input placeholder="owner@company.com" /></label><label>Password<input type="password" placeholder="Password" /></label><button className="primary full" onClick={() => go('dashboard')}>Open Client Portal <Sparkles size={18} /></button></div></div></section></main>;
}

function TopBar({ go }: { go: (r: Route) => void }) {
  return <header className="simple-top"><div className="container nav-inner"><Logo /><div className="top-actions"><button className="secondary" onClick={() => go('radar')}>Radar</button><button className="secondary" onClick={() => go('home')}>Home</button></div></div></header>;
}

function Footer({ go }: { go: (r: Route) => void }) {
  return <footer><div className="container footer-grid"><Logo /><div><button onClick={() => go('radar')}>Opportunity Radar</button><button onClick={() => go('campaign')}>Campaign Generator</button><button onClick={() => { window.location.hash = '#admin'; }}>Admin Inbox</button><button onClick={() => go('login')}>Login</button></div><span>© 2026 JobLeak. AI local job opportunity radar for contractors.</span></div></footer>;
}

function IndustryCard({ industry }: { industry: Industry }) {
  const data = playbooks[industry];
  return <div className="industry-card"><div className={`industry-art ${data.gradient}`}><span>{data.icon}</span><strong>{industryLabels[industry]}</strong></div><ul>{data.services.slice(0, 4).map((service) => <li key={service}><Check size={15} /> {service}</li>)}</ul></div>;
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="stat-card"><span>{label}</span><strong>{value}</strong></div>;
}

function buildOpportunities(input: ScanInput): Opportunity[] {
  const pb = playbooks[input.industry];
  const market = input.city || defaultScan.city;
  const service = input.service || pb.services[0];
  return [
    {
      id: `${input.industry}-google-search`,
      title: pb.emergencyTitle,
      industry: input.industry,
      market,
      service,
      signalSource: 'Weather + high-intent search demand',
      signal: pb.emergencySignal,
      why: pb.emergencyWhy,
      offer: pb.emergencyOffer,
      action: pb.emergencyAction,
      confidence: 'High',
      launchType: 'google-search',
      audience: 'Homeowners actively searching for urgent service',
      urgency: 'Need help now'
    },
    {
      id: `${input.industry}-lsa`,
      title: pb.lsaTitle,
      industry: input.industry,
      market,
      service,
      signalSource: 'Google Local Services trust and placement',
      signal: pb.lsaSignal,
      why: pb.lsaWhy,
      offer: pb.lsaOffer,
      action: pb.lsaAction,
      confidence: 'High',
      launchType: 'lsa',
      audience: 'High-intent local searchers comparing trusted providers',
      urgency: 'Ready to call'
    },
    {
      id: `${input.industry}-reactivation`,
      title: pb.reactivationTitle,
      industry: input.industry,
      market,
      service,
      signalSource: 'Owned audience and seasonal timing',
      signal: pb.reactivationSignal,
      why: pb.reactivationWhy,
      offer: pb.reactivationOffer,
      action: pb.reactivationAction,
      confidence: 'Medium',
      launchType: 'reactivation',
      audience: 'Past customers, old estimates, opted-in list, and website visitors',
      urgency: 'Follow up this week'
    }
  ];
}

function generateCampaignPack(opportunity: Opportunity): CampaignPack {
  const city = cleanCity(opportunity.market);
  const service = opportunity.service;
  const industry = industryLabels[opportunity.industry];
  const serviceLower = service.toLowerCase();
  const cityLower = city.toLowerCase();
  const name = `${city} ${service} - ${shortLaunchLabel(opportunity.launchType)}`;

  return {
    opportunity,
    name,
    objective: `Turn the ${opportunity.signal.toLowerCase()} signal into booked ${service.toLowerCase()} calls in ${opportunity.market}.`,
    budget: opportunity.launchType === 'google-search' ? '$50-$150/day starter budget' : opportunity.launchType === 'lsa' ? 'Set weekly lead budget based on capacity' : '$0 ad spend to start, then retargeting budget if available',
    landingHeadline: `${service} in ${city}`,
    landingSubheadline: `${opportunity.why} Book fast local service from a trusted ${industry.toLowerCase()} team.`,
    offer: opportunity.offer,
    cta: opportunity.launchType === 'reactivation' ? 'Reply to schedule service' : 'Call now to schedule service',
    google: {
      keywords: [
        `${serviceLower} ${cityLower}`,
        `${serviceLower} near me`,
        `same day ${serviceLower}`,
        `emergency ${serviceLower}`,
        `${industry.toLowerCase()} company ${cityLower}`,
        `${serviceLower} open now`,
        `best ${serviceLower} ${cityLower}`,
        `local ${serviceLower}`
      ],
      negatives: ['jobs', 'salary', 'school', 'training', 'diy', 'free parts', 'used', 'wholesale', 'certification', 'course'],
      headlines: [
        `${service} ${city}`,
        `Same-Day ${service}`,
        `Call Local Pros Today`,
        `Fast ${industry} Help`,
        `${city} Home Service`,
        `Book Service Today`,
        `Trusted Local Team`,
        `Emergency Help Available`
      ],
      descriptions: [
        `${opportunity.signal}. Book fast ${service.toLowerCase()} with a local ${industry.toLowerCase()} team today.`,
        `${opportunity.offer}. Call now to check availability in ${opportunity.market}.`,
        `Need help this week? Get a clear offer, fast scheduling, and local service.`
      ],
      assets: [
        'Use phone call conversion tracking before spending heavily.',
        'Send traffic to a focused service landing page, not the homepage.',
        'Run only inside the real service area.',
        'Use call assets and make sure calls are answered live.',
        'Pause keywords that spend without booked calls.'
      ]
    },
    lsa: {
      categories: [service, industry, `Emergency ${industry}`, 'Repair service', 'Inspection service'],
      serviceAreas: [opportunity.market, `Top suburbs around ${city}`, 'Only areas the team can service quickly'],
      profileTasks: [
        'Confirm business name, license, insurance, phone, and hours.',
        'Add recent job photos and team photos.',
        'Turn on the service categories that match this opportunity.',
        'Request reviews from happy customers every week.',
        'Keep profile hours aligned with real call-answering hours.'
      ],
      leadRules: [
        'Answer new leads live when possible.',
        'Call missed leads back within 5 minutes.',
        'Use the JobLeak call script to qualify urgency and location.',
        'Mark junk leads quickly and track booked jobs separately.',
        'Increase budget only after lead quality is confirmed.'
      ]
    },
    reactivation: {
      audience: opportunity.audience,
      emailSubject: `${city} ${service} alert: ${opportunity.offer}`,
      emailBody: `Hi,\n\nThis week we are seeing a strong reason to focus on ${service.toLowerCase()} in ${opportunity.market}: ${opportunity.signal.toLowerCase()}.\n\nIf you need help, we are offering: ${opportunity.offer}.\n\nCall us or reply to this email to request a service time.`,
      sms: `${service} alert: ${opportunity.offer} in ${city}. If you need help, reply SERVICE to request a time. Opted-in customers only.`,
      facebookPost: `${city} homeowners: ${opportunity.signal}. If you are dealing with ${service.toLowerCase()} issues, our team is offering ${opportunity.offer.toLowerCase()}. Message us today to request service.`
    },
    callScript: [
      `Thanks for calling. Are you calling about ${service.toLowerCase()} today?`,
      `We are seeing more demand around ${opportunity.signal.toLowerCase()} this week, so I can check our next available time for you.`,
      'What city or neighborhood are you in?',
      'Is this urgent today, or are you trying to schedule for later this week?',
      'What is the best phone number and address for the service visit?'
    ],
    checklist: [
      `Confirm the service area for ${opportunity.market}.`,
      `Use the offer: ${opportunity.offer}.`,
      'Create or update the landing page headline and call button.',
      'Add Google Search keywords and negative keywords.',
      'Turn on call tracking before launching.',
      'Set a starter budget cap and review daily.',
      'Train the office team with the call script.',
      'Send SMS only to opted-in customers.',
      'Track calls, booked jobs, and revenue from the campaign.',
      'Mark the result in JobLeak so the next campaign improves.'
    ]
  };
}

function campaignToText(pack: CampaignPack) {
  return [
    `JOBLEAK CAMPAIGN PACK`,
    `Campaign: ${pack.name}`,
    `Market: ${pack.opportunity.market}`,
    `Service: ${pack.opportunity.service}`,
    `Recommended launch: ${launchTypeLabels[pack.opportunity.launchType]}`,
    `Signal: ${pack.opportunity.signal}`,
    `Why it matters: ${pack.opportunity.why}`,
    `Offer: ${pack.offer}`,
    `Budget: ${pack.budget}`,
    '',
    `Landing headline: ${pack.landingHeadline}`,
    `Landing subheadline: ${pack.landingSubheadline}`,
    `CTA: ${pack.cta}`,
    '',
    'GOOGLE SEARCH KEYWORDS',
    ...pack.google.keywords.map((x) => `- ${x}`),
    '',
    'NEGATIVE KEYWORDS',
    ...pack.google.negatives.map((x) => `- ${x}`),
    '',
    'AD HEADLINES',
    ...pack.google.headlines.map((x) => `- ${x}`),
    '',
    'AD DESCRIPTIONS',
    ...pack.google.descriptions.map((x) => `- ${x}`),
    '',
    'EMAIL',
    `Subject: ${pack.reactivation.emailSubject}`,
    pack.reactivation.emailBody,
    '',
    'SMS',
    pack.reactivation.sms,
    '',
    'CALL SCRIPT',
    ...pack.callScript.map((x) => `- ${x}`),
    '',
    'CHECKLIST',
    ...pack.checklist.map((x) => `- ${x}`)
  ].join('\n');
}

function cleanCity(market: string) {
  return market.split(',')[0].trim() || market;
}

function shortLaunchLabel(type: LaunchType) {
  if (type === 'google-search') return 'Google Search Campaign';
  if (type === 'lsa') return 'Local Services Pack';
  return 'Reactivation Campaign';
}

export default App;
