import useEmblaCarousel from 'embla-carousel-react';
import { useProducts } from '../../features/catalog/useCatalog';
import { CatalogEmptyState } from '../catalog/CatalogEmptyState';
import { CatalogErrorState } from '../catalog/CatalogErrorState';
import { ProductGridSkeleton } from '../catalog/ProductGridSkeleton';
import { Container } from '../layout/Container';
import { CarouselControls } from '../ui/CarouselControls';
import { ProductCard } from '../ui/ProductCard';
import { SectionReveal } from '../ui/SectionReveal';
import { SectionTitle } from '../ui/SectionTitle';

export function ProductSection() {
  const resource = useProducts({ page: 0, size: 10, featured: true, sort: 'newest' });
  const products = resource.data?.items ?? [];
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: 'start', slidesToScroll: 5 });

  return (
    <SectionReveal id="products" className="pb-14 pt-4 md:pb-20 md:pt-8">
      <Container>
        <SectionTitle accent="Онцлох" suffix="бүтээгдэхүүн" />

        {resource.status === 'loading' ? (
          <ProductGridSkeleton count={10} className="mt-8 md:mt-12 md:grid-cols-5 xl:grid-cols-5" />
        ) : resource.status === 'error' ? (
          <div className="mt-8 md:mt-12">
            <CatalogErrorState compact onRetry={resource.retry} />
          </div>
        ) : products.length === 0 ? (
          <div className="mt-8 md:mt-12">
            <CatalogEmptyState
              compact
              title="Онцлох бүтээгдэхүүн одоогоор байхгүй байна"
              description="Шинэ бүтээгдэхүүн нэмэгдэх үед энд харагдана."
            />
          </div>
        ) : (
          <>
            <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 md:hidden">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
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
              {products.length > 5 ? (
                <div className="pointer-events-none absolute inset-y-0 -left-2 -right-2 flex items-center justify-between lg:-left-12 lg:-right-12">
                  <CarouselControls
                    variant="outside"
                    onPrevious={() => emblaApi?.scrollPrev()}
                    onNext={() => emblaApi?.scrollNext()}
                  />
                </div>
              ) : null}
            </div>
          </>
        )}
      </Container>
    </SectionReveal>
  );
}
