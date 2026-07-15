import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { ScrollToTop } from './components/layout/ScrollToTop'

const HomePage = lazy(() => import('./pages/HomePage').then((module) => ({ default: module.HomePage })))
const BrandProductsPage = lazy(() =>
  import('./pages/BrandProductsPage').then((module) => ({ default: module.BrandProductsPage })),
)
const CategoryProductsPage = lazy(() =>
  import('./pages/CategoryProductsPage').then((module) => ({ default: module.CategoryProductsPage })),
)
const NewsPage = lazy(() => import('./pages/NewsPage').then((module) => ({ default: module.NewsPage })))
const ProductDetailPage = lazy(() =>
  import('./pages/ProductDetailPage').then((module) => ({ default: module.ProductDetailPage })),
)

export function App() {
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<div className="min-h-screen bg-white" aria-label="Хуудас уншиж байна" />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/brands" element={<BrandProductsPage />} />
          <Route path="/brands/:brandSlug" element={<BrandProductsPage />} />
          <Route path="/categories" element={<CategoryProductsPage />} />
          <Route path="/categories/:categorySlug" element={<CategoryProductsPage />} />
          <Route path="/products/:productSlug" element={<ProductDetailPage />} />
          <Route path="/news" element={<NewsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  )
}
