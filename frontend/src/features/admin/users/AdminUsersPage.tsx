import { useEffect, useState } from 'react';
import { Eye } from 'lucide-react';
import { Link } from 'react-router';
import * as api from '../../../api/adminApi';
import type { AdminUser, Page } from '../admin.types';
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
import { accountStatusLabel, adminDate, membershipLabel } from '../adminLocale';
import { useDebouncedValue } from '../components/useDebouncedValue';
export function AdminUsersPage() {
  const [data, setData] = useState<Page<AdminUser> | null>(null);
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
      title="Хэрэглэгч"
      description="Гишүүнчлэл, тусгай хөнгөлөлт болон бүртгэлийн төлөвийг удирдана."
    >
      <div className={`${panel} mb-4 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4`}>
        <SearchInput
          value={filters.search}
          onChange={(value) => change('search', value)}
          placeholder="Нэр, имэйл, утас"
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
            <div className="overflow-x-auto">
              <table className="w-full min-w-[960px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="p-4">Нэр</th>
                    <th>Имэйл / Утас</th>
                    <th>Гишүүнчлэл</th>
                    <th>Үйлчлэх хөнгөлөлт</th>
                    <th>Төлөв</th>
                    <th>Бүртгэсэн</th>
                    <th className="pr-4 text-right">Үйлдэл</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((user) => (
                    <tr
                      key={user.id}
                      className="border-t border-slate-100 transition hover:bg-slate-50/70"
                    >
                      <td className="p-4 font-bold">
                        {user.firstName} {user.lastName}
                      </td>
                      <td>
                        <div>{user.email}</div>
                        <div className="text-xs text-slate-400">{user.phoneNumber}</div>
                      </td>
                      <td>{membershipLabel(user.membership.code)}</td>
                      <td className="font-semibold">
                        {user.membership.effectiveDiscountPercentage}%
                      </td>
                      <td>
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
                      </td>
                      <td>{adminDate.format(new Date(user.createdAt))}</td>
                      <td className="pr-4 text-right">
                        <Link
                          className="inline-flex p-2"
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
