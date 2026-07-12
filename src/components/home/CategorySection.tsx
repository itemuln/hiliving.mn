import { categories, type CategoryIcon } from '../../data/homeData'
import { Container } from '../layout/Container'
import { SectionReveal } from '../ui/SectionReveal'
import { SectionTitle } from '../ui/SectionTitle'

const iconMap: Record<CategoryIcon, string> = {
  health: '/health.png',
  beauty: '/skincare.png',
  electric: '/air.png',
  home: '/tovel.png',
  kitchen: '/pan.png',
  daily: '/brush.png',
  fashion: '/shoe.png',
  food: '/ingredient.png',
  other: '/book.png',
}

export function CategorySection() {
  return (
    <SectionReveal id="categories" className="py-12 md:py-16">
      <Container>
        <SectionTitle accent="Барааны" suffix="төрлүүд" />
        <div className="mt-9 grid grid-cols-3 gap-x-3 gap-y-7 md:mt-12 md:grid-cols-9 md:gap-3">
          {categories.map((category) => {
            const iconSrc = iconMap[category.icon]
            return (
              <a key={category.id} href={`#category-${category.id}`} className="group flex min-w-0 flex-col items-center gap-3 rounded-xl py-2 text-center transition-all duration-300 ease-out hover:bg-brand-50 motion-reduce:transform-none"> 
              {/* to be changed for function call to category of product in items section*/}
                <span className="flex h-16 w-16 items-center justify-center p-3 md:h-20 md:w-20 md:p-4">
                  <img src={iconSrc} alt="" aria-hidden="true" className="h-full w-full object-contain" />
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
