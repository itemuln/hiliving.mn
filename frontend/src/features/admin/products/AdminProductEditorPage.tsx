import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { ArrowDown, ArrowUp, Trash2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import * as api from '../../../api/adminApi';
import type { Brand, Category, ProductInput, ProductLifecycle } from '../admin.types';
import { AdminShell } from '../layout/AdminShell';
import {
  ErrorNotice,
  Field,
  LoadingPanel,
  input,
  panel,
  primaryButton,
  secondaryButton,
} from '../components/AdminUi';
import { ImageUploadControl } from '../components/ImageUploadControl';

type ImageDraft = ProductInput['images'][number];
const blank: ProductInput = {
  name: '',
  shortDescription: '',
  description: '',
  basePrice: 0,
  discountPrice: null,
  categoryId: 0,
  brandId: null,
  lifecycle: 'DRAFT',
  stockQuantity: 0,
  lowStockThreshold: 5,
  featured: false,
  newProduct: false,
  active: true,
  membershipDiscountEligible: true,
  images: [],
};

export function AdminProductEditorPage() {
  const { id } = useParams();
  const editId = id ? Number(id) : null;
  const navigate = useNavigate();
  const [form, setForm] = useState<ProductInput>(blank);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(Boolean(editId));
  const [saving, setSaving] = useState(false);
  const [pendingUploads, setPendingUploads] = useState(0);
  const [error, setError] = useState('');
  useEffect(() => {
    void Promise.all([
      api.listCategories(),
      api.listBrands(),
      editId ? api.getProduct(editId) : Promise.resolve(null),
    ])
      .then(([c, b, p]) => {
        setCategories(c);
        setBrands(b);
        if (p)
          setForm({
            name: p.name,
            shortDescription: p.shortDescription ?? '',
            description: p.description ?? '',
            basePrice: p.basePrice,
            discountPrice: p.discountPrice,
            categoryId: p.category.id,
            brandId: p.brand?.id ?? null,
            lifecycle: p.lifecycle,
            stockQuantity: p.stockQuantity,
            lowStockThreshold: p.lowStockThreshold,
            featured: p.featured,
            newProduct: p.newProduct,
            active: p.active,
            membershipDiscountEligible: p.membershipDiscountEligible,
            images: p.images.map((i, index) => ({
              imageUrl: i.imageUrl,
              altText: i.altText,
              sortOrder: index,
              primaryImage: i.primaryImage,
            })),
          });
        setLoading(false);
      })
      .catch(() => {
        setError('The product could not be loaded.');
        setLoading(false);
      });
  }, [editId]);
  const discount = useMemo(
    () =>
      form.discountPrice !== null && form.basePrice > 0
        ? Math.round((1 - form.discountPrice / form.basePrice) * 100)
        : 0,
    [form.basePrice, form.discountPrice]
  );
  const set = <K extends keyof ProductInput>(key: K, value: ProductInput[K]) =>
    setForm((current) => ({ ...current, [key]: value }));
  const setImages = (images: ImageDraft[]) =>
    set(
      'images',
      images.map((image, index) => ({ ...image, sortOrder: index }))
    );
  const updateImage = (index: number, patch: Partial<ImageDraft>) =>
    setImages(
      form.images.map((img, i) =>
        i === index
          ? { ...img, ...patch }
          : patch.primaryImage
          ? { ...img, primaryImage: false }
          : img
      )
    );
  const setSlot = (index: number, url: string) => {
    if (index < form.images.length) {
      if (url) updateImage(index, { imageUrl: url });
      else
        setImages(
          form.images
            .filter((_, i) => i !== index)
            .map((image, i) => ({
              ...image,
              primaryImage: image.primaryImage || (i === 0 && form.images[index].primaryImage),
            }))
        );
    } else if (url && form.images.length < 4)
      setImages([
        ...form.images,
        {
          imageUrl: url,
          altText: '',
          sortOrder: form.images.length,
          primaryImage: form.images.length === 0,
        },
      ]);
  };
  const move = (index: number, direction: number) => {
    const next = [...form.images];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setImages(next);
  };
  const save = async (lifecycle: ProductLifecycle) => {
    setError('');
    if (pendingUploads > 0) {
      setError('Wait for every image upload to finish before saving.');
      return;
    }
    setSaving(true);
    const payload = { ...form, lifecycle };
    if (payload.discountPrice !== null && payload.discountPrice >= payload.basePrice) {
      setError('Discount price must be lower than base price.');
      setSaving(false);
      return;
    }
    if (payload.stockQuantity < 0 || payload.lowStockThreshold < 0) {
      setError('Inventory values cannot be negative.');
      setSaving(false);
      return;
    }
    if (
      lifecycle === 'ACTIVE' &&
      payload.active &&
      payload.images.filter((i) => i.primaryImage).length !== 1
    ) {
      setError('Publishing requires exactly one primary image.');
      setSaving(false);
      return;
    }
    try {
      if (editId) await api.updateProduct(editId, payload);
      else await api.createProduct(payload);
      navigate('/admin/products');
    } catch {
      setError('The product could not be saved. Check pricing, inventory, and image rules.');
    } finally {
      setSaving(false);
    }
  };
  const submit = (e: FormEvent) => {
    e.preventDefault();
    void save(form.lifecycle);
  };
  const archive = async () => {
    if (!editId) return;
    setSaving(true);
    try {
      await api.archiveProduct(editId);
      navigate('/admin/products');
    } catch {
      setError('The product could not be archived.');
    } finally {
      setSaving(false);
    }
  };
  if (loading)
    return (
      <AdminShell title="Product editor">
        <LoadingPanel />
      </AdminShell>
    );
  return (
    <AdminShell
      title={editId ? 'Edit product' : 'Add product'}
      description="Upload up to four JPEG or PNG images. Publishing requires one primary image."
      actions={
        <button className={secondaryButton} onClick={() => navigate('/admin/products')}>
          Cancel
        </button>
      }
    >
      <form onSubmit={submit} className="space-y-5">
        {error && <ErrorNotice message={error} />}
        <section className={`${panel} p-5 sm:p-6`}>
          <h2 className="mb-5 text-lg font-black">1. Product information</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Category">
              <select
                required
                className={input}
                value={form.categoryId || ''}
                onChange={(e) => set('categoryId', Number(e.target.value))}
              >
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option value={c.id} key={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Brand">
              <select
                className={input}
                value={form.brandId ?? ''}
                onChange={(e) => set('brandId', e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">No brand</option>
                {brands.map((b) => (
                  <option value={b.id} key={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Product name">
              <input
                required
                className={input}
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
              />
            </Field>
            <Field label="Short description" wide>
              <textarea
                rows={2}
                className={input}
                value={form.shortDescription}
                onChange={(e) => set('shortDescription', e.target.value)}
              />
            </Field>
            <Field label="Full description" wide>
              <textarea
                rows={6}
                className={input}
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
              />
            </Field>
          </div>
        </section>
        <section className={`${panel} p-5 sm:p-6`}>
          <h2 className="mb-5 text-lg font-black">2. Price information</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Base price">
              <input
                required
                type="number"
                min="0"
                step="0.01"
                className={input}
                value={form.basePrice}
                onChange={(e) => set('basePrice', Number(e.target.value))}
              />
            </Field>
            <Field label="Discount price">
              <input
                type="number"
                min="0"
                step="0.01"
                className={input}
                value={form.discountPrice ?? ''}
                onChange={(e) =>
                  set('discountPrice', e.target.value === '' ? null : Number(e.target.value))
                }
              />
            </Field>
            <div className="rounded-xl bg-slate-50 p-4 text-sm">
              <span className="text-slate-500">Product discount</span>
              <strong className="float-right">{discount}%</strong>
            </div>
            <label className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 text-sm font-semibold">
              <input
                type="checkbox"
                checked={form.membershipDiscountEligible}
                onChange={(e) => set('membershipDiscountEligible', e.target.checked)}
              />
              Membership discount eligible
            </label>
          </div>
        </section>
        <section className={`${panel} p-5 sm:p-6`}>
          <h2 className="mb-5 text-lg font-black">3. Inventory and visibility</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Stock quantity">
              <input
                type="number"
                min="0"
                className={input}
                value={form.stockQuantity}
                onChange={(e) => set('stockQuantity', Number(e.target.value))}
              />
            </Field>
            <Field label="Low-stock threshold">
              <input
                type="number"
                min="0"
                className={input}
                value={form.lowStockThreshold}
                onChange={(e) => set('lowStockThreshold', Number(e.target.value))}
              />
            </Field>
            <Field label="Lifecycle">
              <select
                className={input}
                value={form.lifecycle}
                onChange={(e) => set('lifecycle', e.target.value as ProductLifecycle)}
              >
                <option>DRAFT</option>
                <option>ACTIVE</option>
                <option>ARCHIVED</option>
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {(['active', 'featured', 'newProduct'] as const).map((key) => (
                <label key={key} className="flex items-center gap-2 rounded-xl border p-3">
                  <input
                    type="checkbox"
                    checked={form[key]}
                    onChange={(e) => set(key, e.target.checked)}
                  />
                  {key === 'newProduct' ? 'New product' : key[0].toUpperCase() + key.slice(1)}
                </label>
              ))}
            </div>
          </div>
        </section>
        <section className={`${panel} p-5 sm:p-6`}>
          <div className="mb-5">
            <h2 className="text-lg font-black">4. Product images</h2>
            <p className="text-xs text-slate-500">
              Four upload slots. Existing external images remain visible until replaced.
            </p>
          </div>
          <div className="grid min-w-0 gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }, (_, index) => {
              const image = form.images[index];
              return (
                <div key={index} className="min-w-0">
                  <ImageUploadControl
                    label={`Product image ${index + 1}`}
                    purpose="PRODUCT"
                    value={image?.imageUrl ?? ''}
                    onChange={(url) => setSlot(index, url)}
                    onPendingChange={(pending) =>
                      setPendingUploads((value) => Math.max(0, value + (pending ? 1 : -1)))
                    }
                    disabled={saving}
                  />
                  {image && (
                    <>
                      <input
                        aria-label={`Alt text ${index + 1}`}
                        placeholder="Alt text"
                        className={`${input} mt-2`}
                        value={image.altText ?? ''}
                        onChange={(e) => updateImage(index, { altText: e.target.value })}
                      />
                      <div className="mt-2 flex items-center justify-between">
                        <label className="text-xs font-bold">
                          <input
                            type="radio"
                            name="primary"
                            checked={image.primaryImage}
                            onChange={() => updateImage(index, { primaryImage: true })}
                          />{' '}
                          Primary image
                        </label>
                        <div>
                          <button
                            type="button"
                            className="p-2"
                            disabled={index === 0}
                            onClick={() => move(index, -1)}
                            aria-label="Move image up"
                          >
                            <ArrowUp size={16} />
                          </button>
                          <button
                            type="button"
                            className="p-2"
                            disabled={index === form.images.length - 1}
                            onClick={() => move(index, 1)}
                            aria-label="Move image down"
                          >
                            <ArrowDown size={16} />
                          </button>
                          <button
                            type="button"
                            className="p-2 text-rose-500"
                            onClick={() => setSlot(index, '')}
                            aria-label="Remove image reference"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </section>
        <section className={`${panel} flex flex-wrap justify-end gap-3 p-5`}>
          <button
            type="button"
            className={secondaryButton}
            onClick={() => navigate('/admin/products')}
          >
            Cancel
          </button>
          {editId && (
            <button
              type="button"
              disabled={saving || pendingUploads > 0}
              className="rounded-xl border border-rose-200 px-4 py-2 text-sm font-bold text-rose-600"
              onClick={() => void archive()}
            >
              Archive
            </button>
          )}
          <button
            type="button"
            disabled={saving || pendingUploads > 0}
            className={secondaryButton}
            onClick={() => void save('DRAFT')}
          >
            Save draft
          </button>
          <button
            type="button"
            disabled={saving || pendingUploads > 0}
            className={primaryButton}
            onClick={() => void save('ACTIVE')}
          >
            {pendingUploads > 0 ? 'Uploading…' : saving ? 'Saving…' : 'Publish'}
          </button>
        </section>
      </form>
    </AdminShell>
  );
}
