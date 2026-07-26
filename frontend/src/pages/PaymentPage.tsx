import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { checkPayment, getPayment } from '../api/commerceApi';
import { Container } from '../components/layout/Container';
import { Footer } from '../components/layout/Footer';
import { Header } from '../components/layout/Header';
import { MobileBottomNav } from '../components/layout/MobileBottomNav';
import { cartErrorMessage } from '../features/cart/cartErrorMessage';
import type { PaymentInstructions } from '../features/checkout/order.types';

const money = new Intl.NumberFormat('mn-MN');
const date = new Intl.DateTimeFormat('mn-MN', { dateStyle: 'medium', timeStyle: 'short' });

export function PaymentPage() {
  const { orderNumber = '' } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const initialPayment = (location.state as { payment?: PaymentInstructions } | null)?.payment;
  const [payment, setPayment] = useState<PaymentInstructions | null>(initialPayment ?? null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    try {
      setPayment(await getPayment(orderNumber));
      setError('');
    } catch (failure) {
      setError(cartErrorMessage(failure));
    }
  }, [orderNumber]);

  useEffect(() => {
    if (!initialPayment) void refresh();
  }, [initialPayment, refresh]);

  useEffect(() => {
    if (
      payment?.status === 'PAID' ||
      payment?.status === 'EXPIRED' ||
      payment?.status === 'FAILED' ||
      payment?.status === 'RECONCILIATION_REQUIRED'
    ) {
      return;
    }
    const timer = window.setInterval(() => void refresh(), 4000);
    return () => window.clearInterval(timer);
  }, [payment?.status, refresh]);

  useEffect(() => {
    if (payment?.status === 'PAID') {
      navigate(`/checkout/success/${encodeURIComponent(orderNumber)}`, { replace: true });
    }
  }, [navigate, orderNumber, payment?.status]);

  async function verifyNow() {
    if (checking) return;
    setChecking(true);
    setError('');
    try {
      setPayment(await checkPayment(orderNumber));
    } catch (failure) {
      setError(cartErrorMessage(failure));
    } finally {
      setChecking(false);
    }
  }

  const expired = payment?.status === 'EXPIRED';

  return (
    <div className="min-h-screen bg-neutral-50">
      <Header />
      <main className="pb-28 pt-8 md:py-12">
        <Container>
          <div className="mx-5 max-w-3xl md:mx-auto">
            <article className="rounded-2xl border bg-white p-5 shadow-sm sm:p-8">
              <p className="text-sm font-medium text-brand-600">QPay төлбөр</p>
              <h1 className="mt-1 text-2xl font-semibold text-neutral-800">Захиалгын QR код</h1>
              <p className="mt-2 break-all text-sm text-neutral-500">{orderNumber}</p>

              {error ? (
                <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">
                  {error}
                </p>
              ) : null}

              {!payment ? (
                <div
                  className="mt-8 h-96 animate-pulse rounded-2xl bg-neutral-100"
                  aria-label="Төлбөрийн мэдээлэл уншиж байна"
                />
              ) : (
                <div className="mt-8 grid items-start gap-8 md:grid-cols-[280px_minmax(0,1fr)]">
                  <div className="rounded-2xl border bg-white p-4">
                    {payment.qrImageDataUrl ? (
                      <img
                        src={payment.qrImageDataUrl}
                        alt="QPay төлбөрийн QR код"
                        loading="eager"
                        decoding="async"
                        className="aspect-square w-full object-contain"
                      />
                    ) : (
                      <div className="flex aspect-square items-center justify-center bg-neutral-50 text-center text-sm text-neutral-500">
                        QR код үүссэнгүй
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="text-sm text-neutral-500">Төлөх дүн</p>
                    <p className="mt-1 text-3xl font-semibold text-neutral-900">
                      {money.format(payment.amount)}₮
                    </p>
                    <p className="mt-3 text-sm text-neutral-500">
                      Хугацаа: {date.format(new Date(payment.expiresAt))}
                    </p>
                    {expired ? (
                      <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
                        Төлбөрийн хугацаа дууссан. Захиалга цуцлагдаж, барааны үлдэгдэл буцаагдлаа.
                      </p>
                    ) : (
                      <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
                        Банкны апп-аар QR уншуулах эсвэл доорх апп-аас сонгоно уу.
                      </p>
                    )}

                    {payment.deeplinks.length > 0 ? (
                      <div className="mt-5 grid grid-cols-2 gap-3">
                        {payment.deeplinks.map((deeplink) => (
                          <a
                            key={`${deeplink.name}-${deeplink.link}`}
                            href={deeplink.link}
                            className="flex min-h-12 items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium hover:border-brand-400"
                          >
                            {deeplink.logoUrl ? (
                              <img
                                src={deeplink.logoUrl}
                                alt=""
                                loading="lazy"
                                decoding="async"
                                className="h-7 w-7 rounded-md object-contain"
                              />
                            ) : null}
                            <span className="truncate">{deeplink.name}</span>
                          </a>
                        ))}
                      </div>
                    ) : null}

                    <button
                      type="button"
                      onClick={verifyNow}
                      disabled={checking || expired}
                      className="mt-6 w-full rounded-xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {checking ? 'Шалгаж байна…' : 'Төлбөр шалгах'}
                    </button>
                    <Link
                      to="/account/orders"
                      className="mt-4 block text-center text-sm text-brand-600 underline"
                    >
                      Миний захиалгууд
                    </Link>
                  </div>
                </div>
              )}
            </article>
          </div>
        </Container>
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
}
