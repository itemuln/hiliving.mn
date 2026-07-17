import { Link } from 'react-router-dom';
import { Container } from '../components/layout/Container';
import { Footer } from '../components/layout/Footer';
import { Header } from '../components/layout/Header';
import { MobileBottomNav } from '../components/layout/MobileBottomNav';
import { cartErrorMessage } from '../features/cart/cartErrorMessage';
import { useCart } from '../features/cart/useCart';

const money = new Intl.NumberFormat('mn-MN');

export function CartPage() {
  const {
    items,
    quote,
    quoteStatus,
    quoteError,
    setQuantity,
    removeItem,
    clearCart,
    refreshQuote,
  } = useCart();

  return (
    <div className="min-h-screen bg-neutral-50">
      <Header />
      <main className="pb-28 pt-8 md:py-12">
        <Container>
          <div className="px-5 md:px-0">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-brand-600">Таны сонголт</p>
                <h1 className="mt-1 text-3xl font-semibold text-neutral-800">Худалдааны сагс</h1>
              </div>
              {items.length > 0 ? (
                <button
                  type="button"
                  onClick={clearCart}
                  className="text-sm text-neutral-500 underline"
                >
                  Сагс хоослох
                </button>
              ) : null}
            </div>

            {items.length === 0 ? (
              <section className="mt-8 rounded-2xl border border-dashed border-neutral-300 bg-white px-6 py-16 text-center">
                <img src="/icons/cart.svg" alt="" className="mx-auto h-10 w-10 opacity-40" />
                <h2 className="mt-4 text-lg font-semibold text-neutral-700">
                  Таны сагс хоосон байна
                </h2>
                <Link
                  to="/categories"
                  className="mt-6 inline-flex rounded-xl bg-brand-500 px-6 py-3 text-sm font-semibold text-white"
                >
                  Дэлгүүр хэсэх
                </Link>
              </section>
            ) : (
              <div className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
                <section className="min-w-0 space-y-3" aria-label="Сагсны бүтээгдэхүүн">
                  {quoteStatus === 'loading' && !quote ? (
                    <div
                      className="h-36 animate-pulse rounded-2xl bg-white"
                      aria-label="Сагс тооцоолж байна"
                    />
                  ) : null}
                  {quoteError ? (
                    <div
                      role="alert"
                      className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
                    >
                      <p>{cartErrorMessage(quoteError)}</p>
                      <button
                        type="button"
                        onClick={() => void refreshQuote()}
                        className="mt-2 font-medium underline"
                      >
                        Дахин шалгах
                      </button>
                    </div>
                  ) : null}
                  {(quote?.items ?? []).map((line) => (
                    <article
                      key={line.productSlug}
                      className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5"
                    >
                      <div className="flex gap-4">
                        <Link
                          to={`/products/${line.productSlug}`}
                          className="h-24 w-24 shrink-0 rounded-xl border p-2"
                        >
                          <img
                            src={line.primaryImageUrl ?? '/product-cleaner.svg'}
                            alt={line.productName}
                            className="h-full w-full object-contain"
                          />
                        </Link>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <Link
                                to={`/products/${line.productSlug}`}
                                className="font-medium text-neutral-800 hover:text-brand-600"
                              >
                                {line.productName}
                              </Link>
                              <p className="mt-1 text-xs text-neutral-400">SKU: {line.sku}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeItem(line.productSlug)}
                              className="text-xs text-red-600 underline"
                              aria-label={`${line.productName} сагснаас хасах`}
                            >
                              Хасах
                            </button>
                          </div>
                          <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
                            <div className="flex h-10 items-center rounded-lg border">
                              <button
                                type="button"
                                aria-label={`${line.productName} тоо хасах`}
                                disabled={line.requestedQuantity <= 1}
                                onClick={() =>
                                  setQuantity(
                                    line.productSlug,
                                    line.requestedQuantity - 1,
                                    line.availableQuantity
                                  )
                                }
                                className="h-full w-9 disabled:text-neutral-300"
                              >
                                −
                              </button>
                              <input
                                aria-label={`${line.productName} тоо ширхэг`}
                                type="number"
                                min={1}
                                max={line.availableQuantity}
                                value={line.requestedQuantity}
                                onChange={(event) =>
                                  setQuantity(
                                    line.productSlug,
                                    Number(event.target.value) || 1,
                                    line.availableQuantity
                                  )
                                }
                                className="h-full w-12 border-x text-center text-sm outline-none"
                              />
                              <button
                                type="button"
                                aria-label={`${line.productName} тоо нэмэх`}
                                disabled={line.requestedQuantity >= line.availableQuantity}
                                onClick={() =>
                                  setQuantity(
                                    line.productSlug,
                                    line.requestedQuantity + 1,
                                    line.availableQuantity
                                  )
                                }
                                className="h-full w-9 disabled:text-neutral-300"
                              >
                                +
                              </button>
                            </div>
                            <div className="text-right">
                              {line.membershipDiscountPercentage > 0 ? (
                                <p className="text-xs text-brand-600">
                                  Гишүүнчлэл −{line.membershipDiscountPercentage}%
                                </p>
                              ) : null}
                              <p className="mt-1 font-semibold text-neutral-800">
                                {money.format(line.lineSubtotal)}₮
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}

                  {quoteStatus === 'error' ? (
                    <div className="rounded-2xl bg-white p-4">
                      <p className="text-sm text-neutral-600">Засах бараагаа сонгоно уу:</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {items.map((item) => (
                          <button
                            key={item.productSlug}
                            type="button"
                            onClick={() => removeItem(item.productSlug)}
                            className="rounded-lg border border-red-200 px-3 py-2 text-xs text-red-600"
                          >
                            {item.productSlug} хасах
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  <Link
                    to="/categories"
                    className="inline-flex py-3 text-sm font-medium text-brand-600 hover:underline"
                  >
                    ← Дэлгүүр хэсэхээ үргэлжлүүлэх
                  </Link>
                </section>

                <aside
                  className="rounded-2xl border border-neutral-200 bg-white p-5 lg:sticky lg:top-5"
                  aria-label="Сагсны дүн"
                >
                  <h2 className="text-lg font-semibold text-neutral-800">Төлбөрийн мэдээлэл</h2>
                  {quote ? (
                    <dl className="mt-5 space-y-3 text-sm">
                      <div className="flex justify-between gap-4">
                        <dt>Үндсэн дүн</dt>
                        <dd>{money.format(quote.regularSubtotal)}₮</dd>
                      </div>
                      {quote.catalogDiscountTotal > 0 ? (
                        <div className="flex justify-between gap-4 text-emerald-700">
                          <dt>Үнийн хямдрал</dt>
                          <dd>−{money.format(quote.catalogDiscountTotal)}₮</dd>
                        </div>
                      ) : null}
                      {quote.membershipDiscountTotal > 0 ? (
                        <div className="flex justify-between gap-4 text-brand-600">
                          <dt>Гишүүнчлэлийн хөнгөлөлт</dt>
                          <dd>−{money.format(quote.membershipDiscountTotal)}₮</dd>
                        </div>
                      ) : null}
                      <div className="flex justify-between gap-4">
                        <dt>Хүргэлт</dt>
                        <dd>{money.format(quote.shippingAmount)}₮</dd>
                      </div>
                      <div className="flex justify-between gap-4 border-t pt-4 text-base font-semibold">
                        <dt>Нийт</dt>
                        <dd>{money.format(quote.grandTotal)}₮</dd>
                      </div>
                    </dl>
                  ) : (
                    <div className="mt-5 h-28 animate-pulse rounded-xl bg-neutral-100" />
                  )}
                  <Link
                    to="/checkout"
                    aria-disabled={!quote}
                    className={`mt-6 flex w-full justify-center rounded-xl px-5 py-3 text-sm font-semibold text-white ${
                      quote
                        ? 'bg-brand-500 hover:bg-brand-600'
                        : 'pointer-events-none bg-neutral-300'
                    }`}
                  >
                    Худалдан авалт үргэлжлүүлэх
                  </Link>
                  <p className="mt-3 text-xs leading-5 text-neutral-400">
                    Эцсийн үнэ, үлдэгдлийг захиалга хийхэд сервер дахин шалгана.
                  </p>
                </aside>
              </div>
            )}
          </div>
        </Container>
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
}
