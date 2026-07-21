import { useEffect, useState, type FormEvent } from 'react';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import * as api from '../../../api/adminApi';
import type { Brand, BrandInput } from '../admin.types';
import { AdminShell } from '../layout/AdminShell';
import {
  Dialog,
  ErrorNotice,
  Field,
  LoadingPanel,
  StatusBadge,
  input,
  panel,
  primaryButton,
  secondaryButton,
} from '../components/AdminUi';
import { ImageUploadControl } from '../components/ImageUploadControl';
import { AdminNumberInput } from '../components/AdminNumberInput';
const blank: BrandInput = {
  name: '',
  slug: '',
  logoUrl: '',
  description: '',
  sortOrder: 0,
  active: true,
};
export function AdminBrandsPage() {
  const [items, setItems] = useState<Brand[] | null>(null);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Brand | null | undefined>();
  const [form, setForm] = useState<BrandInput>(blank);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const load = () =>
    api
      .listBrands(search)
      .then(setItems)
      .catch(() => setItems([]));
  useEffect(() => {
    void api
      .listBrands(search)
      .then(setItems)
      .catch(() => setItems([]));
  }, [search]);
  const open = (item?: Brand) => {
    setEditing(item ?? null);
    setForm(
      item
        ? {
            name: item.name,
            slug: item.slug,
            logoUrl: item.logoUrl ?? '',
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
    if (uploading) {
      setError('Wait for the logo upload to finish.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (editing) await api.updateBrand(editing.id, form);
      else await api.createBrand(form);
      setEditing(undefined);
      await load();
    } catch {
      setError('The brand could not be saved. Check the slug and required fields.');
    } finally {
      setSaving(false);
    }
  };
  const remove = async (item: Brand) => {
    try {
      await api.deleteBrand(item.id);
      await load();
    } catch {
      setError('The brand could not be deleted.');
    }
  };
  return (
    <AdminShell
      title="Brands"
      description="Manage brands and upload logos. Existing external logos remain compatible."
      actions={
        <button className={primaryButton} onClick={() => open()}>
          <Plus size={17} className="mr-2" />
          Add brand
        </button>
      }
    >
      <div className={`${panel} mb-4 p-4`}>
        <label className="relative block max-w-md">
          <Search className="absolute left-3 top-3 text-slate-400" size={18} />
          <input
            className={`${input} pl-10`}
            aria-label="Search brands"
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
      ) : (
        <div className={`${panel} overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="p-4">Brand</th>
                  <th>Products</th>
                  <th>Sort</th>
                  <th>Status</th>
                  <th className="pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr className="border-t border-slate-100" key={item.id}>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {item.logoUrl ? (
                          <img
                            className="h-10 w-10 rounded-lg border object-contain"
                            src={item.logoUrl}
                            alt=""
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-lg bg-slate-100" />
                        )}
                        <div>
                          <div className="font-bold">{item.name}</div>
                          <div className="text-xs text-slate-400">/{item.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td>{item.productCount}</td>
                    <td>{item.sortOrder}</td>
                    <td>
                      <StatusBadge tone={item.active ? 'success' : 'neutral'}>
                        {item.active ? 'Active' : 'Inactive'}
                      </StatusBadge>
                    </td>
                    <td className="pr-4 text-right">
                      <button
                        onClick={() => open(item)}
                        className="p-2"
                        aria-label={`Edit ${item.name}`}
                      >
                        <Pencil size={17} />
                      </button>
                      <button
                        onClick={() => void remove(item)}
                        className="p-2 hover:text-rose-600"
                        aria-label={`Delete ${item.name}`}
                      >
                        <Trash2 size={17} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {items.length === 0 && (
              <div className="p-8 text-center text-sm text-slate-500">
                No brands match this search
              </div>
            )}
          </div>
        </div>
      )}
      {editing !== undefined && (
        <Dialog title={editing ? 'Edit brand' : 'Add brand'} onClose={() => setEditing(undefined)}>
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
            <div className="sm:col-span-2">
              <ImageUploadControl
                label="Brand logo"
                purpose="BRAND"
                value={form.logoUrl ?? ''}
                onChange={(logoUrl) => setForm({ ...form, logoUrl })}
                onPendingChange={setUploading}
                disabled={saving}
              />
            </div>
            <Field label="Description" wide>
              <textarea
                rows={3}
                className={input}
                value={form.description ?? ''}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </Field>
            <Field label="Sort order">
              <AdminNumberInput
                min="0"
                className={input}
                value={form.sortOrder}
                onValueChange={(sortOrder) => setForm({ ...form, sortOrder: sortOrder ?? 0 })}
              />
            </Field>
            <label className="flex items-center gap-3 text-sm font-semibold">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
              />
              Active
            </label>
            <div className="flex justify-end gap-2 sm:col-span-2">
              <button
                type="button"
                className={secondaryButton}
                onClick={() => setEditing(undefined)}
              >
                Cancel
              </button>
              <button disabled={saving || uploading} className={primaryButton}>
                {uploading ? 'Uploading…' : saving ? 'Saving…' : 'Save brand'}
              </button>
            </div>
          </form>
        </Dialog>
      )}
    </AdminShell>
  );
}
