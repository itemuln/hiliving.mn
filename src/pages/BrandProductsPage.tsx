import { useParams } from 'react-router-dom'
import { CatalogEmptyState } from '../components/catalog/CatalogEmptyState'
import { CatalogLayout } from '../components/catalog/CatalogLayout'
import { CatalogPagination } from '../components/catalog/CatalogPagination'
import { CatalogSidebar } from '../components/catalog/CatalogSidebar'
import { MobileBrandSelector } from '../components/catalog/MobileBrandSelector'
import { ProductGrid } from '../components/catalog/ProductGrid'
import { useCatalogPagination } from '../components/catalog/useCatalogPagination'
import { HeroCarousel } from '../components/home/HeroCarousel'
import { Footer } from '../components/layout/Footer'
import { Header } from '../components/layout/Header'
import { MobileBottomNav } from '../components/layout/MobileBottomNav'
import { brands } from '../data/brands'
import { products } from '../data/products'

const sidebarBrands = [{ slug: 'all', name: 'БҮГД' }, ...brands]

export function BrandProductsPage() {
  const { brandSlug } = useParams()
  const activeSlug = brandSlug ?? 'all'
  const activeBrand = brands.find((brand) => brand.slug === brandSlug)
  const filteredProducts = brandSlug
    ? products.filter((product) => product.brandSlug === brandSlug)
    : products
  const hasUnknownSlug = Boolean(brandSlug && !activeBrand)
  const { currentPage, totalPages, paginatedItems } = useCatalogPagination({
    items: filteredProducts,
    enabled: !hasUnknownSlug,
  })

  return (
    <div id="top" className="min-h-screen bg-white">
      <Header />
      <main>
        <HeroCarousel />
        <CatalogLayout
          sidebar={<CatalogSidebar items={sidebarBrands} activeSlug={activeSlug} basePath="/brands" variant="brand" />}
          mobileNavigation={<MobileBrandSelector brands={brands} activeSlug={activeSlug} />}
        >
          {hasUnknownSlug ? (
            <CatalogEmptyState title="Брэнд олдсонгүй" />
          ) : (
            <>
              <ProductGrid products={paginatedItems} variant="brand" />
              <CatalogPagination currentPage={currentPage} totalPages={totalPages} />
            </>
          )}
        </CatalogLayout>
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  )
}
