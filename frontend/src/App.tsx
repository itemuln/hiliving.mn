import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { ScrollToTop } from './components/layout/ScrollToTop'
import { ProtectedRoute } from './features/auth/ProtectedRoute'

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
const LoginPage = lazy(() => import('./pages/LoginPage').then((module) => ({ default: module.LoginPage })))
const RegisterPage = lazy(() => import('./pages/RegisterPage').then((module) => ({ default: module.RegisterPage })))
const AccountPage = lazy(() => import('./pages/AccountPage').then((module) => ({ default: module.AccountPage })))
const ProfilePage = lazy(() => import('./pages/ProfilePage').then((module) => ({ default: module.ProfilePage })))
const AddressesPage = lazy(() => import('./pages/AddressesPage').then((module) => ({ default: module.AddressesPage })))
const SecurityPage = lazy(() => import('./pages/SecurityPage').then((module) => ({ default: module.SecurityPage })))

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
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/account" element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />
          <Route path="/account/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/account/addresses" element={<ProtectedRoute><AddressesPage /></ProtectedRoute>} />
          <Route path="/account/security" element={<ProtectedRoute><SecurityPage /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  )
}
