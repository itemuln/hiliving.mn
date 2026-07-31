import { useEffect, useState } from 'react';
import { Edit3, Plus, Trash2 } from 'lucide-react';
import { Link } from 'react-router';
import * as api from '../../../api/adminApi';
import type { News } from '../admin.types';
import { AdminShell } from '../layout/AdminShell';
import {
  EmptyPanel,
  ErrorNotice,
  LoadingPanel,
  SearchInput,
  StatusBadge,
  panel,
  primaryButton,
  secondaryButton,
} from '../components/AdminUi';
import { adminDate } from '../adminLocale';
import { Dialog } from '../components/AdminUi';
import { useDebouncedValue } from '../components/useDebouncedValue';
export function AdminNewsPage() {
  const [items, setItems] = useState<News[] | null>(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [removing, setRemoving] = useState<News | null>(null);
  const debouncedSearch = useDebouncedValue(search);
  const load = async () => setItems(await api.listNews(debouncedSearch));
  useEffect(() => {
    let active = true;
    setError('');
    void api.listNews(debouncedSearch).then(
      (news) => {
        if (active) setItems(news);
      },
      () => {
        if (active) setError('Мэдээний мэдээллийг уншиж чадсангүй.');
      }
    );
    return () => {
      active = false;
    };
  }, [debouncedSearch]);
  const remove = async () => {
    if (!removing) return;
    try {
      await api.deleteNews(removing.id);
      setRemoving(null);
      await load();
    } catch {
      setError('Мэдээг устгаж чадсангүй.');
      setRemoving(null);
    }
  };
  return (
    <AdminShell
      title="Мэдээ"
      description="Нүүр хуудсанд харагдах мэдээг бэлтгэж, нийтэлнэ."
      actions={
        <Link to="/admin/news/new" className={primaryButton}>
          <Plus size={17} className="mr-2" />
          Мэдээ нэмэх
        </Link>
      }
    >
      <div className={`${panel} mb-4 p-4`}>
        <div className="max-w-md">
          <SearchInput
            label="Мэдээ хайх"
            value={search}
            onChange={setSearch}
            placeholder="Гарчиг эсвэл slug-аар хайх"
          />
        </div>
      </div>
      {error && (
        <div className="mb-4">
          <ErrorNotice message={error} />
        </div>
      )}
      {items === null ? (
        <LoadingPanel />
      ) : items.length === 0 ? (
        <EmptyPanel title="Хайлтад тохирох мэдээ олдсонгүй" />
      ) : (
        <div className={`${panel} overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="p-4">Мэдээ</th>
                  <th>Нийтлэл</th>
                  <th>Шинэчилсэн</th>
                  <th className="pr-4 text-right">Үйлдэл</th>
                </tr>
              </thead>
              <tbody>
                {items.map((n) => (
                  <tr
                    key={n.id}
                    className="border-t border-slate-100 transition hover:bg-slate-50/70"
                  >
                    <td className="p-4">
                      <div className="font-bold">{n.title}</div>
                      <div className="text-xs text-slate-400">/{n.slug}</div>
                    </td>
                    <td>
                      <StatusBadge tone={n.published ? 'success' : 'warning'}>
                        {n.published ? 'Нийтэлсэн' : 'Ноорог'}
                      </StatusBadge>
                    </td>
                    <td>{adminDate.format(new Date(n.updatedAt))}</td>
                    <td className="pr-4 text-right">
                      <Link
                        className="inline-block p-2"
                        to={`/admin/news/${n.id}/edit`}
                        aria-label={`${n.title} засах`}
                      >
                        <Edit3 size={17} />
                      </Link>
                      <button
                        className="p-2 hover:text-rose-600"
                        onClick={() => setRemoving(n)}
                        aria-label={`${n.title} устгах`}
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
      {removing && (
        <Dialog title="Мэдээ устгах уу?" onClose={() => setRemoving(null)}>
          <p className="text-sm text-slate-600">
            <strong>{removing.title}</strong> мэдээг бүрмөсөн устгах гэж байна.
          </p>
          <div className="mt-6 flex justify-end gap-2">
            <button className={secondaryButton} onClick={() => setRemoving(null)}>
              Цуцлах
            </button>
            <button
              className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white"
              onClick={() => void remove()}
            >
              Устгах
            </button>
          </div>
        </Dialog>
      )}
    </AdminShell>
  );
}
