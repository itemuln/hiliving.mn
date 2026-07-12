import { Container } from './Container'
import { navigation } from '../../data/homeData'

export function Header() {
  return (
    <header className="relative z-30 border-b border-neutral-100 bg-white">
      <Container className="flex h-[72px] items-center justify-between md:h-[128px] md:items-end">
        <a href="#top" className="mb-0 shrink-0 md:mb-6" aria-label="Hiliving Mongolia нүүр хуудас">
          <img src="/hiLivingLogo.svg" alt="Hiliving Mongolia" className="h-auto w-[190px] md:w-[250px]" />
        </a>

        <div className="hidden flex-1 md:block">
          <div className="mb-7 flex items-center justify-end gap-5 text-xs text-neutral-600">
            <a href="#login" className="transition-all duration-300 ease-out hover:text-brand-500">Нэвтрэх</a>
            <a href="#register" className="transition-all duration-300 ease-out hover:text-brand-500">Бүртгүүлэх</a>
          </div>
          <div className="flex items-end justify-end gap-3">
            <nav aria-label="Үндсэн цэс" className="flex items-end gap-1">
              {navigation.map((item, index) => (
                <a
                  key={item}
                  href={index === 0 ? '#products' : `#${item.toLowerCase().replace(/ /g, '-')}`}
                  className={`rounded-t-lg px-5 py-3 text-sm transition-all duration-300 ease-out lg:px-7 ${
                    index === 0
                      ? 'bg-brand-500 text-white hover:bg-brand-600'
                      : 'bg-neutral-100 text-neutral-500 hover:bg-brand-50 hover:text-brand-500'
                  }`}>
                  {item}
                </a>
              ))}
            </nav>
            <form className="mb-2 ml-4 flex w-[200px] items-center rounded-full border border-neutral-300 px-4 py-2 focus-within:border-brand-400 lg:w-[240px]" role="search">
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
