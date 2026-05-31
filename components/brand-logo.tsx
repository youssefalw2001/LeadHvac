import { Activity, ArrowUpRight } from 'lucide-react';

export function BrandLogo() {
  return (
    <div className="flex items-center gap-3">
      <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-ink text-white shadow-card">
        <Activity className="h-6 w-6 text-white" strokeWidth={2.5} />
        <ArrowUpRight className="absolute -right-1 -top-1 h-5 w-5 rounded-full bg-brand p-0.5 text-white" />
      </div>
      <div className="leading-none">
        <div className="text-2xl font-black tracking-tight text-ink">JobLeak</div>
        <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-brand">Growth Radar</div>
      </div>
    </div>
  );
}
