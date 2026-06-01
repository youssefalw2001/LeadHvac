import type { ReactNode } from 'react';

export function FloatingInsightCard({
  label,
  value,
  detail,
  icon,
  className = ''
}: {
  label: string;
  value: string;
  detail: string;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border border-white/70 bg-white/95 p-4 shadow-premium backdrop-blur ${className}`}>
      <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-slate-500">
        {icon}
        {label}
      </div>
      <strong className="block text-2xl font-black tracking-[-0.05em] text-jobleak-blue">{value}</strong>
      <p className="mt-1 text-sm font-semibold text-slate-600">{detail}</p>
    </div>
  );
}
