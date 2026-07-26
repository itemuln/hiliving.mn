import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listAdminOrders } from '../../../api/adminApi';
import { cartErrorMessage } from '../../cart/cartErrorMessage';
import { orderStatusLabel, paymentStatusLabel, statusTone } from '../../checkout/orderStatus';
import type { AdminOrderSummary, Page } from '../admin.types';
import { AdminShell } from '../layout/AdminShell';

const money = new Intl.NumberFormat('mn-MN');
const date = new Intl.DateTimeFormat('mn-MN', { dateStyle: 'medium', timeStyle: 'short' });

export function AdminOrdersPage() {
  const [search, setSearch] = useState('');
  const [orderStatus, setOrderStatus] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [pageNumber, setPageNumber] = useState(0);
  const [result, setResult] = useState<Page<AdminOrderSummary> | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setResult(
        await listAdminOrders({ page: pageNumber, size: 20, search, orderStatus, paymentStatus })
      );
      setError('');
    } catch (failure) {
      setError(cartErrorMessage(failure));
    }
  }, [orderStatus, pageNumber, paymentStatus, search]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 250);
    return () => window.clearTimeout(timer);
  }, [load]);

  return (
    <AdminShell title="Orders" description="All customer orders and payment states">
      <div className="mb-6 grid gap-3 rounded-2xl border bg-white p-4 md:grid-cols-3">
        <label className="text-xs font-medium text-slate-500">
          Search
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPageNumber(0);
            }}
            placeholder="Order, name, email"
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm text-slate-800"
          />
        </label>
        <label className="text-xs font-medium text-slate-500">
          Order status
          <select
            value={orderStatus}
            onChange={(event) => {
              setOrderStatus(event.target.value);
              setPageNumber(0);
            }}
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm text-slate-800"
          >
            <option value="">All</option>
            <option value="PENDING_PAYMENT">Pending payment</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="PROCESSING">Processing</option>
            <option value="SHIPPED">Shipped</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </label>
        <label className="text-xs font-medium text-slate-500">
          Payment status
          <select
            value={paymentStatus}
            onChange={(event) => {
              setPaymentStatus(event.target.value);
              setPageNumber(0);
            }}
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm text-slate-800"
          >
            <option value="">All</option>
            <option value="PENDING">Pending</option>
            <option value="PAID">Paid</option>
            <option value="FAILED">Failed</option>
            <option value="EXPIRED">Expired</option>
            <option value="REFUNDED">Refunded</option>
          </select>
        </label>
      </div>
      {error ? (
        <p role="alert" className="mb-4 rounded-xl bg-red-50 p-4 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      <div className="overflow-hidden rounded-2xl border bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-4">Order</th>
                <th className="px-5 py-4">Customer</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Payment</th>
                <th className="px-5 py-4 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {result?.items.map((order) => (
                <tr key={order.orderNumber} className="hover:bg-slate-50">
                  <td className="px-5 py-4">
                    <Link
                      to={`/admin/orders/${encodeURIComponent(order.orderNumber)}`}
                      className="font-semibold text-brand-600"
                    >
                      {order.orderNumber}
                    </Link>
                    <span className="mt-1 block text-xs text-slate-400">
                      {date.format(new Date(order.placedAt))}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    {order.customerName}
                    <span className="block text-xs text-slate-400">{order.customerEmail}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs ${statusTone(
                        order.orderStatus
                      )}`}
                    >
                      {orderStatusLabel(order.orderStatus)}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs ${statusTone(
                        order.paymentStatus
                      )}`}
                    >
                      {paymentStatusLabel(order.paymentStatus)}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right font-semibold">
                    {money.format(order.grandTotal)}₮
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {result && result.items.length === 0 ? (
          <p className="p-10 text-center text-sm text-slate-500">No orders found.</p>
        ) : null}
        {result && result.totalPages > 1 ? (
          <div className="flex items-center justify-between border-t p-4 text-sm">
            <button
              type="button"
              disabled={result.first}
              onClick={() => setPageNumber((value) => value - 1)}
              className="rounded-lg border px-4 py-2 disabled:opacity-40"
            >
              Previous
            </button>
            <span>
              {result.page + 1} / {result.totalPages}
            </span>
            <button
              type="button"
              disabled={result.last}
              onClick={() => setPageNumber((value) => value + 1)}
              className="rounded-lg border px-4 py-2 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        ) : null}
      </div>
    </AdminShell>
  );
}
