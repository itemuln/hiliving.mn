import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import * as api from '../../../api/adminApi';
import type { NewsInput } from '../admin.types';
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
import { RichTextEditor, type RichTextEditorHandle } from '../components/RichTextEditor';
import { NEWS_CATEGORY_OPTIONS } from '../../news/newsCategories';
const blank: NewsInput = {
  title: '',
  category: 'NEWS',
  content: '',
  thumbnailUrl: '',
  published: false,
  publishedAt: null,
};
export function AdminNewsEditorPage() {
  const { id } = useParams();
  const editId = id ? Number(id) : null;
  const navigate = useNavigate();
  const [form, setForm] = useState<NewsInput>(blank);
  const [loading, setLoading] = useState(Boolean(editId));
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [contentUploading, setContentUploading] = useState(false);
  const [error, setError] = useState('');
  const contentEditor = useRef<RichTextEditorHandle | null>(null);
  useEffect(() => {
    if (!editId) return;
    let active = true;
    api
      .getNews(editId)
      .then((n) => {
        if (!active) return;
        setForm({
          title: n.title,
          category: n.category,
          content: n.content,
          thumbnailUrl: n.thumbnailUrl ?? '',
          published: n.published,
          publishedAt: n.publishedAt,
        });
        setLoading(false);
      })
      .catch(() => {
        if (active) {
          setError('Мэдээг уншиж чадсангүй.');
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [editId]);
  const save = async (published: boolean) => {
    if (uploading || contentUploading) {
      setError('Бүх зураг байршуулж дуустал түр хүлээнэ үү.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const uploads = await contentEditor.current?.uploadImages();
      if (uploads?.some((upload) => !upload.status)) {
        throw new Error('One or more news-content images failed to upload');
      }
      const content = contentEditor.current?.getContent() ?? form.content;
      if (/src=["']data:image\//i.test(content)) {
        throw new Error('Embedded Base64 images are not allowed');
      }
      const payload = {
        ...form,
        content,
        published,
        publishedAt: published ? form.publishedAt ?? new Date().toISOString() : form.publishedAt,
      };
      if (editId) await api.updateNews(editId, payload);
      else await api.createNews(payload);
      navigate('/admin/news');
    } catch {
      setError('Мэдээг хадгалж чадсангүй. Заавал бөглөх талбаруудыг шалгана уу.');
    } finally {
      setSaving(false);
    }
  };
  const submit = (e: FormEvent) => {
    e.preventDefault();
    void save(form.published);
  };
  if (loading)
    return (
      <AdminShell title="Мэдээний редактор">
        <LoadingPanel />
      </AdminShell>
    );
  return (
    <AdminShell
      title={editId ? 'Мэдээ засах' : 'Мэдээ нэмэх'}
      description="Мэдээний агуулгыг форматлаж, нүүр болон доторх зургийг аюулгүй байршуулна."
      actions={
        <button className={secondaryButton} onClick={() => navigate('/admin/news')}>
          Цуцлах
        </button>
      }
    >
      <form onSubmit={submit} className={`${panel} grid min-w-0 gap-4 p-5 sm:grid-cols-2 sm:p-7`}>
        {error && (
          <div className="sm:col-span-2">
            <ErrorNotice message={error} />
          </div>
        )}
        <Field label="Гарчиг">
          <input
            required
            className={input}
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </Field>
        <Field label="Ангилал">
          <select
            required
            className={input}
            value={form.category}
            onChange={(e) =>
              setForm({ ...form, category: e.target.value as NewsInput['category'] })
            }
          >
            {NEWS_CATEGORY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Тайлбар" wide>
          <RichTextEditor
            value={form.content}
            mediaPurpose="NEWS"
            height={420}
            disabled={saving}
            onReady={(editor) => {
              contentEditor.current = editor;
            }}
            onChange={(content) => setForm((current) => ({ ...current, content }))}
            onUploadStateChange={setContentUploading}
          />
        </Field>
        <div className="sm:col-span-2">
          <ImageUploadControl
            label="Мэдээний нүүр зураг"
            purpose="NEWS"
            value={form.thumbnailUrl ?? ''}
            onChange={(thumbnailUrl) => setForm({ ...form, thumbnailUrl })}
            onPendingChange={setUploading}
            disabled={saving}
          />
        </div>
        <Field label="Нийтлэх огноо">
          <input
            type="datetime-local"
            className={input}
            value={form.publishedAt?.slice(0, 16) ?? ''}
            onChange={(e) =>
              setForm({
                ...form,
                publishedAt: e.target.value ? new Date(e.target.value).toISOString() : null,
              })
            }
          />
        </Field>
        <div className="flex flex-wrap justify-end gap-2 sm:col-span-2">
          <button type="button" className={secondaryButton} onClick={() => navigate('/admin/news')}>
            Цуцлах
          </button>
          <button
            type="button"
            disabled={saving || uploading || contentUploading}
            className={secondaryButton}
            onClick={() => void save(false)}
          >
            Ноорог хадгалах
          </button>
          <button
            type="button"
            disabled={saving || uploading || contentUploading}
            className={primaryButton}
            onClick={() => void save(true)}
          >
            {uploading || contentUploading
              ? 'Байршуулж байна…'
              : saving
              ? 'Хадгалж байна…'
              : 'Нийтлэх'}
          </button>
        </div>
      </form>
    </AdminShell>
  );
}
