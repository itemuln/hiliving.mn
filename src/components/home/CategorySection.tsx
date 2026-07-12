import type { LucideIcon } from 'lucide-react'
import { BookOpenText, CookingPot, House, LampDesk, Pill, Shirt, ShoppingBasket, Sparkles, SprayCan } from 'lucide-react'
import { categories, type CategoryIcon } from '../../data/homeData'
import { Container } from '../layout/Container'
import { SectionReveal } from '../ui/SectionReveal'
import { SectionTitle } from '../ui/SectionTitle'

const iconMap: Record<CategoryIcon, LucideIcon> = {
  health: Pill,
  beauty: Sparkles,
  electric: LampDesk,
  home: House,
  kitchen: CookingPot,
  daily: SprayCan,
  fashion: Shirt,
  food: ShoppingBasket,
  other: BookOpenText,
}

export function CategorySection() {
  return (
    <SectionReveal id="categories" className="py-12 md:py-16">
      <Container>
        <SectionTitle accent="Барааны" suffix="төрлүүд" />
        <div className="mt-9 grid grid-cols-3 gap-x-3 gap-y-7 md:mt-12 md:grid-cols-9 md:gap-3">
          {categories.map((category) => {
            const Icon = iconMap[category.icon]
            return (
              <a key={category.id} href={`#category-${category.id}`} className="group flex min-w-0 flex-col items-center gap-3 rounded-xl py-2 text-center transition-all duration-300 ease-out hover:bg-brand-50 motion-reduce:transform-none">
                <span className="relative flex h-16 w-16 items-center justify-center text-neutral-400 md:h-20 md:w-20">
                  <Icon strokeWidth={1.5} className="h-12 w-12 transition-all duration-300 ease-out group-hover:-translate-y-1 group-hover:text-brand-500 motion-reduce:transform-none md:h-14 md:w-14" aria-hidden="true" />
                  <span className="absolute right-2 top-1 h-2.5 w-2.5 rounded-full bg-brand-500 md:right-3" />
                </span>
                <span className="text-xs text-neutral-400 transition-colors duration-300 ease-out group-hover:text-brand-500 md:text-sm">{category.label}</span>
              </a>
            )
          })}
        </div>
      </Container>
    </SectionReveal>
  )
}
