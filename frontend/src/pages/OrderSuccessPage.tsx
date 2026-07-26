import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getOrder } from '../api/commerceApi';
import { Container } from '../components/layout/Container';
import { Footer } from '../components/layout/Footer';
import { Header } from '../components/layout/Header';
import { MobileBottomNav } from '../components/layout/MobileBottomNav';
import { deliveryMethodLabel } from '../features/checkout/delivery';
import type { CustomerOrder } from '../features/checkout/order.types';
import { orderStatusLabel, paymentStatusLabel, statusTone } from '../features/checkout/orderStatus';

const money = new Intl.NumberFormat('mn-MN');
const date = new Intl.DateTimeFormat('mn-MN', { dateStyle: 'medium', timeStyle: 'short' });

export function OrderSuccessPage() {
  const { orderNumber = '' } = useParams();
  const [order, setOrder] = useState<CustomerOrder | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    getOrder(orderNumber)
      .then((value) => active && setOrder(value))
      .catch(() => active && setError(true));
    return () => {
      active = false;
    };
  }, [orderNumber]);

  return (
    <div className="min-h-screen bg-neutral-50">
      <Header />
      <main className="pb-28 pt-8 md:py-12">
        <Container>
          <div className="mx-5 max-w-4xl md:mx-auto">
            {error ? (
              <div role="alert" className="rounded-2xl border bg-white p-8 text-center">
                <h1 className="text-xl font-semibold">Захиалгын мэдээлэл олдсонгүй</h1>
                <Link to="/categories" className="mt-5 inline-flex text-brand-600 underline">
                  Дэлгүүр рүү буцах
                </Link>
              </div>
            ) : !order ? (
              <div
                className="h-80 animate-pulse rounded-2xl bg-white"
                aria-label="Захиалга уншиж байна"
              />
            ) : (
              <article className="rounded-2xl border bg-white p-5 sm:p-8">
                <div className="text-center">
                  <div
                    className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full text-2xl ${statusTone(
                      order.orderStatus
                    )}`}
                  >
                    {order.paymentStatus === 'PAID' ? '✓' : '•'}
                  </div>
                  <p className="mt-4 text-sm font-medium text-neutral-600">
                    {order.paymentStatus === 'PAID'
                      ? 'Захиалга баталгаажлаа'
                      : orderStatusLabel(order.orderStatus)}
                  </p>
                  <h1 className="mt-2 text-2xl font-semibold text-neutral-800">
                    {order.orderNumber}
                  </h1>
                  <p className="mt-2 text-sm text-neutral-500">
                    {date.format(new Date(order.placedAt))}
                  </p>
                </div>
                <dl className="mt-8 grid gap-3 rounded-xl bg-neutral-50 p-4 text-sm sm:grid-cols-4">
                  <div>
                    <dt className="text-neutral-400">Захиалгын төлөв</dt>
                    <dd className="mt-1 font-medium">{orderStatusLabel(order.orderStatus)}</dd>
                  </div>
                  <div>
                    <dt className="text-neutral-400">Төлбөрийн төлөв</dt>
                    <dd className="mt-1 font-medium">{paymentStatusLabel(order.paymentStatus)}</dd>
                  </div>
                  <div>
                    <dt className="text-neutral-400">Төлбөрийн хэлбэр</dt>
                    <dd className="mt-1 font-medium">{order.paymentMethod}</dd>
                  </div>
                  <div>
                    <dt className="text-neutral-400">Хүлээн авах хэлбэр</dt>
                    <dd className="mt-1 font-medium">
                      {deliveryMethodLabel(order.deliveryMethod)}
                    </dd>
                  </div>
                </dl>
                <section className="mt-8">
                  <h2 className="font-semibold">
                    {order.deliveryMethod === 'SELF_PICKUP'
                      ? 'Бараа авах байршил'
                      : 'Хүргэлтийн хаяг'}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-neutral-600">
                    {order.address.recipientName} · {order.address.recipientPhone}
                    <br />
                    {order.address.cityOrProvince}, {order.address.districtOrSoum},{' '}
                    {order.address.khorooOrBag ? `${order.address.khorooOrBag}, ` : ''}
                    {order.address.addressLine}
                    {order.address.additionalDetails ? (
                      <>
                        <br />
                        {order.address.additionalDetails}
                      </>
                    ) : null}
                  </p>
                </section>
                <section className="mt-8">
                  <h2 className="font-semibold">Бүтээгдэхүүн</h2>
                  <ul className="mt-3 divide-y">
                    {order.items.map((item) => (
                      <li
                        key={`${item.productSlug}-${item.sku}`}
                        className="flex items-center gap-3 py-3"
                      >
                        <img
                          src={item.primaryImageUrl ?? '/product-cleaner.svg'}
                          alt={item.productName}
                          loading="lazy"
                          decoding="async"
                          className="h-16 w-16 rounded-lg border object-contain p-1"
                        />
                        <span className="min-w-0 flex-1 text-sm">
                          {item.productName}
                          <span className="mt-1 block text-xs text-neutral-400">
                            {item.quantity} × {money.format(item.unitEffectivePrice)}₮
                          </span>
                        </span>
                        <strong className="text-sm">{money.format(item.lineTotal)}₮</strong>
                      </li>
                    ))}
                  </ul>
                </section>
                <dl className="ml-auto mt-6 max-w-sm space-y-3 border-t pt-5 text-sm">
                  <div className="flex justify-between">
                    <dt>Үндсэн дүн</dt>
                    <dd>{money.format(order.regularSubtotal)}₮</dd>
                  </div>
                  <div className="flex justify-between text-emerald-700">
                    <dt>Хөнгөлөлт</dt>
                    <dd>−{money.format(order.discountTotal)}₮</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>{order.deliveryMethod === 'SELF_PICKUP' ? 'Өөрөө авах' : 'Хүргэлт'}</dt>
                    <dd>{money.format(order.shippingTotal)}₮</dd>
                  </div>
                  <div className="flex justify-between border-t pt-3 text-base font-semibold">
                    <dt>Нийт</dt>
                    <dd>{money.format(order.grandTotal)}₮</dd>
                  </div>
                </dl>
                <div className="mt-8 text-center">
                  {order.orderStatus === 'PENDING_PAYMENT' ? (
                    <Link
                      to={`/checkout/payment/${encodeURIComponent(order.orderNumber)}`}
                      className="mr-3 inline-flex rounded-xl border border-brand-500 px-6 py-3 text-sm font-semibold text-brand-600"
                    >
                      Төлбөр төлөх
                    </Link>
                  ) : null}
                  <Link
                    to="/categories"
                    className="inline-flex rounded-xl bg-brand-500 px-6 py-3 text-sm font-semibold text-white"
                  >
                    Дэлгүүр хэсэх
                  </Link>
                </div>
              </article>
            )}
          </div>
        </Container>
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
}
