import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { AccountApiError, createAddress, getAddresses } from '../api/accountApi';
import { placeOrder, quoteCart } from '../api/commerceApi';
import { Container } from '../components/layout/Container';
import { Footer } from '../components/layout/Footer';
import { Header } from '../components/layout/Header';
import { MobileBottomNav } from '../components/layout/MobileBottomNav';
import { AddressForm } from '../features/account/AddressForm';
import type { Address, AddressInput } from '../features/account/account.types';
import { useAuth } from '../features/auth/useAuth';
import { cartErrorMessage } from '../features/cart/cartErrorMessage';
import type { CartQuote } from '../features/cart/cart.types';
import { useCart } from '../features/cart/useCart';
import { SELF_PICKUP_LOCATION, type DeliveryMethod } from '../features/checkout/delivery';

const money = new Intl.NumberFormat('mn-MN');
const terminalQpayInitiationErrors = new Set([
  'QPAY_AUTH_INVALID',
  'QPAY_AUTH_UNAVAILABLE',
  'QPAY_INVOICE_UNAVAILABLE',
  'QPAY_RESPONSE_INVALID',
]);
const newKey = () =>
  globalThis.crypto?.randomUUID?.() ??
  `00000000-0000-4000-8000-${Date.now().toString(16).padStart(12, '0').slice(-12)}`;

