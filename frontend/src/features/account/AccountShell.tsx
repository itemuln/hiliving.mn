import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { Footer } from '../../components/layout/Footer'
import { Header } from '../../components/layout/Header'
import { MobileBottomNav } from '../../components/layout/MobileBottomNav'

const links = [['/account', 'Тойм'], ['/account/profile', 'Хувийн мэдээлэл'], ['/account/addresses', 'Хүргэлтийн хаяг'], ['/account/security', 'Нууцлал']] as const

export function AccountShell({ title, children }: { title: string; children: ReactNode }) {
  return <div className="min-h-screen bg-neutral-50 pb-20 md:pb-0">
    <Header />
    <main className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-8 sm:px-6 md:grid-cols-[230px_minmax(0,1fr)] md:py-12">
      <aside className="min-w-0 rounded-2xl border border-neutral-200 bg-white p-3 shadow-sm md:self-start">
        <nav aria-label="Миний бүртгэл" className="flex gap-2 overflow-x-auto md:flex-col md:overflow-visible">
          {links.map(([to, label]) => <NavLink key={to} to={to} end={to === '/account'} className={({ isActive }) => `whitespace-nowrap rounded-xl px-4 py-3 text-sm ${isActive ? 'bg-brand-50 font-medium text-brand-600' : 'text-neutral-600 hover:bg-neutral-50'}`}>{label}</NavLink>)}
        </nav>
      </aside>
      <section className="min-w-0 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-7">
        <h1 className="text-2xl font-semibold text-neutral-800">{title}</h1>
        <div className="mt-6">{children}</div>
      </section>
    </main>
    <Footer /><MobileBottomNav />
  </div>
}
