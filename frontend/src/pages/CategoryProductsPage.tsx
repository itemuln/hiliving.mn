import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { CatalogEmptyState } from '../components/catalog/CatalogEmptyState';
import { CatalogErrorState } from '../components/catalog/CatalogErrorState';
import { CatalogLayout } from '../components/catalog/CatalogLayout';
import { CatalogNavigationSkeleton } from '../components/catalog/CatalogNavigationSkeleton';
import { CatalogPagination } from '../components/catalog/CatalogPagination';
import { CatalogToolbar } from '../components/catalog/CatalogToolbar';
import { MobileCategoryHeader } from '../components/catalog/MobileCategoryHeader';
import { ProductGrid } from '../components/catalog/ProductGrid';
import { ProductGridSkeleton } from '../components/catalog/ProductGridSkeleton';
import { Sidebar } from '../components/catalog/Sidebar';
import { HeroCarousel } from '../components/home/HeroCarousel';
import { Footer } from '../components/layout/Footer';
import { Header } from '../components/layout/Header';
import { MobileBottomNav } from '../components/layout/MobileBottomNav';
import { useCategories, useProducts } from '../features/catalog/useCatalog';
import { useCatalogPageQuery } from '../features/catalog/useCatalogPageQuery';

const PAGE_SIZE = 16;

export function CategoryProductsPage() {
  const { categorySlug } = useParams();
  const { page, search, sort, setPage, setSearch, setSort } = useCatalogPageQuery();
  const categoriesResource = useCategories();
  const productsResource = useProducts({
    page: page - 1,
    size: PAGE_SIZE,
    category: categorySlug,
    search,
    sort,
  });
  const categories = categoriesResource.data ?? [];
  const isAll = !categorySlug;
  const activeCategory = categories.find((category) => category.slug === categorySlug);
  const hasUnknownSlug =
    categoriesResource.status === 'success' && Boolean(categorySlug && !activeCategory);
  const activeSlug = categorySlug ?? 'all';
  const sidebarCategories = [{ slug: 'all', name: 'БҮГД' }, ...categories];

  useEffect(() => {
    if (productsResource.status !== 'success' || !productsResource.data) return;
    const maximumPage = Math.max(1, productsResource.data.totalPages);
    if (page > maximumPage) setPage(maximumPage);
  }, [page, productsResource.data, productsResource.status, setPage]);

  const retry = () => {
    categoriesResource.retry();
    productsResource.retry();
  };

  const navigation =
    categoriesResource.status === 'loading' ? (
      <CatalogNavigationSkeleton />
    ) : (
      <Sidebar
        items={sidebarCategories}
        activeSlug={activeSlug}
        basePath="/categories"
        variant="category"
      />
    );
  const mobileNavigation =
    categoriesResource.status === 'loading' ? (
      <div className="mb-6 h-12 animate-pulse bg-neutral-100" aria-label="Ангилал ачаалж байна" />
    ) : (
      <MobileCategoryHeader categories={categories} activeCategory={activeCategory} isAll={isAll} />
    );

  return (
    <div id="top" className="min-h-screen bg-white">
      <Header />
      <main>
        <HeroCarousel />
        <CatalogLayout sidebar={navigation} mobileNavigation={mobileNavigation}>
          <CatalogToolbar search={search} sort={sort} onSearch={setSearch} onSort={setSort} />
          {categoriesResource.status === 'error' || productsResource.status === 'error' ? (
            <CatalogErrorState onRetry={retry} />
          ) : hasUnknownSlug ? (
            <CatalogEmptyState title="Ангилал олдсонгүй" />
          ) : categoriesResource.status === 'loading' || productsResource.status === 'loading' ? (
            <ProductGridSkeleton count={8} />
          ) : productsResource.data && productsResource.data.items.length > 0 ? (
            <>
              <ProductGrid products={productsResource.data.items} variant="category" />
              <CatalogPagination
                currentPage={productsResource.data.page + 1}
                totalPages={productsResource.data.totalPages}
              />
            </>
          ) : (
            <CatalogEmptyState
              title="Бүтээгдэхүүн олдсонгүй"
              description="Хайлтын нөхцөлөө өөрчлөөд дахин оролдоно уу."
            />
          )}
        </CatalogLayout>
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
}
