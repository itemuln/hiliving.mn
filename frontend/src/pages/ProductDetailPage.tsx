import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CatalogErrorState } from '../components/catalog/CatalogErrorState';
import { Container } from '../components/layout/Container';
import { Footer } from '../components/layout/Footer';
import { Header } from '../components/layout/Header';
import { MobileBottomNav } from '../components/layout/MobileBottomNav';
import { ProductCard } from '../components/ui/ProductCard';
import { useCart } from '../features/cart/useCart';
import { useProduct } from '../features/catalog/useCatalog';

const priceFormatter = new Intl.NumberFormat('mn-MN');

export function ProductDetailPage() {
  const { productSlug = '' } = useParams();
  const resource = useProduct(productSlug);
  const { addItem } = useCart();
  const [selectedImage, setSelectedImage] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const isNotFound = resource.status === 'error' && resource.error?.kind === 'not-found';

  useEffect(() => {
    if (!resource.data) return;
    setSelectedImage(resource.data.imageUrl);
    setQuantity(1);
    setAdded(false);
  }, [resource.data]);

  const product = resource.data;
  const available = product ? product.availableQuantity > 0 : false;

  return (
    <div id="top" className="min-h-screen bg-white">
      <Header />
      <main className="py-8 pb-28 md:py-12">
        <Container>
          {resource.status === 'loading' ? (
            <div
              aria-label="Бүтээгдэхүүний дэлгэрэнгүй ачаалж байна"
              role="status"
              className="grid animate-pulse gap-8 px-6 md:grid-cols-2 md:px-0"
            >
              <div className="aspect-square rounded-2xl bg-neutral-100" />
              <div className="space-y-4 pt-4">
                <div className="h-5 w-1/3 rounded bg-neutral-100" />
                <div className="h-9 w-full rounded bg-neutral-100" />
                <div className="h-6 w-1/2 rounded bg-neutral-100" />
                <div className="h-24 w-full rounded bg-neutral-100" />
              </div>
            </div>
          ) : isNotFound ? (
            <div className="mx-6 flex min-h-80 items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 text-center md:mx-0">
              <div>
                <h1 className="text-xl font-medium text-neutral-700">Бүтээгдэхүүн олдсонгүй</h1>
                <p className="mt-2 text-sm text-neutral-500">
                  Энэ бүтээгдэхүүн нийтлэгдээгүй эсвэл байхгүй байна.
                </p>
                <Link
                  to="/categories"
                  className="mt-5 inline-flex rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
                >
                  Каталог руу буцах
                </Link>
              </div>
            </div>
          ) : resource.status === 'error' ? (
            <div className="mx-6 md:mx-0">
              <CatalogErrorState onRetry={resource.retry} />
            </div>
          ) : product ? (
            <>
              <nav
                aria-label="Бүтээгдэхүүний зам"
                className="mb-6 px-6 text-xs text-neutral-400 md:px-0"
              >
                <Link to="/" className="hover:text-brand-500">
                  Нүүр
                </Link>
                <span aria-hidden="true"> / </span>
                <Link to={`/categories/${product.category.slug}`} className="hover:text-brand-500">
                  {product.category.name}
                </Link>
                <span aria-hidden="true"> / </span>
                <span aria-current="page" className="text-neutral-600">
                  {product.name}
                </span>
              </nav>

              <article className="grid gap-8 px-6 md:grid-cols-2 md:gap-12 md:px-0 lg:gap-16">
                <section aria-label="Бүтээгдэхүүний зураг" className="min-w-0">
                  <div className="aspect-square overflow-hidden rounded-2xl border border-neutral-200 bg-white p-5 sm:p-8">
                    <img
                      src={selectedImage || product.imageUrl}
                      alt={product.name}
                      className="h-full w-full object-contain"
                    />
                  </div>
                  {product.images.length > 1 ? (
                    <div
                      className="mt-3 grid grid-cols-4 gap-3"
                      role="group"
                      aria-label="Зураг сонгох"
                    >
                      {product.images.map((image, index) => (
                        <button
                          key={image.id}
                          type="button"
                          onClick={() => setSelectedImage(image.imageUrl)}
                          aria-label={`${product.name} зураг ${index + 1}`}
                          aria-pressed={(selectedImage || product.imageUrl) === image.imageUrl}
                          className={`aspect-square overflow-hidden rounded-xl border p-1.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500 ${
                            (selectedImage || product.imageUrl) === image.imageUrl
                              ? 'border-brand-500'
                              : 'border-neutral-200'
                          }`}
                        >
                          <img
                            src={image.imageUrl}
                            alt={image.altText ?? `${product.name} зураг ${index + 1}`}
                            className="h-full w-full object-contain"
                          />
                        </button>
                      ))}
                    </div>
                  ) : null}
                </section>

                <section className="self-center">
                  {product.brand ? (
                    <Link
                      to={`/brands/${product.brand.slug}`}
                      className="text-sm font-medium uppercase tracking-wide text-brand-600"
                    >
                      {product.brand.name}
                    </Link>
                  ) : null}
                  <h1 className="mt-3 text-2xl font-semibold leading-tight text-neutral-800 md:text-3xl">
                    {product.name}
                  </h1>
                  <p className="mt-2 text-xs text-neutral-400">SKU: {product.sku}</p>
                  {product.shortDescription ? (
                    <p className="mt-4 text-sm leading-6 text-neutral-500">
                      {product.shortDescription}
                    </p>
                  ) : null}

                  <div className="mt-6 flex flex-wrap items-baseline gap-3">
                    {product.currentPrice < product.listPrice ? (
                      <span className="text-sm text-neutral-400 line-through">
                        {priceFormatter.format(product.listPrice)}₮
                      </span>
                    ) : null}
                    <span className="text-3xl font-semibold text-brand-500">
                      {priceFormatter.format(product.currentPrice)}₮
                    </span>
                  </div>
                  {product.membershipSavings > 0 ? (
                    <p className="mt-2 rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700">
                      Гишүүнчлэлийн {product.membershipDiscountPercentage}% хөнгөлөлтөөр{' '}
                      {priceFormatter.format(product.membershipSavings)}₮ хэмнэнэ.
                    </p>
                  ) : product.membershipDiscountEligible ? (
                    <p className="mt-2 text-xs text-neutral-500">
                      Нэвтэрсэн хэрэглэгчийн гишүүнчлэлийн хөнгөлөлт автоматаар тооцогдоно.
                    </p>
                  ) : null}

                  <p
                    className={`mt-5 text-sm font-medium ${
                      available ? 'text-emerald-700' : 'text-red-600'
                    }`}
                    role="status"
                  >
                    {product.inventoryStatus === 'OUT_OF_STOCK'
                      ? 'Нөөц дууссан'
                      : product.inventoryStatus === 'LOW_STOCK'
                      ? `Цөөн үлдсэн (${product.availableQuantity})`
                      : `Нөөцөд байна (${product.availableQuantity})`}
                  </p>

                  <div className="mt-6 flex flex-wrap items-center gap-4">
                    <div
                      className="flex h-12 items-center rounded-xl border border-neutral-300"
                      aria-label="Тоо ширхэг"
                    >
                      <button
                        type="button"
                        onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                        disabled={!available || quantity <= 1}
                        aria-label="Тоо ширхэг хасах"
                        className="h-full w-11 text-xl disabled:text-neutral-300"
                      >
                        −
                      </button>
                      <input
                        aria-label="Тоо ширхэг"
                        type="number"
                        min={1}
                        max={product.availableQuantity}
                        value={quantity}
                        disabled={!available}
                        onChange={(event) =>
                          setQuantity(
                            Math.max(
                              1,
                              Math.min(product.availableQuantity, Number(event.target.value) || 1)
                            )
                          )
                        }
                        className="h-full w-14 border-x border-neutral-200 text-center text-sm outline-none"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setQuantity((value) => Math.min(product.availableQuantity, value + 1))
                        }
                        disabled={!available || quantity >= product.availableQuantity}
                        aria-label="Тоо ширхэг нэмэх"
                        className="h-full w-11 text-xl disabled:text-neutral-300"
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      disabled={!available}
                      onClick={() => {
                        addItem(product.slug, quantity, product.availableQuantity);
                        setAdded(true);
                      }}
                      className="min-h-12 flex-1 rounded-xl bg-brand-500 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-neutral-300 sm:flex-none"
                    >
                      {available ? 'Сагсанд нэмэх' : 'Нөөц дууссан'}
                    </button>
                  </div>
                  <p
                    className="mt-3 min-h-5 text-sm text-emerald-700"
                    role="status"
                    aria-live="polite"
                  >
                    {added ? `${quantity} ширхэг сагсанд нэмэгдлээ.` : ''}
                  </p>
                </section>
              </article>

              {product.description ? (
                <section className="mx-6 mt-12 border-t border-neutral-100 pt-8 md:mx-0">
                  <h2 className="text-xl font-semibold text-neutral-800">Бүтээгдэхүүний тайлбар</h2>
                  <p className="mt-4 max-w-4xl whitespace-pre-line text-sm leading-7 text-neutral-600">
                    {product.description}
                  </p>
                </section>
              ) : null}

              {product.relatedProducts.length > 0 ? (
                <section className="mx-6 mt-14 md:mx-0" aria-labelledby="related-products-title">
                  <h2
                    id="related-products-title"
                    className="text-xl font-semibold text-neutral-800"
                  >
                    Төстэй бүтээгдэхүүн
                  </h2>
                  <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
                    {product.relatedProducts.map((related) => (
                      <ProductCard key={related.id} product={related} variant="home" />
                    ))}
                  </div>
                </section>
              ) : null}
            </>
          ) : null}
        </Container>
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
}
