import { Link, useLocation } from 'react-router-dom'
import { Container } from './Container'

const navigation = [
  { label: 'Дэлгүүр хэсэх', to: '/categories/electronics', section: 'categories' },
  { label: 'Hiliving MGL', to: '/#hiliving-mgl', section: 'about' },
  { label: 'Брэндүүд', to: '/brands', section: 'brands' },
  { label: 'Мэдээлэл', to: '/#news', section: 'news' },
  { label: 'Холбоо барих', to: '/#contact', section: 'contact' },
] as const

export function Header() {
  const { pathname } = useLocation()

  return (
    <header className="relative z-30 border-b border-neutral-100 bg-white">
      <Container className="flex h-[72px] items-center justify-between md:h-[128px] md:items-end">
        <Link to="/" className="mb-0 shrink-0 md:mb-6" aria-label="Hiliving Mongolia нүүр хуудас">
          <img src="/hiLivingLogo.svg" alt="Hiliving Mongolia" loading="eager" decoding="async" className="h-auto w-[190px] md:w-[190px] lg:w-[220px] xl:w-[250px]" />
        </Link>

        <div className="hidden flex-1 md:block">
          <div className="mb-7 flex items-center justify-end gap-5 text-xs text-neutral-600">
            {/* to be implemented */}
            <a href="#login" className="transition-all duration-300 ease-out hover:text-brand-500">Нэвтрэх</a>
            <a href="#register" className="transition-all duration-300 ease-out hover:text-brand-500">Бүртгүүлэх</a>
          </div>
          <div className="flex items-end justify-end gap-3">
            <nav aria-label="Үндсэн цэс" className="flex items-end gap-1">
              {navigation.map((item) => {
                const isActive =
                  (item.section === 'categories' && (pathname === '/' || pathname.startsWith('/categories'))) ||
                  (item.section === 'brands' && pathname.startsWith('/brands'))

                return (
                  <Link
                    key={item.label}
                    to={item.to}
                    aria-current={isActive ? 'page' : undefined}
                    className={`whitespace-nowrap rounded-t-lg px-3 py-3 text-[11px] transition-all duration-300 ease-out lg:px-4 lg:text-sm xl:px-5 ${
                      isActive
                        ? 'bg-brand-500 text-white hover:bg-brand-600'
                        : 'bg-neutral-100 text-neutral-500 hover:bg-brand-50 hover:text-brand-500'
                    }`}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </nav>
            <form onSubmit={(event) => event.preventDefault()} className="mb-2 ml-4 hidden w-[200px] items-center rounded-full border border-neutral-300 px-4 py-2 focus-within:border-brand-400 xl:flex xl:w-[240px]" role="search">
              <label htmlFor="desktop-search" className="sr-only">Бүтээгдэхүүн хайх</label>
              <input id="desktop-search" type="search" placeholder="Хайх" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-neutral-400" />
              <button type="submit" aria-label="Хайх" className="ml-2 text-neutral-600 transition-all duration-300 ease-out hover:text-brand-500">
                <img src="/icons/search.svg" alt="" aria-hidden="true" className="h-5 w-5" />
              </button>
            </form>
          </div>
        </div>
      </Container>
    </header>
  )
}
