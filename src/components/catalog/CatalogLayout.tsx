import type { ReactNode } from 'react'
import { Container } from '../layout/Container'

interface CatalogLayoutProps {
  sidebar: ReactNode
  mobileNavigation: ReactNode
  children: ReactNode
}

export function CatalogLayout({ sidebar, mobileNavigation, children }: CatalogLayoutProps) {
  return (
    <section className="py-8 md:py-12 lg:py-14">
      <Container>
        <div className="px-6 md:px-0">
          <div className="md:hidden">{mobileNavigation}</div>
          <div className="md:grid md:grid-cols-[190px_minmax(0,1fr)] md:items-start md:gap-8 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-12 xl:gap-16">
            <aside className="hidden md:block">{sidebar}</aside>
            <div className="min-w-0">{children}</div>
          </div>
        </div>
      </Container>
    </section>
  )
}

