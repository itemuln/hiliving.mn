import { Link, useParams } from 'react-router-dom';
import { CatalogErrorState } from '../components/catalog/CatalogErrorState';
import { Footer } from '../components/layout/Footer';
import { Header } from '../components/layout/Header';
import { MobileBottomNav } from '../components/layout/MobileBottomNav';
import { Container } from '../components/layout/Container';
import { useProduct } from '../features/catalog/useCatalog';

const priceFormatter = new Intl.NumberFormat('mn-MN');

export function ProductDetailPage() {
  const { productSlug = '' } = useParams();
  const resource = useProduct(productSlug);
  const isNotFound = resource.status === 'error' && resource.error?.kind === 'not-found';

  return (
    <div id="top" className="min-h-screen bg-white">
      <Header />
      <main className="py-10 pb-28 md:py-16">
        <Container>
          {resource.status === 'loading' ? (
            <div
              aria-label="Бүтээгдэхүүний дэлгэрэнгүй ачаалж байна"
              role="status"
              className="grid animate-pulse gap-8 px-6 md:grid-cols-2 md:px-0"
            >
              <div className="aspect-square bg-neutral-100" />
              <div className="space-y-4 pt-4">
                <div className="h-5 w-1/3 rounded bg-neutral-100" />
                <div className="h-9 w-full rounded bg-neutral-100" />
                <div className="h-6 w-1/2 rounded bg-neutral-100" />
                <div className="h-24 w-full rounded bg-neutral-100" />
              </div>
            </div>
          ) : isNotFound ? (
            <div className="mx-6 flex min-h-80 items-center justify-center border border-dashed border-neutral-300 bg-neutral-50 text-center md:mx-0">
              <div>
                <h1 className="text-xl font-medium text-neutral-700">Бүтээгдэхүүн олдсонгүй</h1>
                <p className="mt-2 text-sm text-neutral-500">
                  Энэ бүтээгдэхүүн нийтлэгдээгүй эсвэл байхгүй байна.
                </p>
                <Link
                  to="/categories"
                  className="mt-5 inline-flex rounded bg-brand-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
                >
                  Каталог руу буцах
                </Link>
              </div>
            </div>
          ) : resource.status === 'error' ? (
            <div className="mx-6 md:mx-0">
              <CatalogErrorState onRetry={resource.retry} />
            </div>
          ) : resource.data ? (
            <article className="grid gap-8 px-6 md:grid-cols-2 md:gap-12 md:px-0 lg:gap-16">
              <div className="aspect-square overflow-hidden rounded-sm border border-neutral-200 bg-white p-6">
                <img
                  src={resource.data.imageUrl}
                  alt={resource.data.name}
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="self-center">
                <nav aria-label="Бүтээгдэхүүний зам" className="text-xs text-neutral-400">
                  <Link
                    to={`/categories/${resource.data.category.slug}`}
                    className="hover:text-brand-500"
                  >
                    {resource.data.category.name}
                  </Link>
                  {resource.data.brand ? (
                    <>
                      <span aria-hidden="true"> / </span>
                      <Link
                        to={`/brands/${resource.data.brand.slug}`}
                        className="hover:text-brand-500"
                      >
                        {resource.data.brand.name}
                      </Link>
                    </>
                  ) : null}
                </nav>
                <h1 className="mt-4 text-2xl font-medium leading-tight text-neutral-700 md:text-3xl">
                  {resource.data.name}
                </h1>
                {resource.data.shortDescription ? (
                  <p className="mt-4 text-sm leading-6 text-neutral-500">
                    {resource.data.shortDescription}
                  </p>
                ) : null}
                <div className="mt-6 flex items-baseline gap-3">
                  {resource.data.currentPrice < resource.data.listPrice ? (
                    <span className="text-sm text-neutral-400 line-through">
                      {priceFormatter.format(resource.data.listPrice)}₮
                    </span>
                  ) : null}
                  <span className="text-2xl font-semibold text-brand-500">
                    {priceFormatter.format(resource.data.currentPrice)}₮
                  </span>
                </div>
                {resource.data.description ? (
                  <p className="mt-7 whitespace-pre-line border-t border-neutral-100 pt-6 text-sm leading-7 text-neutral-600">
                    {resource.data.description}
                  </p>
                ) : null}
              </div>
            </article>
          ) : null}
        </Container>
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
}
