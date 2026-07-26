import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { ImagePlus, Pencil, Plus, Trash2 } from 'lucide-react';
import * as api from '../../../api/adminApi';
import type { Banner, BannerInput } from '../admin.types';
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
import { ImageUploadControl } from '../components/ImageUploadControl';
import { AdminNumberInput } from '../components/AdminNumberInput';
const blank: BannerInput = {
  title: '',
  subtitle: '',
  imageUrl: '',
  mobileImageUrl: '',
  sortOrder: 0,
  active: true,
};
export function AdminBannersPage() {
  const [items, setItems] = useState<Banner[] | null>(null);
  const [editing, setEditing] = useState<Banner | null | undefined>();
  const [form, setForm] = useState<BannerInput>(blank);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [pending, setPending] = useState(0);
  const [batchUploading, setBatchUploading] = useState(false);
  const [removing, setRemoving] = useState<Banner | null>(null);
  const batchInput = useRef<HTMLInputElement>(null);
  const batchInputId = useId();
  const load = () =>
    api
      .listBanners()
      .then(setItems)
      .catch(() => setError('Баннерийн мэдээллийг уншиж чадсангүй.'));
  useEffect(() => {
    void load();
  }, []);
  const open = (b?: Banner) => {
    setEditing(b ?? null);
    setForm(
      b
        ? {
            title: b.title,
            subtitle: b.subtitle ?? '',
            imageUrl: b.imageUrl,
            mobileImageUrl: b.mobileImageUrl ?? '',
            sortOrder: b.sortOrder,
            active: b.active,
          }
        : blank
    );
    setError('');
  };
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (pending > 0) {
      setError('Зураг байршуулж дуустал түр хүлээнэ үү.');
      return;
    }
    if (!form.imageUrl) {
      setError('Хадгалахын өмнө компьютерийн баннер зураг байршуулна уу.');
      return;
    }
    setSaving(true);
    try {
      if (editing) await api.updateBanner(editing.id, form);
      else await api.createBanner(form);
      setEditing(undefined);
      await load();
    } catch {
      setError('Баннерийг хадгалж чадсангүй. Заавал бөглөх талбаруудыг шалгана уу.');
    } finally {
      setSaving(false);
    }
  };
  const remove = async () => {
    if (!removing) return;
    try {
      await api.deleteBanner(removing.id);
      setRemoving(null);
      await load();
    } catch {
      setError('Баннерийг устгаж чадсангүй.');
      setRemoving(null);
    }
  };
  const uploadState = (value: boolean) =>
    setPending((current) => Math.max(0, current + (value ? 1 : -1)));
  const imageCount = Number(Boolean(form.imageUrl)) + Number(Boolean(form.mobileImageUrl));
  const setBannerImage = (slot: 'desktop' | 'mobile', imageUrl: string) => {
    setForm((current) => {
      if (slot === 'mobile') return { ...current, mobileImageUrl: imageUrl };
      if (imageUrl) return { ...current, imageUrl };
      if (current.mobileImageUrl)
        return { ...current, imageUrl: current.mobileImageUrl, mobileImageUrl: '' };
      return { ...current, imageUrl: '' };
    });
  };
  const addPhotos = async (files: FileList | null) => {
    const selected = Array.from(files ?? []);
    if (batchInput.current) batchInput.current.value = '';
    if (selected.length === 0) return;
    const available = 2 - imageCount;
    if (selected.length > available) {
      setError(`Нэмж ${available} баннер зураг оруулах боломжтой.`);
      return;
    }
    if (selected.some((file) => !['image/jpeg', 'image/png'].includes(file.type))) {
      setError('Зөвхөн JPEG эсвэл PNG баннер зураг сонгоно уу.');
      return;
    }
    setError('');
    setBatchUploading(true);
    setPending((current) => current + 1);
    try {
      const results = await Promise.allSettled(
        selected.map((file) => api.uploadMediaImage(file, 'BANNER'))
      );
      const uploaded = results.flatMap((result) =>
        result.status === 'fulfilled' ? [result.value.url] : []
      );
      setForm((current) => {
        const slots = [current.imageUrl, current.mobileImageUrl].filter(
          (imageUrl): imageUrl is string => Boolean(imageUrl)
        );
        const [imageUrl = '', mobileImageUrl = ''] = [...slots, ...uploaded].slice(0, 2);
        return { ...current, imageUrl, mobileImageUrl };
      });
      if (results.some((result) => result.status === 'rejected')) {
        setError('Зарим зургийг байршуулж чадсангүй. Амжилттай зургууд хадгалагдлаа.');
      }
    } finally {
      setBatchUploading(false);
      setPending((current) => Math.max(0, current - 1));
    }
  };
  return (
    <AdminShell
      title="Баннер"
      description="Нүүр хуудасны компьютер болон гар утасны баннер зургийг удирдана."
      actions={
        <button className={primaryButton} onClick={() => open()}>
          <Plus size={17} className="mr-2" />
          Баннер нэмэх
        </button>
      }
    >
      {error && (
        <div className="mb-4">
          <ErrorNotice message={error} />
        </div>
      )}
      {items === null ? (
        <LoadingPanel />
      ) : items.length === 0 ? (
        <EmptyPanel title="Одоогоор баннер алга" />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {items.map((b) => (
            <article
              key={b.id}
              className={`${panel} overflow-hidden transition hover:-translate-y-0.5 hover:shadow-soft`}
            >
              <img
                src={b.imageUrl}
                alt=""
                loading="lazy"
                className="h-44 w-full bg-slate-50 object-cover"
              />
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="font-black">{b.title}</h2>
                    <p className="mt-1 text-sm text-slate-500">{b.subtitle}</p>
                  </div>
                  <StatusBadge tone={b.active ? 'success' : 'neutral'}>
                    {b.active ? 'Идэвхтэй' : 'Идэвхгүй'}
                  </StatusBadge>
                </div>
                <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
                  <span>Эрэмбэ: {b.sortOrder}</span>
                  <div>
                    <button className="p-2" onClick={() => open(b)} aria-label={`${b.title} засах`}>
                      <Pencil size={17} />
                    </button>
                    <button
                      className="p-2 hover:text-rose-600"
                      onClick={() => setRemoving(b)}
                      aria-label={`${b.title} устгах`}
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
      {editing !== undefined && (
        <Dialog
          title={editing ? 'Баннер засах' : 'Баннер нэмэх'}
          onClose={() => setEditing(undefined)}
        >
          <form onSubmit={submit} className="grid min-w-0 gap-4 sm:grid-cols-2">
            <Field label="Гарчиг">
              <input
                required
                className={input}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </Field>
            <Field label="Дэд гарчиг" wide>
              <textarea
                className={input}
                rows={2}
                value={form.subtitle ?? ''}
                onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
              />
            </Field>
            <div className="space-y-4 sm:col-span-2">
              <div>
                <p className="text-sm font-bold text-slate-700">Баннер зураг</p>
                <p className="text-xs text-slate-500">
                  Эхний зураг компьютерт, хоёр дахь зураг гар утсанд ашиглагдана.
                </p>
                {imageCount < 2 && (
                  <div className="mt-3">
                    <input
                      ref={batchInput}
                      id={batchInputId}
                      aria-label="Баннер зураг нэмэх"
                      type="file"
                      multiple
                      className="sr-only"
                      accept="image/jpeg,image/png,.jpg,.jpeg,.png"
                      disabled={saving || batchUploading}
                      onChange={(event) => void addPhotos(event.currentTarget.files)}
                    />
                    <label
                      htmlFor={batchInputId}
                      className={`${secondaryButton} cursor-pointer ${
                        saving || batchUploading ? 'pointer-events-none opacity-50' : ''
                      }`}
                    >
                      <ImagePlus size={16} className="mr-2" />
                      {batchUploading ? 'Зураг байршуулж байна…' : 'Зураг нэмэх'}
                    </label>
                  </div>
                )}
              </div>
              <div className="grid min-w-0 gap-4 sm:grid-cols-2">
                {form.imageUrl && (
                  <ImageUploadControl
                    label="Компьютерийн баннер"
                    purpose="BANNER"
                    value={form.imageUrl}
                    onChange={(imageUrl) => setBannerImage('desktop', imageUrl)}
                    onPendingChange={uploadState}
                    required
                    disabled={saving}
                  />
                )}
                {form.mobileImageUrl && (
                  <ImageUploadControl
                    label="Гар утасны баннер"
                    purpose="BANNER"
                    value={form.mobileImageUrl}
                    onChange={(imageUrl) => setBannerImage('mobile', imageUrl)}
                    onPendingChange={uploadState}
                    disabled={saving}
                  />
                )}
              </div>
            </div>
            <Field label="Эрэмбэ">
              <AdminNumberInput
                min="0"
                className={input}
                value={form.sortOrder}
                onValueChange={(sortOrder) => setForm({ ...form, sortOrder: sortOrder ?? 0 })}
              />
            </Field>
            <label className="flex items-center gap-3 text-sm font-bold">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
              />
              Идэвхтэй
            </label>
            <div className="flex justify-end gap-2 sm:col-span-2">
              <button
                type="button"
                className={secondaryButton}
                onClick={() => setEditing(undefined)}
              >
                Цуцлах
              </button>
              <button disabled={saving || pending > 0} className={primaryButton}>
                {pending > 0 ? 'Байршуулж байна…' : saving ? 'Хадгалж байна…' : 'Баннер хадгалах'}
              </button>
            </div>
          </form>
        </Dialog>
      )}
      {removing && (
        <Dialog title="Баннер устгах уу?" onClose={() => setRemoving(null)}>
          <p className="text-sm text-slate-600">
            <strong>{removing.title}</strong> баннерийг бүрмөсөн устгах гэж байна.
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
