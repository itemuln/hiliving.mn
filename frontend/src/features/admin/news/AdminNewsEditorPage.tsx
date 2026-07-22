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
const blank: NewsInput = {
  title: '',
  slug: '',
  summary: '',
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
    api
      .getNews(editId)
      .then((n) => {
        setForm({
          title: n.title,
          slug: n.slug,
          summary: n.summary,
          content: n.content,
          thumbnailUrl: n.thumbnailUrl ?? '',
          published: n.published,
          publishedAt: n.publishedAt,
        });
        setLoading(false);
      })
      .catch(() => {
        setError('The article could not be loaded.');
        setLoading(false);
      });
  }, [editId]);
  const save = async (published: boolean) => {
    if (uploading) {
      setError('Wait for the thumbnail upload to finish.');
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
      setError('The article could not be saved. Check required fields and the unique slug.');
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
      <AdminShell title="News editor">
        <LoadingPanel />
      </AdminShell>
    );
  return (
    <AdminShell
      title={editId ? 'Edit news' : 'Add news'}
      description="News content remains plain text; thumbnails use secure image upload."
      actions={
        <button className={secondaryButton} onClick={() => navigate('/admin/news')}>
          Cancel
        </button>
      }
    >
      <form onSubmit={submit} className={`${panel} grid min-w-0 gap-4 p-5 sm:grid-cols-2 sm:p-7`}>
        {error && (
          <div className="sm:col-span-2">
            <ErrorNotice message={error} />
          </div>
        )}
        <Field label="Title">
          <input
            required
            className={input}
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
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
        <Field label="Summary" wide>
          <textarea
            required
            rows={3}
            className={input}
            value={form.summary}
            onChange={(e) => setForm({ ...form, summary: e.target.value })}
          />
        </Field>
        <Field label="Content" wide>
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
            label="News thumbnail"
            purpose="NEWS"
            value={form.thumbnailUrl ?? ''}
            onChange={(thumbnailUrl) => setForm({ ...form, thumbnailUrl })}
            onPendingChange={setUploading}
            disabled={saving}
          />
        </div>
        <Field label="Publish at">
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
            Cancel
          </button>
          <button
            type="button"
            disabled={saving || uploading}
            className={secondaryButton}
            onClick={() => void save(false)}
          >
            Save draft
          </button>
          <button
            type="button"
            disabled={saving || uploading}
            className={primaryButton}
            onClick={() => void save(true)}
          >
            {uploading ? 'Uploading…' : saving ? 'Saving…' : 'Publish'}
          </button>
        </div>
      </form>
    </AdminShell>
  );
}
