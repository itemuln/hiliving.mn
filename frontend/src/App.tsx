import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { ScrollToTop } from './components/layout/ScrollToTop';
import { ProtectedRoute } from './features/auth/ProtectedRoute';

const HomePage = lazy(() =>
  import('./pages/HomePage').then((module) => ({ default: module.HomePage }))
);
const BrandProductsPage = lazy(() =>
  import('./pages/BrandProductsPage').then((module) => ({ default: module.BrandProductsPage }))
);
const CategoryProductsPage = lazy(() =>
  import('./pages/CategoryProductsPage').then((module) => ({
    default: module.CategoryProductsPage,
  }))
);
const NewsPage = lazy(() =>
  import('./pages/NewsPage').then((module) => ({ default: module.NewsPage }))
);
const NewsDetailPage = lazy(() =>
  import('./pages/NewsDetailPage').then((module) => ({ default: module.NewsDetailPage }))
);
const ProductDetailPage = lazy(() =>
  import('./pages/ProductDetailPage').then((module) => ({ default: module.ProductDetailPage }))
);
const CartPage = lazy(() =>
  import('./pages/CartPage').then((module) => ({ default: module.CartPage }))
);
const CheckoutPage = lazy(() =>
  import('./pages/CheckoutPage').then((module) => ({ default: module.CheckoutPage }))
);
const OrderSuccessPage = lazy(() =>
  import('./pages/OrderSuccessPage').then((module) => ({ default: module.OrderSuccessPage }))
);
const LoginPage = lazy(() =>
  import('./pages/LoginPage').then((module) => ({ default: module.LoginPage }))
);
const RegisterPage = lazy(() =>
  import('./pages/RegisterPage').then((module) => ({ default: module.RegisterPage }))
);
const ForgotPasswordPage = lazy(() =>
  import('./pages/ForgotPasswordPage').then((module) => ({ default: module.ForgotPasswordPage }))
);
const ResetPasswordPage = lazy(() =>
  import('./pages/ResetPasswordPage').then((module) => ({ default: module.ResetPasswordPage }))
);
const VerifyEmailPage = lazy(() =>
  import('./pages/VerifyEmailPage').then((module) => ({ default: module.VerifyEmailPage }))
);
const AccountPage = lazy(() =>
  import('./pages/AccountPage').then((module) => ({ default: module.AccountPage }))
);
const ProfilePage = lazy(() =>
  import('./pages/ProfilePage').then((module) => ({ default: module.ProfilePage }))
);
const AddressesPage = lazy(() =>
  import('./pages/AddressesPage').then((module) => ({ default: module.AddressesPage }))
);
const SecurityPage = lazy(() =>
  import('./pages/SecurityPage').then((module) => ({ default: module.SecurityPage }))
);
const AdminDashboardPage = lazy(() =>
  import('./features/admin/dashboard/AdminDashboardPage').then((m) => ({
    default: m.AdminDashboardPage,
  }))
);
const AdminCategoriesPage = lazy(() =>
  import('./features/admin/categories/AdminCategoriesPage').then((m) => ({
    default: m.AdminCategoriesPage,
  }))
);
const AdminBrandsPage = lazy(() =>
  import('./features/admin/brands/AdminBrandsPage').then((m) => ({ default: m.AdminBrandsPage }))
);
const AdminProductsPage = lazy(() =>
  import('./features/admin/products/AdminProductsPage').then((m) => ({
    default: m.AdminProductsPage,
  }))
);
const AdminProductEditorPage = lazy(() =>
  import('./features/admin/products/AdminProductEditorPage').then((m) => ({
    default: m.AdminProductEditorPage,
  }))
);
const AdminUsersPage = lazy(() =>
  import('./features/admin/users/AdminUsersPage').then((m) => ({ default: m.AdminUsersPage }))
);
const AdminUserDetailPage = lazy(() =>
  import('./features/admin/users/AdminUserDetailPage').then((m) => ({
    default: m.AdminUserDetailPage,
  }))
);
const AdminBannersPage = lazy(() =>
  import('./features/admin/banners/AdminBannersPage').then((m) => ({ default: m.AdminBannersPage }))
);
const AdminNewsPage = lazy(() =>
  import('./features/admin/news/AdminNewsPage').then((m) => ({ default: m.AdminNewsPage }))
);
const AdminNewsEditorPage = lazy(() =>
  import('./features/admin/news/AdminNewsEditorPage').then((m) => ({
    default: m.AdminNewsEditorPage,
  }))
);

export function App() {
  return (
    <>
      <ScrollToTop />
      <Suspense
        fallback={<div className="min-h-screen bg-white" aria-label="Хуудас уншиж байна" />}
      >
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/brands" element={<BrandProductsPage />} />
          <Route path="/brands/:brandSlug" element={<BrandProductsPage />} />
          <Route path="/categories" element={<CategoryProductsPage />} />
          <Route path="/categories/:categorySlug" element={<CategoryProductsPage />} />
          <Route path="/products/:productSlug" element={<ProductDetailPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <CheckoutPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/checkout/success/:orderNumber"
            element={
              <ProtectedRoute>
                <OrderSuccessPage />
              </ProtectedRoute>
            }
          />
          <Route path="/news" element={<NewsPage />} />
          <Route path="/news/:newsSlug" element={<NewsDetailPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route
            path="/account"
            element={
              <ProtectedRoute>
                <AccountPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/account/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/account/addresses"
            element={
              <ProtectedRoute>
                <AddressesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/account/security"
            element={
              <ProtectedRoute>
                <SecurityPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute admin>
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/categories"
            element={
              <ProtectedRoute admin>
                <AdminCategoriesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/brands"
            element={
              <ProtectedRoute admin>
                <AdminBrandsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/products"
            element={
              <ProtectedRoute admin>
                <AdminProductsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/products/new"
            element={
              <ProtectedRoute admin>
                <AdminProductEditorPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/products/:id/edit"
            element={
              <ProtectedRoute admin>
                <AdminProductEditorPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute admin>
                <AdminUsersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users/:id"
            element={
              <ProtectedRoute admin>
                <AdminUserDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/banners"
            element={
              <ProtectedRoute admin>
                <AdminBannersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/news"
            element={
              <ProtectedRoute admin>
                <AdminNewsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/news/new"
            element={
              <ProtectedRoute admin>
                <AdminNewsEditorPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/news/:id/edit"
            element={
              <ProtectedRoute admin>
                <AdminNewsEditorPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  );
}
