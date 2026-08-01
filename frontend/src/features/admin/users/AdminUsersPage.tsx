import { useEffect, useState } from 'react';
import { Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import * as api from '../../../api/adminApi';
import type { AdminUserSummary, Page } from '../admin.types';
import { AdminShell } from '../layout/AdminShell';
import {
  EmptyPanel,
  ErrorNotice,
  LoadingPanel,
  Pagination,
  SearchInput,
  StatusBadge,
  input,
  panel,
} from '../components/AdminUi';
import { accountStatusLabel, adminDate, adminMoney, membershipLabel } from '../adminLocale';
import { useDebouncedValue } from '../components/useDebouncedValue';
export function AdminUsersPage() {
  const [data, setData] = useState<Page<AdminUserSummary> | null>(null);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    search: '',
    membership: '',
    status: '',
    sort: 'newest',
    page: 0,
    size: 20,
  });
  const debouncedSearch = useDebouncedValue(filters.search);
  useEffect(() => {
    let active = true;
    setError('');
    void api
      .listUsers({
        search: debouncedSearch,
        membership: filters.membership,
        status: filters.status,
        sort: filters.sort,
        page: filters.page,
        size: filters.size,
      })
      .then(
        (users) => {
          if (active) setData(users);
        },
        () => {
          if (active) setError('Хэрэглэгчийн мэдээллийг уншиж чадсангүй.');
        }
      );
    return () => {
      active = false;
    };
  }, [
    debouncedSearch,
    filters.membership,
    filters.page,
    filters.size,
    filters.sort,
    filters.status,
  ]);
  const change = (key: string, value: string) =>
    setFilters((f) => ({ ...f, [key]: value, page: 0 }));
  return (
    <AdminShell
      title="Хэрэглэгчдийн жагсаалт"
      description="Хэрэглэгчийн захиалга, төлбөр, гишүүнчлэл болон бүртгэлийг нэг дороос харна."
    >
      {error && (
        <div className="mb-4">
          <ErrorNotice message={error} />
        </div>
      )}
      {!data && !error ? (
        <LoadingPanel />
      ) : data?.items.length === 0 ? (
        <EmptyPanel title="Шүүлтүүрт тохирох хэрэглэгч олдсонгүй" />
      ) : (
        data && (
          <div className={`${panel} overflow-hidden`}>
            <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center lg:justify-between">
              <p className="text-sm text-slate-500">
                Нийт <span className="text-slate-900">{data.totalElements}</span> хэрэглэгч
              </p>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[minmax(14rem,1.5fr)_repeat(3,minmax(10rem,1fr))]">
                <SearchInput
                  value={filters.search}
                  onChange={(value) => change('search', value)}
                  placeholder="Хэрэглэгч хайх..."
                  label="Хэрэглэгч хайх"
                />
                <select
                  className={input}
                  value={filters.membership}
                  onChange={(e) => change('membership', e.target.value)}
                  aria-label="Гишүүнчлэлээр шүүх"
                >
                  <option value="">Бүх гишүүнчлэл</option>
                  {['REGULAR', 'BRONZE', 'SILVER', 'GOLD'].map((x) => (
                    <option key={x} value={x}>
                      {membershipLabel(x)}
                    </option>
                  ))}
                </select>
                <select
                  className={input}
                  value={filters.status}
                  onChange={(e) => change('status', e.target.value)}
                  aria-label="Төлөвөөр шүүх"
                >
                  <option value="">Бүх төлөв</option>
                  {['ACTIVE', 'DISABLED', 'LOCKED'].map((x) => (
                    <option key={x} value={x}>
                      {accountStatusLabel(x)}
                    </option>
                  ))}
                </select>
                <select
                  className={input}
                  value={filters.sort}
                  onChange={(e) => change('sort', e.target.value)}
                  aria-label="Хэрэглэгч эрэмбэлэх"
                >
                  <option value="newest">Шинэ эхэнд</option>
                  <option value="name_asc">Нэрээр</option>
                  <option value="email_asc">Имэйлээр</option>
                </select>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1080px] text-left text-sm">
                <thead className="bg-slate-50 text-xs text-slate-500">
                  <tr>
                    <th className="px-5 py-4">Нэр</th>
                    <th className="px-5 py-4">Утасны дугаар</th>
                    <th className="px-5 py-4">Имэйл</th>
                    <th className="px-5 py-4">Захиалга</th>
                    <th className="px-5 py-4">Нийт төлбөр</th>
                    <th className="px-5 py-4">Гишүүнчлэл</th>
                    <th className="px-5 py-4">Бүртгүүлсэн</th>
                    <th className="px-5 py-4 text-right">Үйлдэл</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.items.map((user) => (
                    <tr key={user.id} className="transition hover:bg-slate-50/70">
                      <td className="px-5 py-4 text-slate-900">
                        {user.firstName} {user.lastName}
                      </td>
                      <td className="px-5 py-4">{user.phoneNumber}</td>
                      <td className="px-5 py-4">{user.email}</td>
                      <td className="px-5 py-4">{user.orderCount} захиалга</td>
                      <td className="px-5 py-4">{adminMoney.format(user.totalPaid)}₮</td>
                      <td className="px-5 py-4">
                        <StatusBadge
                          tone={user.membership.code === 'REGULAR' ? 'neutral' : 'success'}
                        >
                          {membershipLabel(user.membership.code)}
                        </StatusBadge>
                      </td>
                      <td className="px-5 py-4">{adminDate.format(new Date(user.createdAt))}</td>
                      <td className="px-5 py-4 text-right">
                        <Link
                          className="inline-flex size-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-slate-200 hover:text-slate-900"
                          to={`/admin/users/${user.id}`}
                          aria-label={`${user.firstName} хэрэглэгчийг харах`}
                        >
                          <Eye size={17} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={data.page}
              totalPages={data.totalPages}
              totalElements={data.totalElements}
              first={data.first}
              last={data.last}
              noun="хэрэглэгч"
              onPageChange={(page) => setFilters((current) => ({ ...current, page }))}
            />
          </div>
        )
      )}
    </AdminShell>
  );
}
