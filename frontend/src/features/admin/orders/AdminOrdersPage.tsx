import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listAdminOrders } from '../../../api/adminApi';
import { cartErrorMessage } from '../../cart/cartErrorMessage';
import { orderStatusLabel, paymentStatusLabel, statusTone } from '../../checkout/orderStatus';
import type { AdminOrderSummary, Page } from '../admin.types';
import { AdminShell } from '../layout/AdminShell';
import {
  ErrorNotice,
  LoadingPanel,
  Pagination,
  SearchInput,
  input,
  panel,
} from '../components/AdminUi';
import { adminDateTime, adminMoney } from '../adminLocale';

export function AdminOrdersPage() {
  const [search, setSearch] = useState('');
  const [orderStatus, setOrderStatus] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [pageNumber, setPageNumber] = useState(0);
  const [result, setResult] = useState<Page<AdminOrderSummary> | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      void listAdminOrders({ page: pageNumber, size: 20, search, orderStatus, paymentStatus }).then(
        (orders) => {
          if (!active) return;
          setResult(orders);
          setError('');
        },
        (failure) => {
          if (active) setError(cartErrorMessage(failure));
        }
      );
    }, 250);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [orderStatus, pageNumber, paymentStatus, search]);

  return (
    <AdminShell
      title="Захиалга"
      description="Хэрэглэгчийн захиалга, хүргэлт болон төлбөрийн төлөв."
    >
      <div className={`${panel} mb-6 grid gap-3 p-4 md:grid-cols-3`}>
        <SearchInput
          value={search}
          onChange={(value) => {
            setSearch(value);
            setPageNumber(0);
          }}
          placeholder="Захиалга, нэр, имэйл"
          label="Захиалга хайх"
        />
        <label className="text-xs font-medium text-slate-500">
          Захиалгын төлөв
          <select
            value={orderStatus}
            onChange={(event) => {
              setOrderStatus(event.target.value);
              setPageNumber(0);
            }}
            className={`${input} mt-1`}
          >
            <option value="">Бүгд</option>
            <option value="PENDING_PAYMENT">Төлбөр хүлээж байна</option>
            <option value="CONFIRMED">Баталгаажсан</option>
            <option value="PROCESSING">Бэлтгэж байна</option>
            <option value="SHIPPED">Хүргэлтэд гарсан</option>
            <option value="DELIVERED">Хүргэгдсэн</option>
            <option value="CANCELLED">Цуцлагдсан</option>
          </select>
        </label>
        <label className="text-xs font-medium text-slate-500">
          Төлбөрийн төлөв
          <select
            value={paymentStatus}
            onChange={(event) => {
              setPaymentStatus(event.target.value);
              setPageNumber(0);
            }}
            className={`${input} mt-1`}
          >
            <option value="">Бүгд</option>
            <option value="PENDING">Хүлээгдэж байна</option>
            <option value="PAID">Төлөгдсөн</option>
            <option value="FAILED">Амжилтгүй</option>
            <option value="EXPIRED">Хугацаа дууссан</option>
            <option value="REFUNDED">Буцаагдсан</option>
          </select>
        </label>
      </div>
      {error ? (
        <div className="mb-4">
          <ErrorNotice message={error} />
        </div>
      ) : null}
      {!result && !error ? <LoadingPanel /> : null}
      {result ? (
        <div className={`${panel} overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-4">Захиалга</th>
                  <th className="px-5 py-4">Хэрэглэгч</th>
                  <th className="px-5 py-4">Төлөв</th>
                  <th className="px-5 py-4">Төлбөр</th>
                  <th className="px-5 py-4 text-right">Нийт</th>
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
                        {adminDateTime.format(new Date(order.placedAt))}
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
                      {adminMoney.format(order.grandTotal)}₮
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {result && result.items.length === 0 ? (
            <p className="p-10 text-center text-sm text-slate-500">Захиалга олдсонгүй.</p>
          ) : null}
          {result && result.totalPages > 1 ? (
            <Pagination
              page={result.page}
              totalPages={result.totalPages}
              totalElements={result.totalElements}
              first={result.first}
              last={result.last}
              noun="захиалга"
              onPageChange={setPageNumber}
            />
          ) : null}
        </div>
      ) : null}
    </AdminShell>
  );
}