export function CheckoutPage() {
  const navigate = useNavigate();
  const { state } = useAuth();
  const { items, clearCart } = useCart();
  const [addresses, setAddresses] = useState<readonly Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('STANDARD_DELIVERY');
  const [checkoutQuote, setCheckoutQuote] = useState<CartQuote | null>(null);
  const [checkoutQuoteStatus, setCheckoutQuoteStatus] = useState<'loading' | 'ready' | 'error'>(
    'loading'
  );
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressBusy, setAddressBusy] = useState(false);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [note, setNote] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const idempotencyKey = useRef(newKey());
  const quoteRequestSequence = useRef(0);
  const orderAddressId = deliveryMethod === 'STANDARD_DELIVERY' ? selectedAddressId : null;
  const fingerprint = useMemo(
    () =>
      `${items
        .map((item) => `${item.productSlug}:${item.quantity}`)
        .join(',')}|${deliveryMethod}|${orderAddressId}|${note.trim()}`,
    [deliveryMethod, items, note, orderAddressId]
  );
  const previousFingerprint = useRef(fingerprint);

  useEffect(() => {
    if (previousFingerprint.current !== fingerprint) {
      idempotencyKey.current = newKey();
      previousFingerprint.current = fingerprint;
    }
  }, [fingerprint]);

  const loadAddresses = useCallback(async () => {
    setLoadingAddresses(true);
    try {
      const next = await getAddresses();
      setAddresses(next);
      setSelectedAddressId(
        (current) =>
          current ?? next.find((address) => address.defaultAddress)?.id ?? next[0]?.id ?? null
      );
    } catch (failure) {
      setError(cartErrorMessage(failure));
    } finally {
      setLoadingAddresses(false);
    }
  }, []);

  const refreshCheckoutQuote = useCallback(async () => {
    const sequence = ++quoteRequestSequence.current;
    setCheckoutQuote(null);
    setCheckoutQuoteStatus('loading');
    try {
      const nextQuote = await quoteCart(items, deliveryMethod);
      if (sequence === quoteRequestSequence.current) {
        setCheckoutQuote(nextQuote);
        setCheckoutQuoteStatus('ready');
      }
      return nextQuote;
    } catch (failure) {
      if (sequence === quoteRequestSequence.current) {
        setCheckoutQuoteStatus('error');
        setError(cartErrorMessage(failure));
      }
      return null;
    }
  }, [deliveryMethod, items]);

  useEffect(() => {
    void refreshCheckoutQuote();
  }, [refreshCheckoutQuote]);

  useEffect(() => {
    void loadAddresses();
  }, [loadAddresses]);

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <Header />
        <main className="py-20 text-center">
          <h1 className="text-2xl font-semibold">Сагс хоосон байна</h1>
          <Link to="/cart" className="mt-5 inline-flex text-brand-600 underline">
            Сагс руу буцах
          </Link>
        </main>
      </div>
    );
  }

  async function saveAddress(input: AddressInput) {
    setAddressBusy(true);
    setError('');
    try {
      const created = await createAddress(input);
      await loadAddresses();
      setSelectedAddressId(created.id);
      setShowAddressForm(false);
    } catch (failure) {
      setError(cartErrorMessage(failure));
    } finally {
      setAddressBusy(false);
    }
  }

  function selectDeliveryMethod(nextMethod: DeliveryMethod) {
    quoteRequestSequence.current += 1;
    setDeliveryMethod(nextMethod);
    setCheckoutQuote(null);
    setCheckoutQuoteStatus('loading');
    setConfirmed(false);
    setShowAddressForm(false);
    setError('');
  }

  async function submitOrder() {
    if (
      (deliveryMethod === 'STANDARD_DELIVERY' && !selectedAddressId) ||
      !confirmed ||
      !checkoutQuote ||
      submitting
    )
      return;
    setSubmitting(true);
    setError('');
    try {
      const finalQuote = await refreshCheckoutQuote();
      if (!finalQuote) throw new Error('Quote unavailable');
      const checkout = await placeOrder(
        {
          items,
          addressId: orderAddressId,
          deliveryMethod,
          customerNote: note.trim() || undefined,
        },
        idempotencyKey.current
      );
      clearCart();
      navigate(`/checkout/payment/${encodeURIComponent(checkout.order.orderNumber)}`, {
        replace: true,
        state: { payment: checkout.payment },
      });
    } catch (failure) {
      if (failure instanceof AccountApiError && terminalQpayInitiationErrors.has(failure.code)) {
        idempotencyKey.current = newKey();
      }
      setError(cartErrorMessage(failure));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <Header />
      <main className="pb-28 pt-8 md:py-12">
        <Container>
          <div className="px-5 md:px-0">
            <p className="text-sm font-medium text-brand-600">Захиалга баталгаажуулах</p>
            <h1 className="mt-1 text-3xl font-semibold text-neutral-800">Хүргэлт ба төлбөр</h1>
            {error ? (
              <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">
                {error}
              </p>
            ) : null}

            <div className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
              <div className="space-y-6">
                <section
                  className="rounded-2xl border bg-white p-5"
                  aria-labelledby="identity-title"
                >
                  <h2 id="identity-title" className="text-lg font-semibold">
                    Хэрэглэгч
                  </h2>
                  <p className="mt-3 text-sm text-neutral-600">
                    {state.status === 'authenticated'
                      ? `${state.user.firstName} ${state.user.lastName} · ${state.user.email}`
                      : ''}
                  </p>
                </section>

                <fieldset className="rounded-2xl border bg-white p-5">
                  <legend className="px-1 text-lg font-semibold">Хүргэлт</legend>
                  <div className="mt-3 space-y-3">
                    <label
                      className={`flex cursor-pointer gap-3 rounded-xl border p-4 text-sm transition-colors ${
                        deliveryMethod === 'STANDARD_DELIVERY'
                          ? 'border-brand-500 bg-brand-50/40'
                          : 'border-neutral-200'
                      }`}
                    >
                      <input
                        type="radio"
                        name="delivery-method"
                        value="STANDARD_DELIVERY"
                        checked={deliveryMethod === 'STANDARD_DELIVERY'}
                        onChange={() => selectDeliveryMethod('STANDARD_DELIVERY')}
                      />
                      <span>
                        <strong>Стандарт хүргэлт</strong>
                        <span className="mt-1 block text-neutral-500">
                          {deliveryMethod === 'STANDARD_DELIVERY' && checkoutQuote
                            ? `${money.format(checkoutQuote.shippingAmount)}₮`
                            : deliveryMethod === 'STANDARD_DELIVERY'
                            ? 'Сервер тооцоолж байна…'
                            : 'Хаягаар хүргэнэ'}
                        </span>
                      </span>
                    </label>

                    <label
                      className={`flex cursor-pointer gap-3 rounded-xl border p-4 text-sm transition-colors ${
                        deliveryMethod === 'SELF_PICKUP'
                          ? 'border-brand-500 bg-brand-50/40'
                          : 'border-neutral-200'
                      }`}
                    >
                      <input
                        type="radio"
                        name="delivery-method"
                        value="SELF_PICKUP"
                        checked={deliveryMethod === 'SELF_PICKUP'}
                        onChange={() => selectDeliveryMethod('SELF_PICKUP')}
                      />
                      <span className="min-w-0">
                        <strong>Хүргэлтгүй — өөрөө авах</strong>
                        <span className="mt-1 block text-neutral-500">
                          {deliveryMethod === 'SELF_PICKUP' && checkoutQuote
                            ? `${money.format(checkoutQuote.shippingAmount)}₮`
                            : deliveryMethod === 'SELF_PICKUP'
                            ? 'Сервер тооцоолж байна…'
                            : 'Хүргэлтийн төлбөргүй'}
                        </span>
                        <span className="mt-3 block rounded-lg bg-white/80 p-3 leading-6 text-neutral-600">
                          <span className="font-medium text-brand-600">
                            {SELF_PICKUP_LOCATION.label}
                          </span>
                          <span className="block font-medium text-neutral-800">
                            {SELF_PICKUP_LOCATION.name}
                          </span>
                          <span className="block">{SELF_PICKUP_LOCATION.address}</span>
                          <span className="block">{SELF_PICKUP_LOCATION.hours}</span>
                          <span className="block">Утас: {SELF_PICKUP_LOCATION.phone}</span>
                        </span>
                      </span>
                    </label>
                  </div>
                </fieldset>

                {deliveryMethod === 'STANDARD_DELIVERY' ? (
                  <section
                    className="rounded-2xl border bg-white p-5"
                    aria-labelledby="address-title"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <h2 id="address-title" className="text-lg font-semibold">
                        Хүргэлтийн хаяг
                      </h2>
                      <div className="flex gap-3 text-sm text-brand-600">
                        <Link to="/account/addresses" className="underline">
                          Засах
                        </Link>
                        <button
                          type="button"
                          onClick={() => setShowAddressForm((value) => !value)}
                          className="underline"
                        >
                          {showAddressForm ? 'Болих' : 'Шинэ хаяг'}
                        </button>
                      </div>
                    </div>
                    {loadingAddresses ? (
                      <div className="mt-4 h-24 animate-pulse rounded-xl bg-neutral-100" />
                    ) : null}
                    <div className="mt-4 space-y-3">
                      {addresses.map((address) => (
                        <label
                          key={address.id}
                          className={`flex cursor-pointer gap-3 rounded-xl border p-4 ${
                            selectedAddressId === address.id
                              ? 'border-brand-500 bg-brand-50/40'
                              : 'border-neutral-200'
                          }`}
                        >
                          <input
                            type="radio"
                            name="address"
                            checked={selectedAddressId === address.id}
                            onChange={() => setSelectedAddressId(address.id)}
                          />
                          <span className="min-w-0 text-sm">
                            <strong className="block break-words text-neutral-800">
                              {address.cityOrProvince}, {address.districtOrSoum},{' '}
                              {address.khorooOrBag ? `${address.khorooOrBag}, ` : ''}
                              {address.addressLine}
                            </strong>
                            {address.additionalDetails ? (
                              <span className="mt-1 block text-neutral-500">
                                {address.additionalDetails}
                              </span>
                            ) : null}
                            <span className="mt-1 block text-neutral-500">
                              {address.recipientPhone}
                            </span>
                          </span>
                        </label>
                      ))}
                    </div>
                    {addresses.length === 0 && !loadingAddresses && !showAddressForm ? (
                      <p className="mt-4 text-sm text-amber-700">
                        Захиалга хийхийн тулд хүргэлтийн хаяг нэмнэ үү.
                      </p>
                    ) : null}
                    {showAddressForm ? (
                      <div className="mt-5">
                        <AddressForm
                          editing={null}
                          onSubmit={saveAddress}
                          onCancel={() => setShowAddressForm(false)}
                          busy={addressBusy}
                        />
                      </div>
                    ) : null}
                  </section>
                ) : null}

                <section className="rounded-2xl border bg-white p-5">
                  <h2 className="text-lg font-semibold">Төлбөрийн хэлбэр</h2>
                  <label className="mt-4 flex gap-3 rounded-xl border border-brand-500 bg-brand-50/40 p-4 text-sm">
                    <input type="radio" checked readOnly />
                    <span>
                      <strong>QPay-аар төлөх</strong>
                      <span className="mt-1 block text-neutral-500">
                        Захиалга хийсний дараа QR код болон банкны аппын холбоос гарна.
                      </span>
                    </span>
                  </label>
                  <label className="mt-4 block text-sm font-medium">
                    Захиалгын тайлбар
                    <textarea
                      value={note}
                      maxLength={500}
                      onChange={(event) => setNote(event.target.value)}
                      className="mt-2 min-h-24 w-full rounded-xl border border-neutral-300 p-3 font-normal outline-none focus:border-brand-500"
                    />
                  </label>
                </section>
              </div>

              <aside
                className="rounded-2xl border bg-white p-5 lg:sticky lg:top-5"
                aria-label="Захиалгын хураангуй"
              >
                <h2 className="text-lg font-semibold">Захиалгын хураангуй</h2>
                {checkoutQuote ? (
                  <>
                    <ul className="mt-4 space-y-3 border-b pb-4">
                      {checkoutQuote.items.map((line) => (
                        <li key={line.productSlug} className="flex justify-between gap-3 text-sm">
                          <span className="min-w-0 text-neutral-600">
                            {line.productName} × {line.requestedQuantity}
                          </span>
                          <span className="shrink-0 font-medium">
                            {money.format(line.lineSubtotal)}₮
                          </span>
                        </li>
                      ))}
                    </ul>
                    <dl className="mt-4 space-y-3 text-sm">
                      <div className="flex justify-between">
                        <dt>Барааны дүн</dt>
                        <dd>{money.format(checkoutQuote.regularSubtotal)}₮</dd>
                      </div>
                      <div className="flex justify-between text-emerald-700">
                        <dt>Нийт хөнгөлөлт</dt>
                        <dd>−{money.format(checkoutQuote.discountTotal)}₮</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt>Хүргэлт</dt>
                        <dd>{money.format(checkoutQuote.shippingAmount)}₮</dd>
                      </div>
                      <div className="flex justify-between border-t pt-4 text-base font-semibold">
                        <dt>Төлөх нийт</dt>
                        <dd>{money.format(checkoutQuote.grandTotal)}₮</dd>
                      </div>
                    </dl>
                  </>
                ) : (
                  <div className="mt-4 h-32 animate-pulse rounded-xl bg-neutral-100" />
                )}
                <label className="mt-6 flex gap-3 text-sm leading-5 text-neutral-600">
                  <input
                    type="checkbox"
                    checked={confirmed}
                    onChange={(event) => setConfirmed(event.target.checked)}
                    className="mt-1"
                  />
                  {deliveryMethod === 'SELF_PICKUP'
                    ? 'Захиалгын мэдээлэл болон өөрөө авах байршил зөв болохыг баталж байна.'
                    : 'Захиалгын мэдээлэл болон хүргэлтийн хаяг зөв болохыг баталж байна.'}
                </label>
                <button
                  type="button"
                  onClick={() => void submitOrder()}
                  disabled={
                    !checkoutQuote ||
                    checkoutQuoteStatus === 'loading' ||
                    (deliveryMethod === 'STANDARD_DELIVERY' && !selectedAddressId) ||
                    !confirmed ||
                    submitting
                  }
                  className="mt-5 w-full rounded-xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-neutral-300"
                >
                  {submitting ? 'Захиалга үүсгэж байна…' : 'Захиалга хийх'}
                </button>
                <Link
                  to="/cart"
                  className="mt-3 flex justify-center py-2 text-sm text-neutral-500 underline"
                >
                  Сагс руу буцах
                </Link>
              </aside>
            </div>
          </div>
        </Container>
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
}
