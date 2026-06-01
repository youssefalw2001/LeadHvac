import type { HTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

type Props = HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: Props) {
  return <div className={cn('rounded-3xl border border-jobleak-border bg-white shadow-premium', className)} {...props} />;
}

export function CardHeader({ className, ...props }: Props) {
  return <div className={cn('p-6 pb-3', className)} {...props} />;
}

export function CardContent({ className, ...props }: Props) {
  return <div className={cn('p-6 pt-3', className)} {...props} />;
}
