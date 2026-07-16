import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { CatalogEmptyState } from '../components/catalog/CatalogEmptyState';
import { CatalogErrorState } from '../components/catalog/CatalogErrorState';
import { CatalogLayout } from '../components/catalog/CatalogLayout';
import { CatalogNavigationSkeleton } from '../components/catalog/CatalogNavigationSkeleton';
import { CatalogPagination } from '../components/catalog/CatalogPagination';
import { CatalogToolbar } from '../components/catalog/CatalogToolbar';
import { MobileBrandSelector } from '../components/catalog/MobileBrandSelector';
import { ProductGrid } from '../components/catalog/ProductGrid';
import { ProductGridSkeleton } from '../components/catalog/ProductGridSkeleton';
import { Sidebar } from '../components/catalog/Sidebar';
import { HeroCarousel } from '../components/home/HeroCarousel';
import { Footer } from '../components/layout/Footer';
import { Header } from '../components/layout/Header';
import { MobileBottomNav } from '../components/layout/MobileBottomNav';
import { useBrands, useProducts } from '../features/catalog/useCatalog';
import { useCatalogPageQuery } from '../features/catalog/useCatalogPageQuery';

const PAGE_SIZE = 16;

export function BrandProductsPage() {
  const { brandSlug } = useParams();
  const { page, search, sort, setPage, setSearch, setSort } = useCatalogPageQuery();
  const brandsResource = useBrands();
  const productsResource = useProducts({
    page: page - 1,
    size: PAGE_SIZE,
    brand: brandSlug,
    search,
    sort,
  });
  const brands = brandsResource.data ?? [];
  const activeSlug = brandSlug ?? 'all';
  const hasUnknownSlug =
    brandsResource.status === 'success' &&
    Boolean(brandSlug && !brands.some((brand) => brand.slug === brandSlug));
  const sidebarBrands = [{ slug: 'all', name: 'БҮГД' }, ...brands];

  useEffect(() => {
    if (productsResource.status !== 'success' || !productsResource.data) return;
    const maximumPage = Math.max(1, productsResource.data.totalPages);
    if (page > maximumPage) setPage(maximumPage);
  }, [page, productsResource.data, productsResource.status, setPage]);

  const retry = () => {
    brandsResource.retry();
    productsResource.retry();
  };

  const navigation =
    brandsResource.status === 'loading' ? (
      <CatalogNavigationSkeleton />
    ) : (
      <Sidebar items={sidebarBrands} activeSlug={activeSlug} basePath="/brands" variant="brand" />
    );
  const mobileNavigation =
    brandsResource.status === 'loading' ? (
      <div className="mb-6 h-12 animate-pulse bg-neutral-100" aria-label="Брэнд ачаалж байна" />
    ) : (
      <MobileBrandSelector brands={brands} activeSlug={activeSlug} />
    );

  return (
    <div id="top" className="min-h-screen bg-white">
      <Header />
      <main>
        <HeroCarousel />
        <CatalogLayout sidebar={navigation} mobileNavigation={mobileNavigation}>
          <CatalogToolbar search={search} sort={sort} onSearch={setSearch} onSort={setSort} />
          {brandsResource.status === 'error' || productsResource.status === 'error' ? (
            <CatalogErrorState onRetry={retry} />
          ) : hasUnknownSlug ? (
            <CatalogEmptyState title="Брэнд олдсонгүй" />
          ) : brandsResource.status === 'loading' || productsResource.status === 'loading' ? (
            <ProductGridSkeleton count={8} />
          ) : productsResource.data && productsResource.data.items.length > 0 ? (
            <>
              <ProductGrid products={productsResource.data.items} variant="brand" />
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
