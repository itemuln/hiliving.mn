import { useEffect, useState } from 'react';
import { Edit3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import * as api from '../../../api/adminApi';
import type { ContentPage } from '../admin.types';
import { adminDate } from '../adminLocale';
import { EmptyPanel, ErrorPanel, LoadingPanel, StatusBadge, panel } from '../components/AdminUi';
import { AdminShell } from '../layout/AdminShell';

export function AdminPagesPage() {
  const [pages, setPages] = useState<ContentPage[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [requestVersion, setRequestVersion] = useState(0);

  useEffect(() => {
    let active = true;
    setPages(null);
    setLoadFailed(false);
    void api.listContentPages().then(
      (contentPages) => {
        if (active) setPages(contentPages);
      },
      () => {
        if (active) setLoadFailed(true);
      }
    );
    return () => {
      active = false;
    };
  }, [requestVersion]);

  return (
    <AdminShell
      title="Хуудас"
      description="Hiliving MGL хэсгийн тогтмол бүтэцтэй хуудсуудын гарчиг, агуулга, нийтлэлийг удирдана."
    >
      {loadFailed ? (
        <ErrorPanel retry={() => setRequestVersion((version) => version + 1)} />
      ) : pages === null ? (
        <LoadingPanel />
      ) : pages.length === 0 ? (
        <EmptyPanel title="Засах хуудас олдсонгүй" />
      ) : (
        <div className={`${panel} overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="p-4">Хуудас</th>
                  <th>Төлөв</th>
                  <th>Шинэчилсэн</th>
                  <th className="pr-4 text-right">Үйлдэл</th>
                </tr>
              </thead>
              <tbody>
                {pages.map((page) => (
                  <tr
                    key={page.id}
                    className="border-t border-slate-100 transition hover:bg-slate-50/70"
                  >
                    <td className="p-4">
                      <div className="font-bold text-slate-900">{page.title}</div>
                      <div className="mt-1 text-xs uppercase tracking-wide text-slate-400">
                        {page.navigationLabel}
                      </div>
                    </td>
                    <td>
                      <StatusBadge tone={page.published ? 'success' : 'warning'}>
                        {page.published ? 'Нийтэлсэн' : 'Ноорог'}
                      </StatusBadge>
                    </td>
                    <td>{adminDate.format(new Date(page.updatedAt))}</td>
                    <td className="pr-4 text-right">
                      <Link
                        className="inline-flex rounded-lg p-2 transition hover:bg-slate-100"
                        to={`/admin/pages/${page.id}/edit`}
                        aria-label={`${page.title} засах`}
                      >
                        <Edit3 size={17} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
