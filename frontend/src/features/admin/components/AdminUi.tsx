import type { ReactNode } from 'react';
import { AlertTriangle, LoaderCircle, X } from 'lucide-react';

export const panel = 'rounded-2xl border border-slate-200 bg-white shadow-sm';
export const input =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100 disabled:bg-slate-100';
export const primaryButton =
  'inline-flex min-h-10 items-center justify-center rounded-xl bg-brand-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60';
export const secondaryButton =
  'inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60';
export function Field({
  label,
  children,
  wide = false,
  hint,
}: {
  label: string;
  children: ReactNode;
  wide?: boolean;
  hint?: string;
}) {
  return (
    <label className={wide ? 'sm:col-span-2' : ''}>
      <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-400">{hint}</span>}
    </label>
  );
}
export function StatusBadge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: 'success' | 'warning' | 'danger' | 'neutral';
}) {
  const tones = {
    success: 'bg-emerald-50 text-emerald-700',
    warning: 'bg-amber-50 text-amber-700',
    danger: 'bg-rose-50 text-rose-700',
    neutral: 'bg-slate-100 text-slate-600',
  };
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${tones[tone]}`}>
      {children}
    </span>
  );
}
export function LoadingPanel() {
  return (
    <div className={`${panel} flex min-h-52 items-center justify-center`}>
      <LoaderCircle className="animate-spin text-brand-500" aria-label="Loading" />
    </div>
  );
}
export function ErrorPanel({ retry }: { retry: () => void }) {
  return (
    <div role="alert" className={`${panel} p-8 text-center`}>
      <AlertTriangle className="mx-auto text-amber-500" />
      <h2 className="mt-3 font-bold">This data could not be loaded</h2>
      <p className="mt-1 text-sm text-slate-500">
        Your session may have expired or the service is unavailable.
      </p>
      <button className={`${secondaryButton} mt-4`} onClick={retry}>
        Retry
      </button>
    </div>
  );
}
export function EmptyPanel({ title = 'No records yet' }: { title?: string }) {
  return <div className={`${panel} p-10 text-center text-sm text-slate-500`}>{title}</div>;
}
export function Dialog({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <button
        className="absolute inset-0 bg-slate-950/60"
        onClick={onClose}
        aria-label="Close dialog"
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-7"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-black">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-slate-100"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}
export function ErrorNotice({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
    >
      {message}
    </div>
  );
}
