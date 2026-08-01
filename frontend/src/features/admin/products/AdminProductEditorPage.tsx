import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { ArrowDown, ArrowUp, GripVertical, ImagePlus, Trash2 } from 'lucide-react';
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
import { AdminNumberInput } from '../components/AdminNumberInput';
import { RichTextEditor, type RichTextEditorHandle } from '../components/RichTextEditor';

type ImageDraft = ProductInput['images'][number];
const MAX_PRODUCT_IMAGES = 6;
const visibilityOptions = [
  ['active', 'Харагдах'],
  ['featured', 'Онцлох'],
  ['newProduct', 'Шинэ бүтээгдэхүүн'],
] as const;

const blank: ProductInput = {
  name: '',
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
  const [descriptionUploading, setDescriptionUploading] = useState(false);
  const [batchUploading, setBatchUploading] = useState(false);
  const [draggedImageIndex, setDraggedImageIndex] = useState<number | null>(null);
  const [error, setError] = useState('');
  const batchInput = useRef<HTMLInputElement>(null);
  const descriptionEditor = useRef<RichTextEditorHandle | null>(null);
  const batchInputId = useId();
  useEffect(() => {
    let active = true;
    void Promise.all([
      api.listCategories(),
      api.listBrands(),
      editId ? api.getProduct(editId) : Promise.resolve(null),
    ])
      .then(([c, b, p]) => {
        if (!active) return;
        setCategories(c);
        setBrands(b);
        if (p) {
          setForm({
            name: p.name,
            description: p.description ?? p.shortDescription ?? '',
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
              displayScale: i.displayScale,
            })),
          });
        }
        setLoading(false);
      })
      .catch(() => {
        if (active) {
          setError('Бүтээгдэхүүний мэдээллийг уншиж чадсангүй.');
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [editId]);
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
  };
  const reorder = (index: number, target: number) => {
    const next = [...form.images];
    if (target < 0 || target >= next.length) return;
    const [image] = next.splice(index, 1);
    next.splice(target, 0, image);
    setImages(next);
  };
  const move = (index: number, direction: number) => reorder(index, index + direction);
  const addPhotos = async (files: FileList | null) => {
    const selected = Array.from(files ?? []);
    if (batchInput.current) batchInput.current.value = '';
    if (selected.length === 0) return;
    const available = MAX_PRODUCT_IMAGES - form.images.length;
    if (selected.length > available) {
      setError(`Нэмж ${available} бүтээгдэхүүний зураг оруулах боломжтой.`);
      return;
    }
    if (selected.some((file) => !['image/jpeg', 'image/png'].includes(file.type))) {
      setError('Зөвхөн JPEG эсвэл PNG бүтээгдэхүүний зураг сонгоно уу.');
      return;
    }
    setError('');
    setBatchUploading(true);
    setPendingUploads((value) => value + 1);
    try {
      const results = await Promise.allSettled(
        selected.map((file) => api.uploadMediaImage(file, 'PRODUCT'))
      );
      const uploaded = results.flatMap((result) =>
        result.status === 'fulfilled' ? [result.value.url] : []
      );
      setForm((current) => {
        const availableSlots = MAX_PRODUCT_IMAGES - current.images.length;
        const additions = uploaded.slice(0, availableSlots).map((imageUrl, index) => ({
          imageUrl,
          altText: '',
          sortOrder: current.images.length + index,
          primaryImage: current.images.length === 0 && index === 0,
          displayScale: 100,
        }));
        return { ...current, images: [...current.images, ...additions] };
      });
      if (results.some((result) => result.status === 'rejected')) {
        setError('Зарим зургийг байршуулж чадсангүй. Амжилттай зургууд хадгалагдлаа.');
      }
    } finally {
      setBatchUploading(false);
      setPendingUploads((value) => Math.max(0, value - 1));
    }
  };
  const save = async (lifecycle: ProductLifecycle) => {
    setError('');
    if (pendingUploads > 0 || descriptionUploading) {
      setError('Бүх зураг байршуулж дуустал түр хүлээнэ үү.');
      return;
    }
    setSaving(true);
    try {
      const uploads = await descriptionEditor.current?.uploadImages();
      if (uploads?.some((upload) => !upload.status)) {
        throw new Error('One or more product-description images failed to upload');
      }
      const description = descriptionEditor.current?.getContent() ?? form.description;
      if (/src=["']data:image\//i.test(description)) {
        throw new Error('Embedded Base64 images are not allowed');
      }
      const payload = { ...form, description, lifecycle };
      if (payload.basePrice < 0 || (payload.discountPrice !== null && payload.discountPrice < 0)) {
        setError('Үнэ сөрөг байж болохгүй.');
        return;
      }
      if (payload.discountPrice !== null && payload.discountPrice >= payload.basePrice) {
        setError('Хямдарсан үнэ үндсэн үнээс бага байх ёстой.');
        return;
      }
      if (payload.stockQuantity < 0 || payload.lowStockThreshold < 0) {
        setError('Нөөцийн утга сөрөг байж болохгүй.');
        return;
      }
      if (
        lifecycle === 'ACTIVE' &&
        payload.active &&
        payload.images.filter((i) => i.primaryImage).length !== 1
      ) {
        setError('Нийтлэхийн тулд яг нэг үндсэн зураг сонгоно уу.');
        return;
      }
      if (editId) await api.updateProduct(editId, payload);
      else await api.createProduct(payload);
      navigate('/admin/products');
    } catch {
      setError(
        'Бүтээгдэхүүнийг хадгалж чадсангүй. Үнэ, тайлбар болон зургийн мэдээллийг шалгана уу.'
      );
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
      setError('Бүтээгдэхүүнийг архивлаж чадсангүй.');
    } finally {
      setSaving(false);
    }
  };
  if (loading)
    return (
      <AdminShell title="Бүтээгдэхүүний редактор">
        <LoadingPanel />
      </AdminShell>
    );
  return (
    <AdminShell
      title={editId ? 'Бүтээгдэхүүн засах' : 'Бүтээгдэхүүн нэмэх'}
      description="Зургаа хүртэл JPEG эсвэл PNG зураг оруулж, нэг үндсэн зураг сонгоно."
      actions={
        <button className={secondaryButton} onClick={() => navigate('/admin/products')}>
          Цуцлах
        </button>
      }
    >
      <form onSubmit={submit} className="space-y-5">
        {error && <ErrorNotice message={error} />}
        <section className={`${panel} p-5 sm:p-6`}>
          <h2 className="mb-5 text-lg font-black">1. Бүтээгдэхүүний мэдээлэл</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Ангилал">
              <select
                required
                className={input}
                value={form.categoryId || ''}
                onChange={(e) => set('categoryId', Number(e.target.value))}
              >
                <option value="">Ангилал сонгох</option>
                {categories.map((c) => (
                  <option value={c.id} key={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Брэнд">
              <select
                className={input}
                value={form.brandId ?? ''}
                onChange={(e) => set('brandId', e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">Брэндгүй</option>
                {brands.map((b) => (
                  <option value={b.id} key={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Бүтээгдэхүүний нэр">
              <input
                required
                className={input}
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
              />
            </Field>
            <Field label="Тайлбар" wide>
              <RichTextEditor
                value={form.description}
                mediaPurpose="PRODUCT"
                height={340}
                disabled={saving}
                onReady={(editor) => {
                  descriptionEditor.current = editor;
                }}
                onChange={(description) => set('description', description)}
                onUploadStateChange={setDescriptionUploading}
              />
            </Field>
          </div>
          <div className="mt-6 border-t border-slate-200 pt-6">
            <div className="mb-5">
              <h3 className="text-base font-black">Бүтээгдэхүүний зураг</h3>
              <p className="text-xs text-slate-500">
                Зургаа хүртэл зураг сонгоод хэмжээ, үндсэн зураг болон дарааллыг тохируулна уу.
                Зургийг чирэх эсвэл сумтай товчоор дарааллыг солино.
              </p>
              {form.images.length < MAX_PRODUCT_IMAGES && (
                <div className="mt-3">
                  <input
                    ref={batchInput}
                    id={batchInputId}
                    aria-label="Бүтээгдэхүүний зураг нэмэх"
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
              {form.images.map((image, index) => (
                <div
                  key={image.imageUrl}
                  className="min-w-0 rounded-2xl transition-colors"
                  onDragOver={(event) => {
                    if (draggedImageIndex !== null) event.preventDefault();
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    if (draggedImageIndex !== null) reorder(draggedImageIndex, index);
                    setDraggedImageIndex(null);
                  }}
                >
                  <div className="mb-2 flex items-center justify-between text-xs font-bold text-slate-500">
                    <span
                      draggable={!saving}
                      onDragStart={() => setDraggedImageIndex(index)}
                      onDragEnd={() => setDraggedImageIndex(null)}
                      className="inline-flex cursor-grab items-center gap-1 rounded-lg px-1 py-1 active:cursor-grabbing"
                      title="Чирж зургийн дарааллыг солино"
                    >
                      <GripVertical size={16} aria-hidden="true" />
                      Дараалал {index + 1}
                    </span>
                    <span>{image.displayScale}%</span>
                  </div>
                  <ImageUploadControl
                    label={`Бүтээгдэхүүний зураг ${index + 1}`}
                    purpose="PRODUCT"
                    value={image.imageUrl}
                    imageScale={image.displayScale}
                    onChange={(url) => setSlot(index, url)}
                    onPendingChange={(pending) =>
                      setPendingUploads((value) => Math.max(0, value + (pending ? 1 : -1)))
                    }
                    disabled={saving}
                  />
                  <input
                    aria-label={`Зургийн тайлбар ${index + 1}`}
                    placeholder="Зургийн тайлбар"
                    className={`${input} mt-2`}
                    value={image.altText ?? ''}
                    onChange={(e) => updateImage(index, { altText: e.target.value })}
                  />
                  <label className="mt-3 block text-xs font-bold text-slate-600">
                    Харагдах хэмжээ
                    <input
                      aria-label={`Бүтээгдэхүүний зураг ${index + 1} харагдах хэмжээ`}
                      type="range"
                      min={75}
                      max={150}
                      step={5}
                      value={image.displayScale}
                      disabled={saving}
                      onChange={(event) =>
                        updateImage(index, { displayScale: Number(event.target.value) })
                      }
                      className="mt-2 block w-full accent-brand-500"
                    />
                  </label>
                  <div className="mt-2 flex items-center justify-between">
                    <label className="text-xs font-bold">
                      <input
                        type="radio"
                        name="primary"
                        checked={image.primaryImage}
                        onChange={() => updateImage(index, { primaryImage: true })}
                      />{' '}
                      Үндсэн зураг
                    </label>
                    <div>
                      <button
                        type="button"
                        className="p-2"
                        disabled={index === 0}
                        onClick={() => move(index, -1)}
                        aria-label={`${index + 1}-р зургийг өмнө зөөх`}
                      >
                        <ArrowUp size={16} />
                      </button>
                      <button
                        type="button"
                        className="p-2"
                        disabled={index === form.images.length - 1}
                        onClick={() => move(index, 1)}
                        aria-label={`${index + 1}-р зургийг хойш зөөх`}
                      >
                        <ArrowDown size={16} />
                      </button>
                      <button
                        type="button"
                        className="p-2 text-rose-500"
                        onClick={() => setSlot(index, '')}
                        aria-label={`${index + 1}-р зургийг устгах`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className={`${panel} p-5 sm:p-6`}>
          <h2 className="mb-5 text-lg font-black">2. Үнийн мэдээлэл</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Үндсэн үнэ">
              <AdminNumberInput
                required
                min="0"
                step="0.01"
                className={input}
                value={form.basePrice}
                onValueChange={(basePrice) => set('basePrice', basePrice ?? 0)}
              />
            </Field>
            <Field label="Хямдарсан үнэ">
              <AdminNumberInput
                aria-label="Хямдарсан үнэ"
                aria-describedby="product-sale-price-hint"
                min="0"
                step="0.01"
                className={input}
                value={form.discountPrice}
                nullable
                onValueChange={(discountPrice) => set('discountPrice', discountPrice)}
              />
              <p id="product-sale-price-hint" className="mt-1 text-xs text-slate-500">
                Хоосон орхивол бүтээгдэхүүн хямдралгүй байна.
              </p>
            </Field>
            <label className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 text-sm font-semibold">
              <input
                type="checkbox"
                checked={form.membershipDiscountEligible}
                onChange={(e) => set('membershipDiscountEligible', e.target.checked)}
              />
              Гишүүнчлэлийн хөнгөлөлт үйлчилнэ
            </label>
          </div>
        </section>
        <section className={`${panel} p-5 sm:p-6`}>
          <h2 className="mb-5 text-lg font-black">3. Нийтлэх ба харагдах байдал</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Нийтлэлийн төлөв">
              <select
                className={input}
                value={form.lifecycle}
                onChange={(e) => set('lifecycle', e.target.value as ProductLifecycle)}
              >
                <option value="DRAFT">Ноорог</option>
                <option value="ACTIVE">Нийтэлсэн</option>
                <option value="ARCHIVED">Архивласан</option>
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {visibilityOptions.map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 rounded-xl border p-3">
                  <input
                    type="checkbox"
                    checked={form[key]}
                    onChange={(e) => set(key, e.target.checked)}
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>
        </section>
        <section className={`${panel} flex flex-wrap justify-end gap-3 p-5`}>
          <button
            type="button"
            className={secondaryButton}
            onClick={() => navigate('/admin/products')}
          >
            Цуцлах
          </button>
          {editId && (
            <button
              type="button"
              disabled={saving || pendingUploads > 0 || descriptionUploading}
              className="rounded-xl border border-rose-200 px-4 py-2 text-sm font-bold text-rose-600"
              onClick={() => void archive()}
            >
              Архивлах
            </button>
          )}
          <button
            type="button"
            disabled={saving || pendingUploads > 0 || descriptionUploading}
            className={secondaryButton}
            onClick={() => void save('DRAFT')}
          >
            Ноорог хадгалах
          </button>
          <button
            type="button"
            disabled={saving || pendingUploads > 0 || descriptionUploading}
            className={primaryButton}
            onClick={() => void save('ACTIVE')}
          >
            {pendingUploads > 0 || descriptionUploading
              ? 'Байршуулж байна…'
              : saving
              ? 'Хадгалж байна…'
              : 'Нийтлэх'}
          </button>
        </section>
      </form>
    </AdminShell>
  );
}
