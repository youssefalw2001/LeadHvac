import type { HTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

type Props = HTMLAttributes<HTMLSpanElement> & {
  tone?: 'blue' | 'green' | 'orange' | 'slate';
};

const toneClass = {
  blue: 'bg-blue-50 text-blue-700 border-blue-100',
  green: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  orange: 'bg-orange-50 text-orange-700 border-orange-100',
  slate: 'bg-slate-50 text-slate-700 border-slate-200'
};

export function Badge({ className, tone = 'blue', ...props }: Props) {
  return <span className={cn('inline-flex items-center rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.14em]', toneClass[tone], className)} {...props} />;
}
