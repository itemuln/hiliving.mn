import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from './useAuth'

export function ProtectedRoute({ children, admin = false }: { children: ReactNode; admin?: boolean }) {
  const { state, hydrationError, refresh } = useAuth()
  const location = useLocation()
  if (state.status === 'loading' && hydrationError) return <div role="alert" className="mx-auto my-16 max-w-lg rounded-2xl border border-neutral-200 bg-white p-8 text-center"><p className="text-neutral-700">Бүртгэлийн төлөвийг шалгаж чадсангүй.</p><button onClick={() => void refresh()} className="mt-4 rounded-xl bg-brand-500 px-5 py-3 text-sm font-medium text-white">Дахин оролдох</button></div>
  if (state.status === 'loading') return <div className="min-h-[60vh] animate-pulse bg-neutral-50" aria-label="Бүртгэл шалгаж байна" />
  if (state.status === 'anonymous') {
    const returnTo = `${location.pathname}${location.search}${location.hash}`
    return <Navigate to={`/login?returnTo=${encodeURIComponent(returnTo)}`} replace />
  }
  if (admin && state.user.role !== 'ADMIN') return <Navigate to="/account" replace />
  return children
}
