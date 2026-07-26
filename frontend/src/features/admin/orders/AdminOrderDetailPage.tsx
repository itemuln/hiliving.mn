import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getAdminOrder, updateAdminOrderStatus } from '../../../api/adminApi';
import { cartErrorMessage } from '../../cart/cartErrorMessage';
import { orderStatusLabel, paymentStatusLabel, statusTone } from '../../checkout/orderStatus';
import type { AdminOrderDetail } from '../admin.types';
import { AdminShell } from '../layout/AdminShell';

const money = new Intl.NumberFormat('mn-MN');
const standardNextStatus: Record<string, string> = {
  CONFIRMED: 'PROCESSING',
  PROCESSING: 'SHIPPED',
  SHIPPED: 'DELIVERED',
};

function nextStatus(order: AdminOrderDetail['order']) {
  if (order.deliveryMethod === 'SELF_PICKUP' && order.orderStatus === 'PROCESSING') {
    return 'DELIVERED';
  }
  return standardNextStatus[order.orderStatus];
}

export function AdminOrderDetailPage() {
  const { orderNumber = '' } = useParams();
  const [detail, setDetail] = useState<AdminOrderDetail | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setDetail(await getAdminOrder(orderNumber));
      setError('');
    } catch (failure) {
      setError(cartErrorMessage(failure));
    }
  }, [orderNumber]);

  useEffect(() => {
    void load();
  }, [load]);

  async function advance() {
    if (!detail || busy) return;
    const status = nextStatus(detail.order);
    if (!status) return;
    setBusy(true);
    try {
      await updateAdminOrderStatus(orderNumber, status);
      await load();
    } catch (failure) {
      setError(cartErrorMessage(failure));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminShell
      title={orderNumber || 'Order'}
      description="Order, customer, delivery, and payment details"
      actions={
        <Link to="/admin/orders" className="rounded-lg border bg-white px-4 py-2 text-sm">
          Back to orders
        </Link>
      }
    >
      {error ? (
        <p role="alert" className="mb-4 rounded-xl bg-red-50 p-4 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      {!detail ? (
        <div className="h-80 animate-pulse rounded-2xl bg-white" aria-label="Order loading" />
      ) : (
        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-6">
            <section className="rounded-2xl border bg-white p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-slate-500">Customer</p>
                  <h2 className="mt-1 font-semibold">{detail.customerName}</h2>
                  <p className="text-sm text-slate-500">{detail.customerEmail}</p>
                </div>
                <div className="flex gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs ${statusTone(
                      detail.order.orderStatus
                    )}`}
                  >
                    {orderStatusLabel(detail.order.orderStatus)}
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs ${statusTone(
                      detail.order.paymentStatus
                    )}`}
                  >
                    {paymentStatusLabel(detail.order.paymentStatus)}
                  </span>
                </div>
              </div>
            </section>
            <section className="rounded-2xl border bg-white p-6">
              <h2 className="font-semibold">Items</h2>
              <ul className="mt-4 divide-y">
                {detail.order.items.map((item) => (
                  <li
                    key={`${item.productSlug}-${item.sku}`}
                    className="flex items-center gap-3 py-4"
                  >
                    <img
                      src={item.primaryImageUrl ?? '/product-cleaner.svg'}
                      alt={item.productName}
                      className="h-14 w-14 rounded-lg border object-contain"
                    />
                    <span className="min-w-0 flex-1 text-sm">
                      {item.productName}
                      <small className="block text-slate-400">
                        {item.quantity} × {money.format(item.unitEffectivePrice)}₮
                      </small>
                    </span>
                    <strong className="text-sm">{money.format(item.lineTotal)}₮</strong>
                  </li>
                ))}
              </ul>
            </section>
          </div>
          <aside className="space-y-6">
            <section className="rounded-2xl border bg-white p-6">
              <h2 className="font-semibold">
                {detail.order.deliveryMethod === 'SELF_PICKUP' ? 'Pickup' : 'Fulfillment'}
              </h2>
              <p className="mt-4 text-sm leading-6 text-slate-600">
                {detail.order.address.recipientName} · {detail.order.address.recipientPhone}
                <br />
                {detail.order.address.cityOrProvince}, {detail.order.address.districtOrSoum},{' '}
                {detail.order.address.addressLine}
                {detail.order.address.additionalDetails ? (
                  <>
                    <br />
                    {detail.order.address.additionalDetails}
                  </>
                ) : null}
              </p>
              {nextStatus(detail.order) ? (
                <button
                  type="button"
                  onClick={advance}
                  disabled={busy}
                  className="mt-5 w-full rounded-xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {busy
                    ? 'Updating…'
                    : detail.order.deliveryMethod === 'SELF_PICKUP' &&
                      nextStatus(detail.order) === 'DELIVERED'
                    ? 'Mark collected'
                    : `Mark ${nextStatus(detail.order)?.toLowerCase()}`}
                </button>
              ) : null}
            </section>
            <section className="rounded-2xl border bg-white p-6">
              <h2 className="font-semibold">Summary</h2>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt>Subtotal</dt>
                  <dd>{money.format(detail.order.effectiveSubtotal)}₮</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Shipping</dt>
                  <dd>{money.format(detail.order.shippingTotal)}₮</dd>
                </div>
                <div className="flex justify-between border-t pt-3 text-base font-semibold">
                  <dt>Total</dt>
                  <dd>{money.format(detail.order.grandTotal)}₮</dd>
                </div>
              </dl>
            </section>
          </aside>
        </div>
      )}
    </AdminShell>
  );
}
