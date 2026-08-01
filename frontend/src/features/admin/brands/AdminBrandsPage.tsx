import { useEffect, useState, type FormEvent } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import * as api from '../../../api/adminApi';
import type { Brand, BrandInput } from '../admin.types';
import { AdminShell } from '../layout/AdminShell';
import {
  Dialog,
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
import { ImageUploadControl } from '../components/ImageUploadControl';
import { useDebouncedValue } from '../components/useDebouncedValue';
const blank: BrandInput = {
  name: '',
  slug: '',
  logoUrl: '',
  bannerImageUrl: '',
  description: '',
  active: true,
};
export function AdminBrandsPage() {
  const [items, setItems] = useState<Brand[] | null>(null);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Brand | null | undefined>();
  const [form, setForm] = useState<BrandInput>(blank);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [bannerUploading, setBannerUploading] = useState(false);
  const [removing, setRemoving] = useState<Brand | null>(null);
  const debouncedSearch = useDebouncedValue(search);
  const load = async () => setItems(await api.listBrands(debouncedSearch));
  useEffect(() => {
    let active = true;
    setError('');
    void api.listBrands(debouncedSearch).then(
      (brands) => {
        if (active) setItems(brands);
      },
      () => {
        if (active) setError('Брэндийн мэдээллийг уншиж чадсангүй.');
      }
    );
    return () => {
      active = false;
    };
  }, [debouncedSearch]);
  const open = (item?: Brand) => {
    setEditing(item ?? null);
    setForm(
      item
        ? {
            name: item.name,
            slug: item.slug,
            logoUrl: item.logoUrl ?? '',
            bannerImageUrl: item.bannerImageUrl ?? '',
            description: item.description ?? '',
            active: item.active,
          }
        : blank
    );
    setError('');
  };
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const uploading = logoUploading || bannerUploading;
    if (uploading) {
      setError('Зураг байршуулж дуустал түр хүлээнэ үү.');
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
      setError('Брэндийг хадгалж чадсангүй. Slug болон заавал бөглөх талбаруудыг шалгана уу.');
    } finally {
      setSaving(false);
    }
  };
  const remove = async () => {
    if (!removing) return;
    try {
      await api.deleteBrand(removing.id);
      setRemoving(null);
      await load();
    } catch {
      setError('Брэндийг устгаж чадсангүй. Ашиглагдаж байгаа эсэхийг шалгана уу.');
      setRemoving(null);
    }
  };
  return (
    <AdminShell
      title="Брэнд"
      description="Брэндийн мэдээлэл, лого, баннер болон каталогт харагдах төлөвийг удирдана."
      actions={
        <button className={primaryButton} onClick={() => open()}>
          <Plus size={17} className="mr-2" />
          Брэнд нэмэх
        </button>
      }
    >
      <div className={`${panel} mb-4 p-4`}>
        <div className="max-w-md">
          <SearchInput
            label="Брэнд хайх"
            value={search}
            onChange={setSearch}
            placeholder="Нэр эсвэл slug-аар хайх"
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
      ) : (
        <div className={`${panel} overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="p-4">Брэнд</th>
                  <th>Бүтээгдэхүүн</th>
                  <th>Төлөв</th>
                  <th className="pr-4 text-right">Үйлдэл</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr
                    className="border-t border-slate-100 transition hover:bg-slate-50/70"
                    key={item.id}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {item.logoUrl ? (
                          <img
                            className="h-10 w-10 rounded-lg border object-contain"
                            src={item.logoUrl}
                            alt=""
                            loading="lazy"
                            decoding="async"
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
                    <td>
                      <StatusBadge tone={item.active ? 'success' : 'neutral'}>
                        {item.active ? 'Идэвхтэй' : 'Идэвхгүй'}
                      </StatusBadge>
                    </td>
                    <td className="pr-4 text-right">
                      <button
                        onClick={() => open(item)}
                        className="p-2"
                        aria-label={`${item.name} засах`}
                      >
                        <Pencil size={17} />
                      </button>
                      <button
                        onClick={() => setRemoving(item)}
                        className="p-2 hover:text-rose-600"
                        aria-label={`${item.name} устгах`}
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
                Хайлтад тохирох брэнд олдсонгүй
              </div>
            )}
          </div>
        </div>
      )}
      {editing !== undefined && (
        <Dialog
          title={editing ? 'Брэнд засах' : 'Брэнд нэмэх'}
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
            <div className="sm:col-span-2">
              <ImageUploadControl
                label="Брэндийн лого"
                purpose="BRAND"
                value={form.logoUrl ?? ''}
                onChange={(logoUrl) => setForm({ ...form, logoUrl })}
                onPendingChange={setLogoUploading}
                disabled={saving}
              />
            </div>
            <div className="sm:col-span-2">
              <p className="mb-2 text-xs text-slate-500">
                Тухайн брэндийн бүтээгдэхүүний хуудсанд харагдах 1440×300 зураг.
              </p>
              <ImageUploadControl
                label="Брэндийн баннер"
                purpose="BANNER"
                value={form.bannerImageUrl ?? ''}
                onChange={(bannerImageUrl) => setForm({ ...form, bannerImageUrl })}
                onPendingChange={setBannerUploading}
                disabled={saving}
              />
            </div>
            <Field label="Тайлбар" wide>
              <textarea
                rows={3}
                className={input}
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
              Каталогт идэвхтэй
            </label>
            <div className="flex justify-end gap-2 sm:col-span-2">
              <button
                type="button"
                className={secondaryButton}
                onClick={() => setEditing(undefined)}
              >
                Цуцлах
              </button>
              <button
                disabled={saving || logoUploading || bannerUploading}
                className={primaryButton}
              >
                {logoUploading || bannerUploading
                  ? 'Байршуулж байна…'
                  : saving
                  ? 'Хадгалж байна…'
                  : 'Брэнд хадгалах'}
              </button>
            </div>
          </form>
        </Dialog>
      )}
      {removing && (
        <Dialog title="Брэнд устгах уу?" onClose={() => setRemoving(null)}>
          <p className="text-sm text-slate-600">
            <strong>{removing.name}</strong> брэндийг бүрмөсөн устгах гэж байна.
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
