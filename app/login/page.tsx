import { ArrowLeft, BarChart3, Check, LockKeyhole, ShieldCheck, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { BrandLogo } from '@/components/brand-logo';

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <BrandLogo />
        <Link href="/" className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-ink shadow-sm">
          <ArrowLeft className="h-4 w-4" /> Back home
        </Link>
      </header>

      <section className="mx-auto grid max-w-7xl items-center gap-10 px-6 pb-20 pt-8 lg:grid-cols-[1fr_0.9fr]">
        <div className="rounded-[2rem] bg-ink p-8 text-white shadow-soft md:p-12">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-black text-white">
            <ShieldCheck className="h-4 w-4 text-emerald" /> Client portal preview
          </div>
          <h1 className="max-w-3xl text-5xl font-black tracking-tight">Your local growth command center.</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-white/70">
            Login will give clients access to scans, competitor reports, review gaps, lead captures, and monthly action plans.
          </p>

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {[
              ['Weekly scans', 'See new missed searches and competitor changes.'],
              ['Lead inbox', 'Track quote requests, callbacks, and widget submissions.'],
              ['Review goals', 'Monitor review gap progress against top competitors.'],
              ['Action plan', 'Know what to fix this month to win more local jobs.']
            ].map(([title, text]) => (
              <div key={title} className="rounded-3xl bg-white/10 p-5">
                <Check className="mb-4 h-5 w-5 text-emerald" />
                <div className="text-lg font-black">{title}</div>
                <p className="mt-2 text-sm leading-6 text-white/60">{text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-100 bg-white p-8 shadow-soft">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-50 text-brand">
            <LockKeyhole className="h-8 w-8" />
          </div>
          <h2 className="text-center text-3xl font-black text-ink">Client Login</h2>
          <p className="mt-3 text-center font-medium leading-7 text-muted">
            Portal access is coming next. For now, use this page as a polished placeholder for demos.
          </p>

          <form className="mt-8 space-y-4">
            <label className="block text-sm font-black text-ink">
              Email
              <input className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand" placeholder="owner@company.com" />
            </label>
            <label className="block text-sm font-black text-ink">
              Password
              <input type="password" className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand" placeholder="••••••••" />
            </label>
            <button type="button" className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand px-6 py-4 font-black text-white shadow-card">
              View Demo Portal <Sparkles className="h-5 w-5" />
            </button>
          </form>

          <div className="mt-8 rounded-3xl bg-slate-50 p-5">
            <div className="mb-4 flex items-center gap-3 text-sm font-black text-ink"><BarChart3 className="h-5 w-5 text-brand" /> Demo portal snapshot</div>
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                ['12', 'Leaks'],
                ['17', 'Leads'],
                ['68', 'Score']
              ].map(([value, label]) => (
                <div key={label} className="rounded-2xl bg-white p-4 shadow-sm">
                  <div className="text-2xl font-black text-ink">{value}</div>
                  <div className="text-xs font-black uppercase tracking-widest text-muted">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
