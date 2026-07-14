import { Fragment } from 'react'
import { Link } from 'react-router-dom'
import type { Brand } from '../../data/brands'

interface MobileBrandSelectorProps {
  brands: Brand[]
  activeSlug: string
}

export function MobileBrandSelector({ brands, activeSlug }: Readonly<MobileBrandSelectorProps>) {
  const items = [{ slug: 'all', name: 'БҮГД' }, ...brands]

  return (
    <nav aria-label="Брэнд сонгох" className="-mx-3 mb-7">
      <div className="flex flex-wrap items-center gap-y-1 text-[13px] leading-5 sm:text-sm">
        {items.map((item, index) => {
          const isActive = item.slug === activeSlug
          const href = item.slug === 'all' ? '/brands' : `/brands/${item.slug}`

          return (
            <Fragment key={item.slug}>
              {index > 0 ? <span aria-hidden="true" className="mx-1.5 text-neutral-300">|</span> : null}
              <Link
                to={href}
                aria-current={isActive ? 'page' : undefined}
                className={`py-1 transition-colors duration-200 hover:text-brand-500 ${
                  isActive ? 'font-semibold text-brand-500' : 'text-neutral-400'
                }`}
              >
                {item.name}
                {isActive ? <span className="sr-only"> (сонгогдсон)</span> : null}
              </Link>
            </Fragment>
          )
        })}
      </div>
    </nav>
  )
}
