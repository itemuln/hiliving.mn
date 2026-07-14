import { useParams } from 'react-router-dom'
import { CatalogEmptyState } from '../components/catalog/CatalogEmptyState'
import { CatalogLayout } from '../components/catalog/CatalogLayout'
import { CatalogPagination } from '../components/catalog/CatalogPagination'
import { CatalogSidebar } from '../components/catalog/CatalogSidebar'
import { MobileCategoryHeader } from '../components/catalog/MobileCategoryHeader'
import { ProductGrid } from '../components/catalog/ProductGrid'
import { useCatalogPagination } from '../components/catalog/useCatalogPagination'
import { HeroCarousel } from '../components/home/HeroCarousel'
import { Footer } from '../components/layout/Footer'
import { Header } from '../components/layout/Header'
import { MobileBottomNav } from '../components/layout/MobileBottomNav'
import { categories } from '../data/categories'
import { products } from '../data/products'

const sidebarCategories = [{ slug: 'all', name: 'БҮГД' }, ...categories]

export function CategoryProductsPage() {
  const { categorySlug } = useParams()
  const isAll = !categorySlug
  const activeCategory = categories.find((category) => category.slug === categorySlug)
  const hasUnknownSlug = Boolean(categorySlug && !activeCategory)
  const activeSlug = categorySlug ?? 'all'
  const filteredProducts = isAll
    ? products
    : products.filter((product) => product.categorySlug === categorySlug)
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
          sidebar={<CatalogSidebar items={sidebarCategories} activeSlug={activeSlug} basePath="/categories" variant="category" />}
          mobileNavigation={<MobileCategoryHeader categories={categories} activeCategory={activeCategory} isAll={isAll} />}
        >
          {hasUnknownSlug ? (
            <CatalogEmptyState title="Ангилал олдсонгүй" />
          ) : (
            <>
              <ProductGrid products={paginatedItems} variant="category" />
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
