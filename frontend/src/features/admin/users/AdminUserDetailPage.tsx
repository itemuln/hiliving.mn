import { useEffect, useState } from 'react';
import { ArrowLeft, Ban, CheckCircle2, Eye, MapPin, Truck } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import * as api from '../../../api/adminApi';
import type { Address } from '../../account/account.types';
import { orderStatusLabel, paymentStatusLabel, statusTone } from '../../checkout/orderStatus';
import type { AdminUser, AdminUserOrderOverview } from '../admin.types';
import { AdminShell } from '../layout/AdminShell';
import {
  ErrorNotice,
  Field,
  LoadingPanel,
  Pagination,
  StatusBadge,
  input,
  panel,
  primaryButton,
  secondaryButton,
} from '../components/AdminUi';
import { AdminNumberInput } from '../components/AdminNumberInput';
import { accountStatusLabel, adminDateTime, adminMoney, membershipLabel } from '../adminLocale';

const addressText = (address: Address) =>
  [address.cityOrProvince, address.districtOrSoum, address.khorooOrBag, address.addressLine]
    .filter(Boolean)
    .join(', ');

export function AdminUserDetailPage() {
  const { id } = useParams();
  const userId = Number(id);
  const navigate = useNavigate();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [orderOverview, setOrderOverview] = useState<AdminUserOrderOverview | null>(null);
  const [orderPage, setOrderPage] = useState(0);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [discount, setDiscount] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    setError('');
    void Promise.all([api.getUser(userId), api.getUserAddresses(userId)])
      .then(([nextUser, nextAddresses]) => {
        if (!active) return;
        setUser(nextUser);
        setDiscount(nextUser.membership.discountOverridePercentage);
        setAddresses(nextAddresses);
      })
      .catch(() => {
        if (active) setError('Хэрэглэгчийн мэдээллийг уншиж чадсангүй.');
      });
    return () => {
      active = false;
    };
  }, [userId]);

  useEffect(() => {
    let active = true;
    setOrdersLoading(true);
    void api.getUserOrders(userId, orderPage).then(
      (overview) => {
        if (!active) return;
        setOrderOverview(overview);
        setOrdersLoading(false);
      },
      () => {
        if (!active) return;
        setError('Захиалгын түүхийг уншиж чадсангүй.');
        setOrdersLoading(false);
      }
    );
    return () => {
      active = false;
    };
  }, [orderPage, userId]);

  const primaryAddress =
    addresses.find((address) => address.defaultAddress) ?? addresses[0] ?? null;

  const mutate = async (action: () => Promise<AdminUser>) => {
    setSaving(true);
    setError('');
    try {
      setUser(await action());
    } catch {
      setError('Бүртгэлийн өөрчлөлтийг хадгалж чадсангүй.');
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <AdminShell
        title="Хэрэглэгчийн мэдээлэл"
        actions={
          <button className={secondaryButton} onClick={() => navigate('/admin/users')}>
            <ArrowLeft className="mr-2" size={17} />
            Буцах
          </button>
        }
      >
        {error ? <ErrorNotice message={error} /> : <LoadingPanel />}
      </AdminShell>
    );
  }

  return (
    <AdminShell
      title="Хэрэглэгчийн мэдээлэл"
      description={`${user.firstName} ${user.lastName} хэрэглэгчийн бүртгэл ба захиалгын түүх.`}
      actions={
        <button className={secondaryButton} onClick={() => navigate('/admin/users')}>
          <ArrowLeft className="mr-2" size={17} />
          Жагсаалт руу буцах
        </button>
      }
    >
      {error && (
        <div className="mb-5">
          <ErrorNotice message={error} />
        </div>
      )}

      <div className="grid items-start gap-5 xl:grid-cols-[21rem_minmax(0,1fr)]">
        <aside className="grid gap-5">
          <section className={`${panel} overflow-hidden`}>
            <div className="p-5 sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-lg text-slate-900">
                    <h2>
                      {user.firstName} {user.lastName}
                    </h2>
                    {user.emailVerified && (
                      <CheckCircle2
                        size={18}
                        className="text-emerald-500"
                        aria-label="Имэйл баталгаажсан"
                      />
                    )}
                  </div>
                  <StatusBadge
                    tone={
                      user.status === 'ACTIVE'
                        ? 'success'
                        : user.status === 'DISABLED'
                        ? 'danger'
                        : 'warning'
                    }
                  >
                    {accountStatusLabel(user.status)}
                  </StatusBadge>
                </div>
                <span className="rounded-lg bg-brand-50 px-2.5 py-1 text-xs text-brand-600">
                  {membershipLabel(user.membership.code)}
                </span>
              </div>
              <dl className="mt-5 space-y-3 text-sm text-slate-600">
                <div>
                  <dt className="text-xs text-slate-400">Имэйл</dt>
                  <dd className="mt-0.5 break-all">{user.email}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-400">Утасны дугаар</dt>
                  <dd className="mt-0.5">{user.phoneNumber}</dd>
                </div>
                <div>
                  <dt className="flex items-center gap-1 text-xs text-slate-400">
                    <MapPin size={13} /> Хүргүүлэх хаяг
                  </dt>
                  <dd className="mt-0.5">
                    {primaryAddress ? addressText(primaryAddress) : 'Хадгалсан хаяг алга'}
                  </dd>
                  {addresses.length > 1 && (
                    <dd className="mt-1 text-xs text-slate-400">Нийт {addresses.length} хаяг</dd>
                  )}
                </div>
              </dl>
            </div>
          </section>

          <section className={`${panel} p-5 sm:p-6`}>
            <h2 className="text-base text-slate-900">Бүртгэл удирдах</h2>
            <div className="mt-4 grid gap-4">
              <Field label="Гишүүнчлэл">
                <select
                  className={input}
                  value={user.membership.code}
                  disabled={saving}
                  onChange={(event) =>
                    void mutate(() => api.updateUserMembership(userId, event.target.value))
                  }
                >
                  {['REGULAR', 'BRONZE', 'SILVER', 'GOLD'].map((code) => (
                    <option key={code} value={code}>
                      {membershipLabel(code)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Бүртгэлийн төлөв">
                <select
                  aria-label="Бүртгэлийн төлөв"
                  className={input}
                  value={user.status}
                  disabled={saving}
                  onChange={(event) =>
                    void mutate(() => api.updateUserStatus(userId, event.target.value))
                  }
                >
                  <option value="ACTIVE">Идэвхтэй</option>
                  <option value="DISABLED">Идэвхгүй</option>
                  <option value="LOCKED">Түгжигдсэн</option>
                </select>
              </Field>
              <Field
                label="Үйлчлэх хөнгөлөлт"
                hint={`Хоосон бол үндсэн ${user.membership.defaultDiscountPercentage}% хөнгөлөлт үйлчилнэ.`}
              >
                <AdminNumberInput
                  min="0"
                  max="100"
                  step="0.01"
                  className={input}
                  placeholder="Жишээ: 5"
                  value={discount}
                  nullable
                  onValueChange={setDiscount}
                />
              </Field>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  className={primaryButton}
                  disabled={saving}
                  onClick={() => void mutate(() => api.updateUserDiscount(userId, discount))}
                >
                  Хадгалах
                </button>
                <button
                  type="button"
                  className={secondaryButton}
                  disabled={saving}
                  onClick={() => {
                    setDiscount(null);
                    void mutate(() => api.updateUserDiscount(userId, null));
                  }}
                >
                  Цэвэрлэх
                </button>
              </div>
              <p className="text-xs text-slate-400">
                Одоогийн үйлчлэх хөнгөлөлт: {user.membership.effectiveDiscountPercentage}%
              </p>
            </div>
          </section>
        </aside>

        <div className="grid min-w-0 gap-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <section className={`${panel} flex min-h-32 items-center justify-between p-5 sm:p-6`}>
              <div>
                <h2 className="text-slate-700">Цуцлагдсан</h2>
                <p className="mt-2 text-2xl text-slate-900">
                  {orderOverview ? `${orderOverview.cancelledCount} захиалга` : '—'}
                </p>
              </div>
              <span className="grid size-14 place-items-center rounded-2xl bg-rose-50 text-rose-500">
                <Ban size={25} />
              </span>
            </section>
            <section className={`${panel} flex min-h-32 items-center justify-between p-5 sm:p-6`}>
              <div>
                <h2 className="text-slate-700">Замдаа</h2>
                <p className="mt-2 text-2xl text-slate-900">
                  {orderOverview ? `${orderOverview.shippedCount} захиалга` : '—'}
                </p>
              </div>
              <span className="grid size-14 place-items-center rounded-2xl bg-amber-50 text-amber-500">
                <Truck size={25} />
              </span>
            </section>
          </div>

          <section className={`${panel} overflow-hidden`}>
            <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
              <h2 className="text-base text-slate-900">Захиалгын түүх</h2>
            </div>
            {ordersLoading && !orderOverview ? (
              <div className="p-6">
                <LoadingPanel />
              </div>
            ) : orderOverview?.orders.items.length === 0 ? (
              <p className="p-10 text-center text-sm text-slate-500">
                Захиалга бүртгэгдээгүй байна.
              </p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[740px] table-fixed text-left text-xs">
                    <thead className="bg-slate-50 text-xs text-slate-500">
                      <tr>
                        <th className="w-[13%] px-3 py-4">Захиалга №</th>
                        <th className="w-[18%] px-3 py-4">Огноо</th>
                        <th className="w-[13%] px-3 py-4">Бүтээгдэхүүн</th>
                        <th className="w-[14%] px-3 py-4">Нийт төлбөр</th>
                        <th className="w-[17%] px-3 py-4">Захиалгын төлөв</th>
                        <th className="w-[17%] px-3 py-4">Төлбөрийн төлөв</th>
                        <th className="w-[8%] px-3 py-4 text-right">Үйлдэл</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {orderOverview?.orders.items.map((order) => (
                        <tr key={order.orderNumber} className="transition hover:bg-slate-50/70">
                          <td className="break-words px-3 py-4 text-slate-900">
                            {order.orderNumber}
                          </td>
                          <td className="px-3 py-4">
                            {adminDateTime.format(new Date(order.placedAt))}
                          </td>
                          <td className="px-3 py-4">{order.itemCount} ширхэг</td>
                          <td className="px-3 py-4">{adminMoney.format(order.grandTotal)}₮</td>
                          <td className="px-3 py-4">
                            <span
                              className={`rounded-full px-2.5 py-1 text-xs ${statusTone(
                                order.orderStatus
                              )}`}
                            >
                              {orderStatusLabel(order.orderStatus)}
                            </span>
                          </td>
                          <td className="px-3 py-4">
                            <span
                              className={`rounded-full px-2.5 py-1 text-xs ${statusTone(
                                order.paymentStatus
                              )}`}
                            >
                              {paymentStatusLabel(order.paymentStatus)}
                            </span>
                          </td>
                          <td className="px-3 py-4 text-right">
                            <Link
                              to={`/admin/orders/${encodeURIComponent(order.orderNumber)}`}
                              className="inline-flex size-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600 transition hover:bg-slate-200"
                              aria-label={`${order.orderNumber} захиалгыг харах`}
                            >
                              <Eye size={16} />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {orderOverview && orderOverview.orders.totalPages > 1 && (
                  <Pagination
                    page={orderOverview.orders.page}
                    totalPages={orderOverview.orders.totalPages}
                    totalElements={orderOverview.orders.totalElements}
                    first={orderOverview.orders.first}
                    last={orderOverview.orders.last}
                    noun="захиалга"
                    onPageChange={setOrderPage}
                  />
                )}
              </>
            )}
          </section>
        </div>
      </div>
    </AdminShell>
  );
}
