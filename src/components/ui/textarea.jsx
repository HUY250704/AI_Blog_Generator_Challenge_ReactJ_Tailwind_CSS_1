import { forwardRef } from 'react';
import { cn } from '../../lib/utils.js';

export const Textarea = forwardRef(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(
        'flex min-h-[160px] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-black dark:text-white dark:ring-offset-black dark:placeholder:text-slate-400 dark:focus-visible:ring-slate-300',
        className
      )}
      {...props}
    />
  );
});
