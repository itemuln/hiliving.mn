import useEmblaCarousel from 'embla-carousel-react'
import { products } from '../../data/homeData'
import { Container } from '../layout/Container'
import { CarouselControls } from '../ui/CarouselControls'
import { ProductCard } from '../ui/ProductCard'
import { SectionReveal } from '../ui/SectionReveal'
import { SectionTitle } from '../ui/SectionTitle'

export function ProductSection() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: 'start', slidesToScroll: 5 })

  return (
    <SectionReveal id="products" className="pb-14 pt-4 md:pb-20 md:pt-8">
      <Container>
        <SectionTitle accent="Шилдэг борлуулалттай" suffix="бүтээгдэхүүн" />

        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 md:hidden">
          {products.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>

        <div className="relative mt-12 hidden md:block">
          <div ref={emblaRef} className="overflow-hidden px-1 py-5">
            <div className="-ml-5 flex touch-pan-y">
              {products.map((product) => (
                <div key={product.id} className="min-w-0 flex-[0_0_20%] pl-5">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </div>
          <div className="pointer-events-none absolute inset-y-0 -left-2 -right-2 flex items-center justify-between lg:-left-12 lg:-right-12">
            <CarouselControls variant="outside" onPrevious={() => emblaApi?.scrollPrev()} onNext={() => emblaApi?.scrollNext()} />
          </div>
        </div>
      </Container>
    </SectionReveal>
  )
}
