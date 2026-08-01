import { useEffect, useState, type FormEvent } from 'react';
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
import { NEWS_CATEGORY_OPTIONS } from '../../news/newsCategories';
const blank: NewsInput = {
  title: '',
  category: 'GENERAL',
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
  const [error, setError] = useState('');
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
    if (uploading) {
      setError('Нүүр зураг байршуулж дуустал түр хүлээнэ үү.');
      return;
    }
    setSaving(true);
    setError('');
    const payload = {
      ...form,
      published,
      publishedAt: published ? form.publishedAt ?? new Date().toISOString() : form.publishedAt,
    };
    try {
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
      description="Мэдээний агуулга энгийн бичвэрээр, нүүр зураг аюулгүй байршуулалтаар хадгалагдана."
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
          <textarea
            required
            rows={12}
            className={input}
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
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
            disabled={saving || uploading}
            className={secondaryButton}
            onClick={() => void save(false)}
          >
            Ноорог хадгалах
          </button>
          <button
            type="button"
            disabled={saving || uploading}
            className={primaryButton}
            onClick={() => void save(true)}
          >
            {uploading ? 'Байршуулж байна…' : saving ? 'Хадгалж байна…' : 'Нийтлэх'}
          </button>
        </div>
      </form>
    </AdminShell>
  );
}
