import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { listOrders } from '../api/commerceApi';
import { AccountShell } from '../features/account/AccountShell';
import { cartErrorMessage } from '../features/cart/cartErrorMessage';
import type { OrderSummary, Page } from '../features/checkout/order.types';
import { orderStatusLabel, paymentStatusLabel, statusTone } from '../features/checkout/orderStatus';

const money = new Intl.NumberFormat('mn-MN');
const date = new Intl.DateTimeFormat('mn-MN', { dateStyle: 'medium', timeStyle: 'short' });

export function OrdersPage() {
  const [pageNumber, setPageNumber] = useState(0);
  const [orders, setOrders] = useState<Page<OrderSummary> | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    listOrders(pageNumber)
      .then((value) => active && setOrders(value))
      .catch((failure) => active && setError(cartErrorMessage(failure)));
    return () => {
      active = false;
    };
  }, [pageNumber]);

  return (
    <AccountShell title="Миний захиалгууд">
      {error ? (
        <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      {!orders ? (
        <div
          className="h-56 animate-pulse rounded-xl bg-neutral-100"
          aria-label="Захиалгууд уншиж байна"
        />
      ) : orders.items.length === 0 ? (
        <div className="py-12 text-center text-sm text-neutral-500">
          <p>Одоогоор захиалга байхгүй байна.</p>
          <Link to="/categories" className="mt-4 inline-flex text-brand-600 underline">
            Дэлгүүр хэсэх
          </Link>
        </div>
      ) : (
        <>
          <ul className="divide-y divide-neutral-100">
            {orders.items.map((order) => (
              <li key={order.orderNumber} className="py-5 first:pt-0">
                <Link
                  to={`/account/orders/${encodeURIComponent(order.orderNumber)}`}
                  className="block rounded-xl p-3 transition hover:bg-neutral-50"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-neutral-800">{order.orderNumber}</p>
                      <p className="mt-1 text-xs text-neutral-500">
                        {date.format(new Date(order.placedAt))} · {order.itemCount} бараа
                      </p>
                    </div>
                    <strong>{money.format(order.grandTotal)}₮</strong>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs">
                    <span className={`rounded-full px-3 py-1 ${statusTone(order.orderStatus)}`}>
                      {orderStatusLabel(order.orderStatus)}
                    </span>
                    <span className={`rounded-full px-3 py-1 ${statusTone(order.paymentStatus)}`}>
                      {paymentStatusLabel(order.paymentStatus)}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
          {orders.totalPages > 1 ? (
            <div className="mt-6 flex items-center justify-between border-t pt-5 text-sm">
              <button
                type="button"
                disabled={orders.first}
                onClick={() => setPageNumber((value) => value - 1)}
                className="rounded-lg border px-4 py-2 disabled:opacity-40"
              >
                Өмнөх
              </button>
              <span>
                {orders.page + 1} / {orders.totalPages}
              </span>
              <button
                type="button"
                disabled={orders.last}
                onClick={() => setPageNumber((value) => value + 1)}
                className="rounded-lg border px-4 py-2 disabled:opacity-40"
              >
                Дараах
              </button>
            </div>
          ) : null}
        </>
      )}
    </AccountShell>
  );
}
