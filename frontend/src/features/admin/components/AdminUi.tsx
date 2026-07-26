import { useEffect, useId, useRef, type ReactNode } from 'react';
import { AlertTriangle, LoaderCircle, Search, X } from 'lucide-react';

export const panel =
  'rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,.04),0_10px_30px_rgba(15,23,42,.04)]';
export const input =
  'min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-brand-400 focus:ring-2 focus:ring-brand-100 disabled:cursor-not-allowed disabled:bg-slate-100';
export const primaryButton =
  'inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-500 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-brand-600 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60';
export const secondaryButton =
  'inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60';
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
    <div
      className={`${panel} flex min-h-52 items-center justify-center`}
      role="status"
      aria-label="Уншиж байна"
    >
      <LoaderCircle className="animate-spin text-brand-500" />
    </div>
  );
}
export function ErrorPanel({ retry }: { retry: () => void }) {
  return (
    <div role="alert" className={`${panel} p-8 text-center`}>
      <AlertTriangle className="mx-auto text-amber-500" />
      <h2 className="mt-3 font-bold">Мэдээллийг уншиж чадсангүй</h2>
      <p className="mt-1 text-sm text-slate-500">
        Нэвтрэх хугацаа дууссан эсвэл үйлчилгээ түр боломжгүй байж магадгүй.
      </p>
      <button className={`${secondaryButton} mt-4`} onClick={retry}>
        Дахин оролдох
      </button>
    </div>
  );
}
export function EmptyPanel({ title = 'Одоогоор мэдээлэл алга' }: { title?: string }) {
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
  const titleId = useId();
  const closeButton = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButton.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current();
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/60" onMouseDown={onClose} aria-hidden="true" />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/60 bg-white p-5 shadow-2xl sm:p-7"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 id={titleId} className="text-xl font-black">
            {title}
          </h2>
          <button
            ref={closeButton}
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-slate-100"
            aria-label="Хаах"
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}

export function SearchInput({
  value,
  onChange,
  label,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder: string;
}) {
  return (
    <label className="relative block min-w-0">
      <Search className="pointer-events-none absolute left-3 top-3.5 text-slate-400" size={18} />
      <input
        type="search"
        className={`${input} pl-10`}
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}

export function Pagination({
  page,
  totalPages,
  first,
  last,
  totalElements,
  noun,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  totalElements: number;
  noun: string;
  onPageChange: (page: number) => void;
}) {
  return (
    <div className="flex flex-col gap-3 border-t border-slate-100 p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
      <span className="text-slate-500">
        Нийт {totalElements} {noun}
      </span>
      <div className="flex items-center justify-between gap-2 sm:justify-end">
        <button
          type="button"
          className={secondaryButton}
          disabled={first}
          onClick={() => onPageChange(page - 1)}
        >
          Өмнөх
        </button>
        <span className="min-w-16 px-2 py-2 text-center font-semibold">
          {page + 1} / {Math.max(totalPages, 1)}
        </span>
        <button
          type="button"
          className={secondaryButton}
          disabled={last}
          onClick={() => onPageChange(page + 1)}
        >
          Дараах
        </button>
      </div>
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
