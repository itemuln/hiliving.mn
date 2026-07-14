import { Navigate, useParams } from 'react-router-dom'
import { CatalogEmptyState } from '../components/catalog/CatalogEmptyState'
import { CatalogLayout } from '../components/catalog/CatalogLayout'
import { CatalogSidebar } from '../components/catalog/CatalogSidebar'
import { MobileCategoryHeader } from '../components/catalog/MobileCategoryHeader'
import { ProductGrid } from '../components/catalog/ProductGrid'
import { HeroCarousel } from '../components/home/HeroCarousel'
import { Footer } from '../components/layout/Footer'
import { Header } from '../components/layout/Header'
import { MobileBottomNav } from '../components/layout/MobileBottomNav'
import { categories } from '../data/categories'
import { products } from '../data/products'

export function CategoryProductsPage() {
  const { categorySlug } = useParams()

  if (!categorySlug) {
    return <Navigate to="/categories/electronics" replace />
  }

  const activeCategory = categories.find((category) => category.slug === categorySlug)
  const filteredProducts = products.filter((product) => product.categorySlug === categorySlug).slice(0, 16)

  return (
    <div id="top" className="min-h-screen bg-white">
      <Header />
      <main>
        <HeroCarousel />
        <CatalogLayout
          sidebar={<CatalogSidebar items={categories} activeSlug={categorySlug} basePath="/categories" variant="category" />}
          mobileNavigation={<MobileCategoryHeader categories={categories} activeCategory={activeCategory} />}
        >
          {activeCategory ? (
            <ProductGrid products={filteredProducts} variant="category" mobileLimit={8} />
          ) : (
            <CatalogEmptyState title="Ангилал олдсонгүй" />
          )}
        </CatalogLayout>
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  )
}

