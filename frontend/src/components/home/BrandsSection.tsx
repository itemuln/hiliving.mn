import { Link } from 'react-router-dom';
import { useBrands } from '../../features/catalog/useCatalog';
import { CatalogEmptyState } from '../catalog/CatalogEmptyState';
import { CatalogErrorState } from '../catalog/CatalogErrorState';
import { Container } from '../layout/Container';
import { SectionReveal } from '../ui/SectionReveal';
import { SectionTitle } from '../ui/SectionTitle';

export function BrandsSection() {
  const resource = useBrands();

  return (
    <SectionReveal id="брэндүүд" className="pb-8 pt-4 md:pb-14 md:pt-6">
      <Container>
        <SectionTitle accent="Брэндүүд" />
        <div className="mt-8 md:mt-10">
          {resource.status === 'loading' ? (
            <div
              aria-label="Брэнд ачаалж байна"
              role="status"
              className="grid grid-cols-4 gap-2 sm:gap-3 md:grid-cols-5 md:gap-5"
            >
              {Array.from({ length: 10 }, (_, index) => (
                <div
                  key={index}
                  aria-hidden="true"
                  className="aspect-[2.15/1] animate-pulse rounded-md bg-neutral-100"
                />
              ))}
              <span className="sr-only">Брэндийн мэдээлэл ачаалж байна.</span>
            </div>
          ) : resource.status === 'error' ? (
            <CatalogErrorState compact onRetry={resource.retry} />
          ) : resource.data && resource.data.length > 0 ? (
            <div className="grid grid-cols-4 gap-2 sm:gap-3 md:grid-cols-5 md:gap-5">
              {resource.data.map((brand, index) => (
                <Link
                  key={brand.id}
                  to={`/brands/${brand.slug}`}
                  className={`flex aspect-[2.15/1] min-w-0 items-center justify-center rounded-md border border-neutral-300 bg-white px-2 text-center text-[9px] font-medium tracking-[0.08em] text-neutral-400 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-brand-400 hover:text-brand-500 hover:shadow-sm motion-reduce:transform-none sm:text-xs md:text-xl ${
                    index >= 5 ? 'md:hidden' : ''
                  }`}
                >
                  {brand.logoUrl ? (
                    <img
                      src={brand.logoUrl}
                      alt={brand.name}
                      loading="lazy"
                      className="max-h-[70%] max-w-[80%] object-contain"
                    />
                  ) : (
                    <span className="truncate">{brand.name}</span>
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <CatalogEmptyState
              compact
              title="Брэнд одоогоор байхгүй байна"
              description="Каталогийн брэнд нэмэгдэх үед энд харагдана."
            />
          )}
        </div>
      </Container>
    </SectionReveal>
  );
}
