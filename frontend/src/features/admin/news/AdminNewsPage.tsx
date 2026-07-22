import { useEffect, useState } from 'react';
import { Edit3, Plus, Search, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import * as api from '../../../api/adminApi';
import type { News } from '../admin.types';
import { AdminShell } from '../layout/AdminShell';
import {
  EmptyPanel,
  ErrorNotice,
  LoadingPanel,
  StatusBadge,
  input,
  panel,
  primaryButton,
} from '../components/AdminUi';
export function AdminNewsPage() {
  const [items, setItems] = useState<News[] | null>(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const load = () =>
    api
      .listNews(search)
      .then(setItems)
      .catch(() => setError('News could not be loaded.'));
  useEffect(() => {
    void api
      .listNews(search)
      .then(setItems)
      .catch(() => setError('News could not be loaded.'));
  }, [search]);
  const remove = async (n: News) => {
    try {
      await api.deleteNews(n.id);
      await load();
    } catch {
      setError('The article could not be deleted.');
    }
  };
  return (
    <AdminShell
      title="News"
      description="Draft and publish plain-text storefront news."
      actions={
        <Link to="/admin/news/new" className={primaryButton}>
          <Plus size={17} className="mr-2" />
          Add article
        </Link>
      }
    >
      <div className={`${panel} mb-4 p-4`}>
        <label className="relative block max-w-md">
          <Search className="absolute left-3 top-3 text-slate-400" size={18} />
          <input
            className={`${input} pl-10`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title or slug"
            aria-label="Search news"
          />
        </label>
      </div>
      {error && (
        <div className="mb-4">
          <ErrorNotice message={error} />
        </div>
      )}
      {items === null ? (
        <LoadingPanel />
      ) : items.length === 0 ? (
        <EmptyPanel title="No news articles match this search" />
      ) : (
        <div className={`${panel} overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="p-4">Article</th>
                  <th>Publication</th>
                  <th>Updated</th>
                  <th className="pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((n) => (
                  <tr key={n.id} className="border-t border-slate-100">
                    <td className="p-4">
                      <div className="font-bold">{n.title}</div>
                      <div className="text-xs text-slate-400">/{n.slug}</div>
                    </td>
                    <td>
                      <StatusBadge tone={n.published ? 'success' : 'warning'}>
                        {n.published ? 'Published' : 'Draft'}
                      </StatusBadge>
                    </td>
                    <td>{new Date(n.updatedAt).toLocaleDateString()}</td>
                    <td className="pr-4 text-right">
                      <Link
                        className="inline-block p-2"
                        to={`/admin/news/${n.id}/edit`}
                        aria-label={`Edit ${n.title}`}
                      >
                        <Edit3 size={17} />
                      </Link>
                      <button
                        className="p-2 hover:text-rose-600"
                        onClick={() => void remove(n)}
                        aria-label={`Delete ${n.title}`}
                      >
                        <Trash2 size={17} />
                      </button>
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
