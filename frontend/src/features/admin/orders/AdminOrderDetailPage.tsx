import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { getAdminOrder, updateAdminOrderStatus } from '../../../api/adminApi';
import { cartErrorMessage } from '../../cart/cartErrorMessage';
import { orderStatusLabel, paymentStatusLabel, statusTone } from '../../checkout/orderStatus';
import type { AdminOrderDetail } from '../admin.types';
import { AdminShell } from '../layout/AdminShell';
import {
  ErrorNotice,
  LoadingPanel,
  panel,
  primaryButton,
  secondaryButton,
} from '../components/AdminUi';
import { adminMoney } from '../adminLocale';

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

function nextStatusAction(order: AdminOrderDetail['order']) {
  const status = nextStatus(order);
  if (order.deliveryMethod === 'SELF_PICKUP' && status === 'DELIVERED') return 'Хүлээлгэн өгсөн';
  if (status === 'PROCESSING') return 'Бэлтгэж эхлэх';
  if (status === 'SHIPPED') return 'Хүргэлтэд гаргах';
  if (status === 'DELIVERED') return 'Хүргэгдсэн болгох';
  return null;
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
      title={orderNumber || 'Захиалга'}
      description="Захиалга, хэрэглэгч, хүргэлт болон төлбөрийн дэлгэрэнгүй."
      actions={
        <Link to="/admin/orders" className={secondaryButton}>
          Захиалга руу буцах
        </Link>
      }
    >
      {error ? (
        <div className="mb-4">
          <ErrorNotice message={error} />
        </div>
      ) : null}
      {!detail ? (
        <LoadingPanel />
      ) : (
        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-6">
            <section className={`${panel} p-6`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-slate-500">Хэрэглэгч</p>
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
            <section className={`${panel} p-6`}>
              <h2 className="font-semibold">Бүтээгдэхүүн</h2>
              <ul className="mt-4 divide-y">
                {detail.order.items.map((item) => (
                  <li
                    key={`${item.productSlug}-${item.sku}`}
                    className="flex items-center gap-3 py-4"
                  >
                    <img
                      src={item.primaryImageUrl ?? '/product-cleaner.svg'}
                      alt={item.productName}
                      loading="lazy"
                      className="h-14 w-14 rounded-lg border object-contain"
                    />
                    <span className="min-w-0 flex-1 text-sm">
                      {item.productName}
                      <small className="block text-slate-400">
                        {item.quantity} × {adminMoney.format(item.unitEffectivePrice)}₮
                      </small>
                    </span>
                    <strong className="text-sm">{adminMoney.format(item.lineTotal)}₮</strong>
                  </li>
                ))}
              </ul>
            </section>
          </div>
          <aside className="space-y-6">
            <section className={`${panel} p-6`}>
              <h2 className="font-semibold">
                {detail.order.deliveryMethod === 'SELF_PICKUP' ? 'Өөрөө авах' : 'Хүргэлт'}
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
                  className={`${primaryButton} mt-5 w-full`}
                >
                  {busy ? 'Шинэчилж байна…' : nextStatusAction(detail.order)}
                </button>
              ) : null}
            </section>
            <section className={`${panel} p-6`}>
              <h2 className="font-semibold">Төлбөрийн задаргаа</h2>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt>Барааны дүн</dt>
                  <dd>{adminMoney.format(detail.order.effectiveSubtotal)}₮</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Хүргэлт</dt>
                  <dd>{adminMoney.format(detail.order.shippingTotal)}₮</dd>
                </div>
                <div className="flex justify-between border-t pt-3 text-base font-semibold">
                  <dt>Нийт</dt>
                  <dd>{adminMoney.format(detail.order.grandTotal)}₮</dd>
                </div>
              </dl>
            </section>
          </aside>
        </div>
      )}
    </AdminShell>
  );
}
