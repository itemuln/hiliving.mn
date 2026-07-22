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
  const batchInput = useRef<HTMLInputElement>(null);
  const batchInputId = useId();
  const load = () =>
    api
      .listBanners()
      .then(setItems)
      .catch(() => setError('Banners could not be loaded.'));
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
      setError('Wait for image uploads to finish.');
      return;
    }
    if (!form.imageUrl) {
      setError('Upload a desktop banner image before saving.');
      return;
    }
    setSaving(true);
    try {
      if (editing) await api.updateBanner(editing.id, form);
      else await api.createBanner(form);
      setEditing(undefined);
      await load();
    } catch {
      setError('The banner could not be saved. Check the required fields.');
    } finally {
      setSaving(false);
    }
  };
  const remove = async (b: Banner) => {
    try {
      await api.deleteBanner(b.id);
      await load();
    } catch {
      setError('The banner could not be deleted.');
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
      setError(`You can add ${available} more banner photo${available === 1 ? '' : 's'}.`);
      return;
    }
    if (selected.some((file) => !['image/jpeg', 'image/png'].includes(file.type))) {
      setError('Choose only JPEG or PNG banner photos.');
      return;
    }
    setError('');
    setBatchUploading(true);
    setPending((current) => current + 1);
    try {
      for (const file of selected) {
        const asset = await api.uploadMediaImage(file, 'BANNER');
        setForm((current) => {
          if (!current.imageUrl) return { ...current, imageUrl: asset.url };
          if (!current.mobileImageUrl) return { ...current, mobileImageUrl: asset.url };
          return current;
        });
      }
    } catch {
      setError('Some banner photos could not be uploaded. Completed photos are kept.');
    } finally {
      setBatchUploading(false);
      setPending((current) => Math.max(0, current - 1));
    }
  };
  return (
    <AdminShell
      title="Banners"
      description="Upload up to two hero images at once; the first is desktop and the second is mobile."
      actions={
        <button className={primaryButton} onClick={() => open()}>
          <Plus size={17} className="mr-2" />
          Add banner
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
        <EmptyPanel title="No banners yet" />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {items.map((b) => (
            <article key={b.id} className={`${panel} overflow-hidden`}>
              <img src={b.imageUrl} alt="" className="h-44 w-full bg-slate-50 object-cover" />
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="font-black">{b.title}</h2>
                    <p className="mt-1 text-sm text-slate-500">{b.subtitle}</p>
                  </div>
                  <StatusBadge tone={b.active ? 'success' : 'neutral'}>
                    {b.active ? 'Active' : 'Inactive'}
                  </StatusBadge>
                </div>
                <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
                  <span>Sort {b.sortOrder}</span>
                  <div>
                    <button className="p-2" onClick={() => open(b)} aria-label={`Edit ${b.title}`}>
                      <Pencil size={17} />
                    </button>
                    <button
                      className="p-2 hover:text-rose-600"
                      onClick={() => void remove(b)}
                      aria-label={`Delete ${b.title}`}
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
          title={editing ? 'Edit banner' : 'Add banner'}
          onClose={() => setEditing(undefined)}
        >
          <form onSubmit={submit} className="grid min-w-0 gap-4 sm:grid-cols-2">
            <Field label="Title">
              <input
                required
                className={input}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </Field>
            <Field label="Subtitle" wide>
              <textarea
                className={input}
                rows={2}
                value={form.subtitle ?? ''}
                onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
              />
            </Field>
            <div className="space-y-4 sm:col-span-2">
              <div>
                <p className="text-sm font-bold text-slate-700">Banner photos</p>
                <p className="text-xs text-slate-500">
                  Select one desktop image or select desktop and mobile images together. Upload URLs
                  are filled automatically.
                </p>
                {imageCount < 2 && (
                  <div className="mt-3">
                    <input
                      ref={batchInput}
                      id={batchInputId}
                      aria-label="Add banner photos"
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
                      {batchUploading ? 'Uploading photos…' : 'Add photos'}
                    </label>
                  </div>
                )}
              </div>
              <div className="grid min-w-0 gap-4 sm:grid-cols-2">
                {form.imageUrl && (
                  <ImageUploadControl
                    label="Desktop banner"
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
                    label="Mobile banner"
                    purpose="BANNER"
                    value={form.mobileImageUrl}
                    onChange={(imageUrl) => setBannerImage('mobile', imageUrl)}
                    onPendingChange={uploadState}
                    disabled={saving}
                  />
                )}
              </div>
            </div>
            <Field label="Sort order">
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
              <button disabled={saving || pending > 0} className={primaryButton}>
                {pending > 0 ? 'Uploading…' : saving ? 'Saving…' : 'Save banner'}
              </button>
            </div>
          </form>
        </Dialog>
      )}
    </AdminShell>
  );
}
