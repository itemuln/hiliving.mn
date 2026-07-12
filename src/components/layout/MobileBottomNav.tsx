import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Grid2X2, Home, Menu, ShoppingCart, UserRound, X } from 'lucide-react'

const navItems = [
  { label: 'Эхлэл', icon: Home, href: '#top' },
  { label: 'Ангилал', icon: Grid2X2, href: '#categories' },
  { label: 'Сагс', icon: ShoppingCart, href: '#cart', badge: 2 },
  { label: 'Нэвтрэх', icon: UserRound, href: '#login' },
]

export function MobileBottomNav() {
  const [isMoreOpen, setIsMoreOpen] = useState(false)
  const shouldReduceMotion = useReducedMotion()

  useEffect(() => {
    if (!isMoreOpen) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsMoreOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isMoreOpen])

  return (
    <>
      <nav aria-label="Гар утасны цэс" className="fixed inset-x-0 bottom-0 z-50 border-t border-neutral-200 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_22px_rgba(0,0,0,0.05)] backdrop-blur md:hidden">
        <div className="grid h-[70px] grid-cols-5">
          {navItems.map(({ label, icon: Icon, href, badge }, index) => (
            <a key={label} href={href} className={`relative flex min-w-0 flex-col items-center justify-center gap-1 text-[10px] transition-all duration-300 ease-out ${index === 0 ? 'text-brand-500' : 'text-neutral-400 hover:text-brand-500'}`}>
              <span className={index === 0 ? 'rounded-full bg-brand-50 p-1.5' : 'p-1.5'}>
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              {badge ? <span className="absolute left-1/2 top-1 ml-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-500 px-1 text-[9px] text-white">{badge}</span> : null}
              <span className="truncate">{label}</span>
            </a>
          ))}
          <button type="button" onClick={() => setIsMoreOpen(true)} className="flex min-w-0 flex-col items-center justify-center gap-1 text-[10px] text-neutral-400 transition-all duration-300 ease-out hover:text-brand-500" aria-haspopup="dialog" aria-expanded={isMoreOpen}>
            <Menu className="h-5 w-5" aria-hidden="true" />
            <span>Бусад</span>
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {isMoreOpen ? (
          <div className="fixed inset-0 z-[60] md:hidden">
            <motion.button
              type="button"
              aria-label="Цэс хаах"
              className="absolute inset-0 h-full w-full bg-black/30"
              onClick={() => setIsMoreOpen(false)}
              initial={shouldReduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            />
            <motion.aside
              role="dialog"
              aria-modal="true"
              aria-labelledby="more-menu-title"
              className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-white p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-soft"
              initial={shouldReduceMotion ? false : { y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
            >
              <div className="mb-5 flex items-center justify-between">
                <h2 id="more-menu-title" className="text-lg font-medium text-neutral-700">Нэмэлт цэс</h2>
                <button type="button" autoFocus onClick={() => setIsMoreOpen(false)} aria-label="Хаах" className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-neutral-500 transition-all duration-300 ease-out hover:bg-brand-50 hover:text-brand-500">
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {['Hiliving MGL', 'Брэндүүд', 'Мэдээлэл', 'Холбоо барих'].map((item) => (
                  <a key={item} href={`#${item.toLowerCase().replace(/ /g, '-')}`} onClick={() => setIsMoreOpen(false)} className="rounded-xl border border-neutral-200 px-4 py-3 text-sm text-neutral-600 transition-all duration-300 ease-out hover:border-brand-400 hover:bg-brand-50 hover:text-brand-500">
                    {item}
                  </a>
                ))}
              </div>
            </motion.aside>
          </div>
        ) : null}
      </AnimatePresence>
    </>
  )
}
