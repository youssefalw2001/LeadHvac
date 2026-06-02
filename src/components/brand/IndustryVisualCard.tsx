import type { ReactNode } from 'react';
import { ArrowUpRight } from 'lucide-react';

export function IndustryVisualCard({
  title,
  description,
  metric,
  icon,
  onClick
}: {
  title: string;
  description: string;
  metric: string;
  icon?: ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative overflow-hidden rounded-3xl border border-jobleak-border bg-white p-0 text-left shadow-premium transition duration-200 hover:-translate-y-1 hover:shadow-executive"
    >
      <div className="relative min-h-[190px] overflow-hidden bg-gradient-to-br from-jobleak-ink via-jobleak-panel to-blue-950 p-6 text-white">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-jobleak-blue/25 blur-2xl" />
        <div className="absolute bottom-5 right-5 h-24 w-24 rounded-full border border-white/15" />
        <div className="absolute bottom-8 right-8 h-14 w-14 rounded-full border border-white/20" />
        <div className="relative z-10 flex h-full flex-col justify-between gap-10">
          <div className="flex items-center justify-between">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-jobleak-orange ring-1 ring-white/15">{icon}</span>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-white/75">Radar</span>
          </div>
          <div>
            <h3 className="text-3xl font-black tracking-[-0.06em]">{title}</h3>
            <p className="mt-2 max-w-[18rem] text-sm font-semibold leading-6 text-white/70">{description}</p>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between gap-4 p-5">
        <div>
          <span className="block text-xs font-black uppercase tracking-[0.14em] text-slate-500">Opportunity example</span>
          <strong className="mt-1 block text-base font-black text-jobleak-ink">{metric}</strong>
        </div>
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-50 text-jobleak-ink transition group-hover:bg-jobleak-ink group-hover:text-white">
          <ArrowUpRight size={18} />
        </span>
      </div>
    </button>
  );
}
