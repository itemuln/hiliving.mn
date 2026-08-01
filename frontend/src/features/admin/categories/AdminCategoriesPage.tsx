import { useEffect, useState, type FormEvent } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import * as api from '../../../api/adminApi';
import type { Category, CategoryInput } from '../admin.types';
import { AdminShell } from '../layout/AdminShell';
import {
  Dialog,
  EmptyPanel,
  ErrorNotice,
  Field,
  LoadingPanel,
  SearchInput,
  StatusBadge,
  input,
  panel,
  primaryButton,
  secondaryButton,
} from '../components/AdminUi';
import { AdminNumberInput } from '../components/AdminNumberInput';
import { useDebouncedValue } from '../components/useDebouncedValue';
const blank: CategoryInput = {
  name: '',
  slug: '',
  parentId: null,
  description: '',
  sortOrder: 0,
  active: true,
};
export function AdminCategoriesPage() {
  const [items, setItems] = useState<Category[] | null>(null);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Category | null | undefined>();
  const [form, setForm] = useState<CategoryInput>(blank);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [remove, setRemove] = useState<Category | null>(null);
  const debouncedSearch = useDebouncedValue(search);
  const load = async () => setItems(await api.listCategories(debouncedSearch));
  useEffect(() => {
    let active = true;
    setError('');
    void api.listCategories(debouncedSearch).then(
      (categories) => {
        if (active) setItems(categories);
      },
      () => {
        if (active) setError('Ангиллын мэдээллийг уншиж чадсангүй.');
      }
    );
    return () => {
      active = false;
    };
  }, [debouncedSearch]);
  const open = (item?: Category) => {
    setEditing(item ?? null);
    setForm(
      item
        ? {
            name: item.name,
            slug: item.slug,
            parentId: item.parentId,
            description: item.description ?? '',
            sortOrder: item.sortOrder,
            active: item.active,
          }
        : blank
    );
    setError('');
  };
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editing) await api.updateCategory(editing.id, form);
      else await api.createCategory(form);
      setEditing(undefined);
      await load();
    } catch (err) {
      setError(
        err instanceof Error
          ? 'Ангиллыг хадгалж чадсангүй. Slug давхардсан эсэхийг шалгана уу.'
          : 'Хадгалж чадсангүй.'
      );
    } finally {
      setSaving(false);
    }
  };
  const confirmDelete = async () => {
    if (!remove) return;
    try {
      await api.deleteCategory(remove.id);
      setRemove(null);
      await load();
    } catch {
      setError('Ашиглагдаж байгаа ангиллыг устгах боломжгүй. Оронд нь идэвхгүй болгоно уу.');
      setRemove(null);
    }
  };
  return (
    <AdminShell
      title="Ангилал"
      description="Каталогийн ангилал, дараалал болон харагдах төлөвийг удирдана."
      actions={
        <button className={primaryButton} onClick={() => open()}>
          <Plus size={17} className="mr-2" />
          Ангилал нэмэх
        </button>
      }
    >
      <div className={`${panel} mb-4 p-4`}>
        <div className="max-w-md">
          <SearchInput
            label="Ангилал хайх"
            value={search}
            onChange={setSearch}
            placeholder="Нэрээр хайх"
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
        <EmptyPanel title="Хайлтад тохирох ангилал олдсонгүй" />
      ) : (
        <div className={`${panel} overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="p-4">Ангилал</th>
                  <th>Бүтээгдэхүүн</th>
                  <th>Төлөв</th>
                  <th className="pr-4 text-right">Үйлдэл</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr
                    key={item.id}
                    className="border-t border-slate-100 transition hover:bg-slate-50/70"
                  >
                    <td className="p-4">
                      <div className="font-bold text-slate-900">{item.name}</div>
                    </td>
                    <td>{item.productCount}</td>
                    <td>
                      <StatusBadge tone={item.active ? 'success' : 'neutral'}>
                        {item.active ? 'Идэвхтэй' : 'Идэвхгүй'}
                      </StatusBadge>
                    </td>
                    <td className="pr-4 text-right">
                      <button
                        onClick={() => open(item)}
                        className="p-2 text-slate-500 hover:text-brand-500"
                        aria-label={`${item.name} засах`}
                      >
                        <Pencil size={17} />
                      </button>
                      <button
                        onClick={() => setRemove(item)}
                        className="p-2 text-slate-500 hover:text-rose-600"
                        aria-label={`${item.name} устгах`}
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
      {editing !== undefined && (
        <Dialog
          title={editing ? 'Ангилал засах' : 'Ангилал нэмэх'}
          onClose={() => setEditing(undefined)}
        >
          <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
            {error && (
              <div className="sm:col-span-2">
                <ErrorNotice message={error} />
              </div>
            )}
            <Field label="Нэр">
              <input
                required
                className={input}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </Field>
            <Field label="Slug">
              <input
                required
                pattern="[a-z0-9]+(-[a-z0-9]+)*"
                className={input}
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
              />
            </Field>
            <Field label="Эрэмбэ">
              <AdminNumberInput
                min="0"
                className={input}
                value={form.sortOrder}
                onValueChange={(sortOrder) => setForm({ ...form, sortOrder: sortOrder ?? 0 })}
              />
            </Field>
            <Field label="Тайлбар" wide>
              <textarea
                className={input}
                rows={4}
                value={form.description ?? ''}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </Field>
            <label className="flex items-center gap-3 text-sm font-semibold">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
              />
              Нийтийн каталогт идэвхтэй
            </label>
            <div className="flex justify-end gap-2 sm:col-span-2">
              <button
                type="button"
                className={secondaryButton}
                onClick={() => setEditing(undefined)}
              >
                Цуцлах
              </button>
              <button disabled={saving} className={primaryButton}>
                {saving ? 'Хадгалж байна…' : 'Ангилал хадгалах'}
              </button>
            </div>
          </form>
        </Dialog>
      )}
      {remove && (
        <Dialog title="Ангилал устгах уу?" onClose={() => setRemove(null)}>
          <p className="text-sm text-slate-600">
            <strong>{remove.name}</strong> ангилал ашиглагдаагүй үед л устгагдана.
          </p>
          <div className="mt-6 flex justify-end gap-2">
            <button className={secondaryButton} onClick={() => setRemove(null)}>
              Цуцлах
            </button>
            <button
              className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white"
              onClick={() => void confirmDelete()}
            >
              Устгах
            </button>
          </div>
        </Dialog>
      )}
    </AdminShell>
  );
}
