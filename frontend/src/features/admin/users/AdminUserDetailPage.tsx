import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import * as api from '../../../api/adminApi';
import type { Address } from '../../account/account.types';
import type { AdminUser } from '../admin.types';
import { AdminShell } from '../layout/AdminShell';
import {
  ErrorNotice,
  Field,
  LoadingPanel,
  StatusBadge,
  input,
  panel,
  primaryButton,
  secondaryButton,
} from '../components/AdminUi';
import { AdminNumberInput } from '../components/AdminNumberInput';
import { accountStatusLabel, membershipLabel } from '../adminLocale';
export function AdminUserDetailPage() {
  const { id } = useParams();
  const userId = Number(id);
  const navigate = useNavigate();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [discount, setDiscount] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    let active = true;
    void Promise.all([api.getUser(userId), api.getUserAddresses(userId)])
      .then(([u, a]) => {
        if (!active) return;
        setUser(u);
        setDiscount(u.membership.discountOverridePercentage);
        setAddresses(a);
      })
      .catch(() => {
        if (active) setError('Хэрэглэгчийн мэдээллийг уншиж чадсангүй.');
      });
    return () => {
      active = false;
    };
  }, [userId]);
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
  if (!user)
    return (
      <AdminShell
        title="Хэрэглэгчийн мэдээлэл"
        actions={
          <button className={secondaryButton} onClick={() => navigate('/admin/users')}>
            Буцах
          </button>
        }
      >
        {error ? <ErrorNotice message={error} /> : <LoadingPanel />}
      </AdminShell>
    );
  return (
    <AdminShell
      title={`${user.firstName} ${user.lastName}`}
      description={`${user.email} · ${user.phoneNumber}`}
      actions={
        <button className={secondaryButton} onClick={() => navigate('/admin/users')}>
          Хэрэглэгчид рүү буцах
        </button>
      }
    >
      <div className="grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
        {error && (
          <div className="xl:col-span-2">
            <ErrorNotice message={error} />
          </div>
        )}
        <section className={`${panel} p-5 sm:p-6`}>
          <h2 className="text-lg font-black">Гишүүнчлэл ба хөнгөлөлт</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-slate-50 p-4">
              <div className="text-xs uppercase text-slate-400">Гишүүнчлэл</div>
              <div className="mt-1 text-xl font-black">{membershipLabel(user.membership.code)}</div>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <div className="text-xs uppercase text-slate-400">Үндсэн хөнгөлөлт</div>
              <div className="mt-1 text-xl font-black">
                {user.membership.defaultDiscountPercentage}%
              </div>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <div className="text-xs uppercase text-slate-400">Тусгай хөнгөлөлт</div>
              <div className="mt-1 text-xl font-black">
                {user.membership.discountOverridePercentage === null
                  ? 'Байхгүй'
                  : `${user.membership.discountOverridePercentage}%`}
              </div>
            </div>
            <div className="rounded-xl bg-brand-50 p-4">
              <div className="text-xs uppercase text-brand-500">Үйлчлэх хөнгөлөлт</div>
              <div className="mt-1 text-xl font-black text-brand-600">
                {user.membership.effectiveDiscountPercentage}%
              </div>
            </div>
            <Field label="Гишүүнчлэл сонгох">
              <select
                className={input}
                value={user.membership.code}
                disabled={saving}
                onChange={(e) =>
                  void mutate(() => api.updateUserMembership(userId, e.target.value))
                }
              >
                {['REGULAR', 'BRONZE', 'SILVER', 'GOLD'].map((x) => (
                  <option key={x} value={x}>
                    {membershipLabel(x)}
                  </option>
                ))}
              </select>
            </Field>
            <Field
              label="Хэрэглэгчийн тусгай хөнгөлөлт"
              hint="Гишүүнчлэлийн үндсэн хөнгөлөлтийг ашиглах бол хоосолж цэвэрлэнэ үү."
            >
              <div className="flex gap-2">
                <AdminNumberInput
                  min="0"
                  max="100"
                  step="0.01"
                  className={input}
                  value={discount}
                  nullable
                  onValueChange={setDiscount}
                />
                <button
                  className={primaryButton}
                  disabled={saving}
                  onClick={() => void mutate(() => api.updateUserDiscount(userId, discount))}
                >
                  Тохируулах
                </button>
                <button
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
            </Field>
          </div>
        </section>
        <section className={`${panel} p-5 sm:p-6`}>
          <h2 className="text-lg font-black">Бүртгэлийн төлөв</h2>
          <div className="mt-5 flex items-center justify-between rounded-xl bg-slate-50 p-4">
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
            <select
              className={`${input} max-w-44`}
              value={user.status}
              disabled={saving}
              onChange={(e) => void mutate(() => api.updateUserStatus(userId, e.target.value))}
            >
              <option value="ACTIVE">Идэвхтэй</option>
              <option value="DISABLED">Идэвхгүй</option>
              <option value="LOCKED">Түгжигдсэн</option>
            </select>
          </div>
          <div className="mt-6">
            <h3 className="font-bold">Баталгаажуулалт</h3>
            <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl border p-3">
                <dt className="text-slate-400">Имэйл</dt>
                <dd className="font-bold">
                  {user.emailVerified ? 'Баталгаажсан' : 'Баталгаажаагүй'}
                </dd>
              </div>
              <div className="rounded-xl border p-3">
                <dt className="text-slate-400">Утас</dt>
                <dd className="font-bold">
                  {user.phoneVerified ? 'Баталгаажсан' : 'Баталгаажаагүй'}
                </dd>
              </div>
            </dl>
          </div>
        </section>
        <section className={`${panel} p-5 sm:p-6 xl:col-span-2`}>
          <h2 className="text-lg font-black">Хэрэглэгчийн хаяг</h2>
          {addresses.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">Хадгалсан хаяг алга.</p>
          ) : (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {addresses.map((a) => (
                <article key={a.id} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex justify-between">
                    <strong>{a.label}</strong>
                    {a.defaultAddress && <StatusBadge tone="success">Үндсэн</StatusBadge>}
                  </div>
                  <p className="mt-2 text-sm text-slate-600">
                    {a.cityOrProvince}, {a.districtOrSoum}, {a.addressLine}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {a.recipientName} · {a.recipientPhone}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </AdminShell>
  );
}
