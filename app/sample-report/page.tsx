import { ArrowLeft, Check, MapPin, Star, Target, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { BrandLogo } from '@/components/brand-logo';

const opportunities = [
  ['emergency roof repair Austin', 'High', 'Competitors have dedicated pages. You do not.'],
  ['storm damage roof repair Austin', 'High', 'Top competitors mention insurance and storm claims.'],
  ['roof leak repair near me', 'Medium', 'Review count and page relevance are weak versus leaders.'],
  ['same day roofing Austin', 'Medium', 'Missing from homepage and service pages.'],
  ['roof inspection Austin', 'Medium', 'Good low-friction lead offer opportunity.']
];

export default function SampleReportPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <BrandLogo />
        <Link href="/" className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-ink shadow-sm">
          <ArrowLeft className="h-4 w-4" /> Back home
        </Link>
      </header>

      <section className="mx-auto max-w-7xl px-6 pb-20 pt-8">
        <div className="rounded-[2rem] bg-ink p-8 text-white shadow-soft md:p-12">
          <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-black text-white">
                <MapPin className="h-4 w-4 text-emerald" /> Austin, TX sample report
              </div>
              <h1 className="max-w-3xl text-5xl font-black tracking-tight">Austin Pro Roofing is leaking local repair jobs.</h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-white/70">
                This sample shows how JobLeak turns local visibility, competitor gaps, and review gaps into a clear 30-day action plan.
              </p>
            </div>
            <div className="rounded-3xl bg-white p-6 text-ink">
              <div className="text-sm font-black text-muted">Visibility Score</div>
              <div className="mt-2 text-6xl font-black">68</div>
              <div className="font-bold text-emerald">+18 point upside identified</div>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-4">
          {[
            ['Missed Searches', '12', Target],
            ['Review Gap', '148', Star],
            ['Leads Captured', '17', TrendingUp],
            ['Fixes Prioritized', '8', Check]
          ].map(([label, value, Icon]) => (
            <div key={label as string} className="rounded-3xl border border-slate-100 bg-white p-6 shadow-card">
              <Icon className="h-7 w-7 text-brand" />
              <div className="mt-4 text-4xl font-black text-ink">{value as string}</div>
              <div className="text-sm font-bold text-muted">{label as string}</div>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[2rem] border border-slate-100 bg-white p-8 shadow-card">
            <h2 className="text-2xl font-black text-ink">Top missed local searches</h2>
            <div className="mt-6 overflow-hidden rounded-2xl border border-slate-100">
              {opportunities.map(([keyword, priority, reason], index) => (
                <div key={keyword} className="grid gap-4 border-b border-slate-100 p-5 last:border-b-0 md:grid-cols-[1.1fr_0.4fr_1.3fr]">
                  <div className="font-black text-ink">{index + 1}. {keyword}</div>
                  <div className="font-black text-brand">{priority}</div>
                  <div className="font-medium text-muted">{reason}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-100 bg-white p-8 shadow-card">
            <h2 className="text-2xl font-black text-ink">30-day action plan</h2>
            <div className="mt-6 space-y-4">
              {[
                'Create emergency roof repair page',
                'Add storm damage and insurance section',
                'Request 20 reviews from recent customers',
                'Add city/service CTAs above the fold',
                'Install lead capture widget'
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4 font-bold text-muted">
                  <Check className="mt-0.5 h-5 w-5 text-emerald" /> {item}
                </div>
              ))}
            </div>
            <Link href="/#scan" className="mt-6 flex justify-center rounded-2xl bg-brand px-5 py-4 font-black text-white">Get my free scan</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
