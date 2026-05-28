import { cn } from '../../lib/utils.js';

export function Badge({ className, ...props }) {
  return (
    <div
      className={cn('inline-flex items-center rounded-md border border-slate-200 px-2.5 py-0.5 text-xs font-semibold text-slate-900 dark:border-slate-700 dark:text-slate-100', className)}
      {...props}
    />
  );
}
