import { Link } from 'react-router-dom'

interface SideBar {
  slug: string
  name: string
  icon?: string
}

interface SidebarProps {
  readonly items: readonly SideBar[]
  readonly activeSlug: string
  readonly basePath: string
  readonly variant: 'brand' | 'category'
}

export function Sidebar({ items, activeSlug, basePath, variant }: SidebarProps) {
  return (
    <nav aria-label={variant === 'brand' ? 'Брэнд сонгох' : 'Ангилал сонгох'}>
      <ul className="space-y-1">
        {items.map((item) => {
          const isActive = item.slug === activeSlug
          const href = item.slug === 'all' ? basePath : `${basePath}/${item.slug}`

          return (
            <li key={item.slug}> 
              <Link
                to={href}
                aria-current={isActive ? 'page' : undefined}
                className={`flex min-h-11 w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors duration-200 ${
                  isActive
                    ? 'bg-brand-500 font-medium text-white'
                    : 'text-neutral-400 hover:bg-brand-50 hover:text-brand-500'
                }`}
              >
                {item.icon ? (
                  <span className={`flex h-8 w-9 shrink-0 items-center justify-center ${isActive ? 'bg-white/90' : ''}`}>
                    <img src={item.icon} alt="" aria-hidden="true" className="max-h-7 max-w-8 object-contain" />
                  </span>
                ) : (
                  <span className={`flex h-8 w-9 shrink-0 items-center justify-center ${isActive ? 'bg-white/90' : ''}`}>
                    <img src="/icons/grid.svg" alt="" aria-hidden="true" className="max-h-7 max-w-8 object-contain" />
                  </span>
                )}
                <span>{item.name}</span>
                {isActive ? <span className="sr-only">(selected)</span> : null}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

