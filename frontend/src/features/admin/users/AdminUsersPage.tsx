import { useEffect, useState } from 'react';
import { Eye, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import * as api from '../../../api/adminApi';
import type { AdminUser, Page } from '../admin.types';
import { AdminShell } from '../layout/AdminShell';
import {
  EmptyPanel,
  ErrorNotice,
  LoadingPanel,
  StatusBadge,
  input,
  panel,
  secondaryButton,
} from '../components/AdminUi';
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
  useEffect(() => {
    setError('');
    api
      .listUsers(filters)
      .then(setData)
      .catch(() => setError('Users could not be loaded.'));
  }, [filters]);
  const change = (key: string, value: string) =>
    setFilters((f) => ({ ...f, [key]: value, page: 0 }));
  return (
    <AdminShell
      title="Users"
      description="Membership, discount overrides, and account status are controlled here."
    >
      <div className={`${panel} mb-4 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4`}>
        <label className="relative">
          <Search className="absolute left-3 top-3 text-slate-400" size={18} />
          <input
            className={`${input} pl-10`}
            value={filters.search}
            onChange={(e) => change('search', e.target.value)}
            placeholder="Name, email, phone"
            aria-label="Search users"
          />
        </label>
        <select
          className={input}
          value={filters.membership}
          onChange={(e) => change('membership', e.target.value)}
          aria-label="Membership filter"
        >
          <option value="">All memberships</option>
          {['REGULAR', 'BRONZE', 'SILVER', 'GOLD'].map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
        <select
          className={input}
          value={filters.status}
          onChange={(e) => change('status', e.target.value)}
          aria-label="Status filter"
        >
          <option value="">All statuses</option>
          {['ACTIVE', 'DISABLED', 'LOCKED'].map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
        <select
          className={input}
          value={filters.sort}
          onChange={(e) => change('sort', e.target.value)}
          aria-label="Sort users"
        >
          <option value="newest">Newest</option>
          <option value="name_asc">Name</option>
          <option value="email_asc">Email</option>
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
        <EmptyPanel title="No users match these filters" />
      ) : (
        data && (
          <div className={`${panel} overflow-hidden`}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[960px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="p-4">Name</th>
                    <th>Email / phone</th>
                    <th>Membership</th>
                    <th>Effective discount</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th className="pr-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((user) => (
                    <tr key={user.id} className="border-t border-slate-100">
                      <td className="p-4 font-bold">
                        {user.firstName} {user.lastName}
                      </td>
                      <td>
                        <div>{user.email}</div>
                        <div className="text-xs text-slate-400">{user.phoneNumber}</div>
                      </td>
                      <td>{user.membership.code}</td>
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
                          {user.status}
                        </StatusBadge>
                      </td>
                      <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                      <td className="pr-4 text-right">
                        <Link
                          className="inline-flex p-2"
                          to={`/admin/users/${user.id}`}
                          aria-label={`View ${user.firstName}`}
                        >
                          <Eye size={17} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between border-t p-4 text-sm">
              <span>{data.totalElements} users</span>
              <div className="flex gap-2">
                <button
                  className={secondaryButton}
                  disabled={data.first}
                  onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
                >
                  Previous
                </button>
                <span className="px-3 py-2">
                  {data.page + 1} / {Math.max(data.totalPages, 1)}
                </span>
                <button
                  className={secondaryButton}
                  disabled={data.last}
                  onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )
      )}
    </AdminShell>
  );
}
