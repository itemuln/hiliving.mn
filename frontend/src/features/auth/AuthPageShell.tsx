import type { ReactNode } from 'react'
import { Footer } from '../../components/layout/Footer'
import { Header } from '../../components/layout/Header'
import { MobileBottomNav } from '../../components/layout/MobileBottomNav'

export function AuthPageShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return <div className="min-h-screen bg-neutral-50 pb-20 md:pb-0">
    <Header />
    <main className="mx-auto w-full max-w-lg px-4 py-10 sm:px-6 md:py-16">
      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-semibold text-neutral-800">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-neutral-500">{subtitle}</p>
        <div className="mt-7">{children}</div>
      </section>
    </main>
    <Footer />
    <MobileBottomNav />
  </div>
}

export const fieldClass = 'mt-1.5 w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100'
export const primaryButtonClass = 'w-full rounded-xl bg-brand-500 px-5 py-3 font-medium text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60'
