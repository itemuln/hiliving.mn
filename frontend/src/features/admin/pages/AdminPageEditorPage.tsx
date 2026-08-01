import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ExternalLink } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import * as api from '../../../api/adminApi';
import type { ContentPageInput } from '../admin.types';
import {
  ErrorNotice,
  Field,
  LoadingPanel,
  input,
  panel,
  primaryButton,
  secondaryButton,
} from '../components/AdminUi';
import { AdminShell } from '../layout/AdminShell';
import { RichTextEditor, type RichTextEditorHandle } from './RichTextEditor';

const emptyForm: ContentPageInput = { title: '', contentHtml: '', published: false };

export function AdminPageEditorPage() {
  const { id } = useParams();
  const pageId = Number(id);
  const navigate = useNavigate();
  const editor = useRef<RichTextEditorHandle | null>(null);
  const [form, setForm] = useState<ContentPageInput>(emptyForm);
  const [slug, setSlug] = useState('');
  const [navigationLabel, setNavigationLabel] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    if (!Number.isInteger(pageId) || pageId <= 0) {
      setError('Засах хуудасны дугаар буруу байна.');
      setLoading(false);
      return;
    }
    void api.getContentPage(pageId).then(
      (page) => {
        if (!active) return;
        setForm({
          title: page.title,
          contentHtml: page.contentHtml,
          published: page.published,
        });
        setSlug(page.slug);
        setNavigationLabel(page.navigationLabel);
        setLoading(false);
      },
      () => {
        if (active) {
          setError('Хуудасны мэдээллийг уншиж чадсангүй.');
          setLoading(false);
        }
      }
    );
    return () => {
      active = false;
    };
  }, [pageId]);

  const save = async (published: boolean) => {
    if (!form.title.trim()) {
      setError('Гарчиг оруулна уу.');
      return;
    }
    if (uploading) {
      setError('Зураг байршуулж дуустал түр хүлээнэ үү.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const uploads = await editor.current?.uploadImages();
      if (uploads?.some((upload) => !upload.status)) {
        throw new Error('One or more editor images failed to upload');
      }
      const contentHtml = editor.current?.getContent() ?? form.contentHtml;
      if (/src=["']data:image\//i.test(contentHtml)) {
        throw new Error('Embedded Base64 images are not allowed');
      }
      await api.updateContentPage(pageId, { title: form.title.trim(), contentHtml, published });
      navigate('/admin/pages');
    } catch {
      setError(
        published
          ? 'Хуудсыг нийтэлж чадсангүй. Гарчиг, агуулга болон зураг байршуулалтыг шалгана уу.'
          : 'Нооргийг хадгалж чадсангүй. Дахин оролдоно уу.'
      );
    } finally {
      setSaving(false);
    }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    void save(form.published);
  };

  if (loading) {
    return (
      <AdminShell title="Хуудас засах">
        <LoadingPanel />
      </AdminShell>
    );
  }

  return (
    <AdminShell
      title="Хуудас засах"
      description={`${navigationLabel} хэсгийн нийтэд харагдах гарчиг, HTML агуулгыг засна.`}
      actions={
        <div className="flex flex-wrap gap-2">
          {form.published && slug ? (
            <Link
              to={`/hiliving-mgl/${slug}`}
              target="_blank"
              rel="noreferrer"
              className={secondaryButton}
            >
              <ExternalLink size={16} className="mr-2" />
              Нийтийн хуудсыг харах
            </Link>
          ) : null}
          <button className={secondaryButton} onClick={() => navigate('/admin/pages')}>
            Буцах
          </button>
        </div>
      }
    >
      <form onSubmit={submit} className={`${panel} min-w-0 space-y-5 p-5 sm:p-7`}>
        {error ? <ErrorNotice message={error} /> : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Цэсний нэр">
            <input className={input} value={navigationLabel} disabled />
          </Field>
          <Field label="Гарчиг">
            <input
              required
              maxLength={240}
              className={input}
              value={form.title}
              disabled={saving}
              onChange={(event) =>
                setForm((current) => ({ ...current, title: event.target.value }))
              }
            />
          </Field>
        </div>
        <div>
          <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Агуулга</h2>
              <p className="mt-1 text-xs text-slate-500">
                Visual горимоор засах эсвэл хэрэгслийн мөрийн &lt;/&gt; товчоор HTML код нээнэ.
              </p>
            </div>
            <span className="text-xs font-medium text-slate-400">Зургийн дээд хэмжээ 8 MB</span>
          </div>
          <RichTextEditor
            value={form.contentHtml}
            disabled={saving}
            onReady={(instance) => {
              editor.current = instance;
            }}
            onChange={(contentHtml) => setForm((current) => ({ ...current, contentHtml }))}
            onUploadStateChange={setUploading}
          />
        </div>
        <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-5">
          <button
            type="button"
            className={secondaryButton}
            onClick={() => navigate('/admin/pages')}
          >
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
            {uploading ? 'Зураг байршуулж байна…' : saving ? 'Хадгалж байна…' : 'Нийтлэх'}
          </button>
        </div>
      </form>
    </AdminShell>
  );
}
