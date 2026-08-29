import type { ReactNode } from 'react';
import { WarningIcon } from './Icons';

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex min-h-48 items-center justify-center gap-3 text-sm text-[#4A3B2A] dark:text-[#E2D5C3]" role="status">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#EE8E28] border-t-transparent" aria-hidden="true" />
      {label}
    </div>
  );
}

export function ErrorBanner({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div
      className="flex items-start justify-between gap-4 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-950/40 dark:text-red-300"
      role="alert"
    >
      <span className="flex items-start gap-2">
        <WarningIcon className="mt-0.5 shrink-0" size={17} />
        {children}
      </span>
      {action}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-[#140D07]/15 bg-white/50 px-6 py-12 text-center dark:border-white/10 dark:bg-[#18130E]/50">
      <span
        className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-[#FFE49E]/75 text-[#B25A12] dark:bg-[#FCBA48]/15 dark:text-[#FCBA48]"
        aria-hidden="true"
      >
        {icon}
      </span>
      <h2 className="text-base font-semibold text-[#140D07] dark:text-white">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-[#4A3B2A] dark:text-[#E2D5C3]">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
