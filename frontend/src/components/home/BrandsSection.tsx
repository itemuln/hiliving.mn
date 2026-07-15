import { Link } from 'react-router-dom'
import { brands } from '../../data/homeData'
import { Container } from '../layout/Container'
import { SectionReveal } from '../ui/SectionReveal'
import { SectionTitle } from '../ui/SectionTitle'

export function BrandsSection() {
  return (
    <SectionReveal id="брэндүүд" className="pb-8 pt-4 md:pb-14 md:pt-6">
      <Container>
        <SectionTitle accent="Брэндүүд" />
        <div className="mt-8 grid grid-cols-4 gap-2 sm:gap-3 md:mt-10 md:grid-cols-5 md:gap-5">
          {brands.map((brand, index) => (
            <Link
              key={brand.id}  
              to={`/brands/${brand.name.toLowerCase()}`}
              className={`flex aspect-[2.15/1] min-w-0 items-center justify-center rounded-md border border-neutral-300 bg-white px-2 text-center text-[9px] font-medium tracking-[0.08em] text-neutral-400 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-brand-400 hover:text-brand-500 hover:shadow-sm motion-reduce:transform-none sm:text-xs md:text-xl ${index >= 5 ? 'md:hidden' : ''}`}
            >
              <span className="truncate">{brand.name}</span>
            </Link>
          ))}
        </div>
      </Container>
    </SectionReveal>
  )
}
