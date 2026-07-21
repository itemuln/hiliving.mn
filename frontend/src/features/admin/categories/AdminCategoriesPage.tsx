import { useEffect, useState, type FormEvent } from 'react';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import * as api from '../../../api/adminApi';
import type { Category, CategoryInput } from '../admin.types';
import { AdminShell } from '../layout/AdminShell';
import {
  Dialog,
  EmptyPanel,
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
  const load = () =>
    api
      .listCategories(search)
      .then(setItems)
      .catch(() => setItems([]));
  useEffect(() => {
    void api
      .listCategories(search)
      .then(setItems)
      .catch(() => setItems([]));
  }, [search]);
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
          ? 'The category could not be saved. Check for duplicate slugs or circular parents.'
          : 'Save failed'
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
      setError(
        'This category cannot be deleted while it has child categories or products. Deactivate it instead.'
      );
      setRemove(null);
    }
  };
  return (
    <AdminShell
      title="Categories"
      description="Manage the public catalog hierarchy. Unsafe deletion is blocked."
      actions={
        <button className={primaryButton} onClick={() => open()}>
          <Plus size={17} className="mr-2" />
          Add category
        </button>
      }
    >
      <div className={`${panel} mb-4 p-4`}>
        <label className="relative block max-w-md">
          <Search className="absolute left-3 top-3 text-slate-400" size={18} />
          <input
            aria-label="Search categories"
            className={`${input} pl-10`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or slug"
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
        <EmptyPanel title="No categories match this search" />
      ) : (
        <div className={`${panel} overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="p-4">Category</th>
                  <th>Parent</th>
                  <th>Products</th>
                  <th>Children</th>
                  <th>Status</th>
                  <th className="pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-t border-slate-100">
                    <td className="p-4">
                      <div className="font-bold text-slate-900">{item.name}</div>
                      <div className="text-xs text-slate-400">/{item.slug}</div>
                    </td>
                    <td>{item.parentName ?? '—'}</td>
                    <td>{item.productCount}</td>
                    <td>{item.childCount}</td>
                    <td>
                      <StatusBadge tone={item.active ? 'success' : 'neutral'}>
                        {item.active ? 'Active' : 'Inactive'}
                      </StatusBadge>
                    </td>
                    <td className="pr-4 text-right">
                      <button
                        onClick={() => open(item)}
                        className="p-2 text-slate-500 hover:text-brand-500"
                        aria-label={`Edit ${item.name}`}
                      >
                        <Pencil size={17} />
                      </button>
                      <button
                        onClick={() => setRemove(item)}
                        className="p-2 text-slate-500 hover:text-rose-600"
                        aria-label={`Delete ${item.name}`}
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
          title={editing ? 'Edit category' : 'Add category'}
          onClose={() => setEditing(undefined)}
        >
          <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
            {error && (
              <div className="sm:col-span-2">
                <ErrorNotice message={error} />
              </div>
            )}
            <Field label="Name">
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
            <Field label="Parent">
              <select
                className={input}
                value={form.parentId ?? ''}
                onChange={(e) =>
                  setForm({ ...form, parentId: e.target.value ? Number(e.target.value) : null })
                }
              >
                <option value="">No parent</option>
                {items
                  ?.filter((x) => x.id !== editing?.id)
                  .map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.name}
                    </option>
                  ))}
              </select>
            </Field>
            <Field label="Sort order">
              <AdminNumberInput
                min="0"
                className={input}
                value={form.sortOrder}
                onValueChange={(sortOrder) => setForm({ ...form, sortOrder: sortOrder ?? 0 })}
              />
            </Field>
            <Field label="Description" wide>
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
              Active in public catalog
            </label>
            <div className="flex justify-end gap-2 sm:col-span-2">
              <button
                type="button"
                className={secondaryButton}
                onClick={() => setEditing(undefined)}
              >
                Cancel
              </button>
              <button disabled={saving} className={primaryButton}>
                {saving ? 'Saving…' : 'Save category'}
              </button>
            </div>
          </form>
        </Dialog>
      )}
      {remove && (
        <Dialog title="Delete category?" onClose={() => setRemove(null)}>
          <p className="text-sm text-slate-600">
            Delete <strong>{remove.name}</strong>? This works only when no children or products
            reference it.
          </p>
          <div className="mt-6 flex justify-end gap-2">
            <button className={secondaryButton} onClick={() => setRemove(null)}>
              Cancel
            </button>
            <button
              className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white"
              onClick={() => void confirmDelete()}
            >
              Delete
            </button>
          </div>
        </Dialog>
      )}
    </AdminShell>
  );
}
