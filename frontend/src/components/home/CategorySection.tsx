import { Link } from 'react-router-dom'
import { useCategories } from '../../features/catalog/useCatalog'
import { CatalogEmptyState } from '../catalog/CatalogEmptyState'
import { CatalogErrorState } from '../catalog/CatalogErrorState'
import { Container } from '../layout/Container'
import { SectionReveal } from '../ui/SectionReveal'
import { SectionTitle } from '../ui/SectionTitle'

export function CategorySection() {
  const resource = useCategories()

  return (
    <SectionReveal id="categories" className="py-12 md:py-16">
      <Container>
        <SectionTitle accent="Барааны" suffix="төрлүүд" />
        <div className="mt-9 md:mt-12">
          {resource.status === 'loading' ? (
            <div aria-label="Ангилал ачаалж байна" role="status" className="grid grid-cols-3 gap-x-3 gap-y-7 md:grid-cols-9 md:gap-3">
              {Array.from({ length: 9 }, (_, index) => (
                <div key={index} aria-hidden="true" className="flex animate-pulse flex-col items-center gap-3 py-2">
                  <span className="h-16 w-16 rounded-full bg-neutral-100 md:h-20 md:w-20" />
                  <span className="h-3 w-16 rounded bg-neutral-100" />
                </div>
              ))}
              <span className="sr-only">Ангиллын мэдээлэл ачаалж байна.</span>
            </div>
          ) : resource.status === 'error' ? (
            <CatalogErrorState compact onRetry={resource.retry} />
          ) : resource.data && resource.data.length > 0 ? (
            <div className="grid grid-cols-3 gap-x-3 gap-y-7 md:grid-cols-9 md:gap-3">
              {resource.data.map((category) => (
                <Link key={category.id} to={`/categories/${category.slug}`} className="group flex min-w-0 flex-col items-center gap-3 rounded-xl py-2 text-center transition-all duration-300 ease-out hover:bg-brand-50 motion-reduce:transform-none">
                  <span className="flex h-16 w-16 items-center justify-center p-3 md:h-20 md:w-20 md:p-4">
                    <img src={category.iconUrl} alt="" aria-hidden="true" loading="lazy" decoding="async" className="h-full w-full object-contain" />
                  </span>
                  <span className="text-xs text-neutral-400 transition-colors duration-300 ease-out group-hover:text-brand-500 md:text-sm">{category.name}</span>
                </Link>
              ))}
            </div>
          ) : (
            <CatalogEmptyState compact title="Ангилал одоогоор байхгүй байна" description="Каталогийн ангилал нэмэгдэх үед энд харагдана." />
          )}
        </div>
      </Container>
    </SectionReveal>
  )
}
