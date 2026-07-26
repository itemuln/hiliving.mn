import { useEffect, useState } from 'react';
import {
  Archive,
  Boxes,
  Building2,
  Image,
  Newspaper,
  PackageCheck,
  PackageOpen,
  Tags,
  Users,
} from 'lucide-react';
import * as api from '../../../api/adminApi';
import type { DashboardCounts } from '../admin.types';
import { AdminShell } from '../layout/AdminShell';
import { ErrorPanel, LoadingPanel, panel } from '../components/AdminUi';
const cards = [
  ['totalProducts', 'Нийт бүтээгдэхүүн', Boxes],
  ['activeProducts', 'Нийтэлсэн бүтээгдэхүүн', PackageCheck],
  ['draftProducts', 'Ноорог бүтээгдэхүүн', PackageOpen],
  ['archivedProducts', 'Архивласан бүтээгдэхүүн', Archive],
  ['categories', 'Ангилал', Tags],
  ['brands', 'Брэнд', Building2],
  ['users', 'Хэрэглэгч', Users],
  ['activeBanners', 'Идэвхтэй баннер', Image],
  ['publishedNews', 'Нийтэлсэн мэдээ', Newspaper],
] as const;
export function AdminDashboardPage() {
  const [data, setData] = useState<DashboardCounts | null>(null);
  const [error, setError] = useState(false);
  const load = () => {
    setError(false);
    api
      .getDashboard()
      .then(setData)
      .catch(() => setError(true));
  };
  useEffect(load, []);
  return (
    <AdminShell
      title="Хяналтын самбар"
      description="HiLiving каталог, хэрэглэгч болон контентын өнөөгийн тойм."
    >
      {error ? (
        <ErrorPanel retry={load} />
      ) : !data ? (
        <LoadingPanel />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map(([key, label, Icon]) => (
            <div
              key={key}
              className={`${panel} flex items-center gap-4 p-5 transition hover:-translate-y-0.5 hover:border-brand-100 hover:shadow-soft`}
            >
              <div className="rounded-2xl bg-brand-50 p-3 text-brand-500 ring-1 ring-brand-100">
                <Icon size={23} />
              </div>
              <div>
                <div className="text-3xl font-black text-slate-900">{data[key]}</div>
                <div className="text-sm text-slate-500">{label}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
