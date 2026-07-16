import { useEffect, useId, useRef, useState, type DragEvent } from 'react';
import { ImagePlus, RefreshCw, Trash2, UploadCloud } from 'lucide-react';
import { AccountApiError } from '../../../api/accountApi';
import { uploadMediaImage } from '../../../api/adminApi';
import type { MediaPurpose } from '../admin.types';
import { secondaryButton } from './AdminUi';

interface Props {
  label: string;
  purpose: MediaPurpose;
  value: string;
  onChange: (url: string) => void;
  onPendingChange?: (pending: boolean) => void;
  disabled?: boolean;
  required?: boolean;
  compact?: boolean;
}

function safeMessage(error: unknown) {
  if (!(error instanceof AccountApiError))
    return 'The image could not be uploaded. Please try again.';
  if (error.code === 'MEDIA_FILE_TOO_LARGE' || error.code === 'MEDIA_MULTIPART_LIMIT_EXCEEDED')
    return 'This image is larger than the allowed upload size.';
  if (error.code === 'MEDIA_DIMENSIONS_EXCEEDED')
    return 'This image has dimensions that are too large.';
  if (
    [
      'MEDIA_FORMAT_UNSUPPORTED',
      'MEDIA_CONTENT_TYPE_MISMATCH',
      'MEDIA_EXTENSION_MISMATCH',
      'MEDIA_IMAGE_INVALID',
      'MEDIA_IMAGE_MALFORMED',
    ].includes(error.code)
  )
    return 'Choose a valid JPEG or PNG image.';
  if (error.status === 403) return 'Your account is not allowed to upload images.';
  return 'The image could not be uploaded. Please try again.';
}

export function ImageUploadControl({
  label,
  purpose,
  value,
  onChange,
  onPendingChange,
  disabled = false,
  required = false,
  compact = false,
}: Props) {
  const inputId = useId();
  const input = useRef<HTMLInputElement>(null);
  const controller = useRef<AbortController | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'error'>('idle');
  const [error, setError] = useState('');

  useEffect(
    () => () => {
      controller.current?.abort();
    },
    []
  );
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview]
  );

  const upload = async (next: File) => {
    if (!['image/jpeg', 'image/png'].includes(next.type)) {
      setFile(next);
      setError('Choose a JPEG or PNG image.');
      setStatus('error');
      return;
    }
    controller.current?.abort();
    const abort = new AbortController();
    controller.current = abort;
    const objectUrl = URL.createObjectURL(next);
    setPreview(objectUrl);
    setFile(next);
    setProgress(0);
    setError('');
    setStatus('uploading');
    onPendingChange?.(true);
    try {
      const asset = await uploadMediaImage(next, purpose, {
        signal: abort.signal,
        onProgress: setProgress,
      });
      onChange(asset.url);
      setStatus('idle');
      setFile(null);
      setPreview(null);
      URL.revokeObjectURL(objectUrl);
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === 'AbortError') return;
      setError(safeMessage(cause));
      setStatus('error');
    } finally {
      if (controller.current === abort) {
        controller.current = null;
        onPendingChange?.(false);
      }
    }
  };
  const pick = (files: FileList | null) => {
    const next = files?.[0];
    if (next) void upload(next);
    if (input.current) input.current.value = '';
  };
  const drop = (event: DragEvent) => {
    event.preventDefault();
    if (!disabled) pick(event.dataTransfer.files);
  };
  const image = preview ?? value;
  return (
    <div
      className={`min-w-0 rounded-2xl border border-slate-200 bg-white ${compact ? 'p-3' : 'p-4'}`}
    >
      <div
        onDragOver={(event) => event.preventDefault()}
        onDrop={drop}
        className={`relative flex ${
          compact ? 'min-h-36' : 'min-h-44'
        } min-w-0 flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 text-center`}
      >
        {image ? (
          <img
            src={image}
            alt={`${label} preview`}
            className="absolute inset-0 h-full w-full object-contain"
          />
        ) : (
          <>
            <UploadCloud size={28} className="text-slate-400" />
            <p className="mt-2 text-sm font-bold text-slate-600">Drop image here</p>
            <p className="mt-1 text-xs text-slate-400">JPEG or PNG</p>
          </>
        )}
        {status === 'uploading' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/65 px-5 text-white">
            <span className="text-sm font-bold">Uploading… {progress}%</span>
            <div className="mt-3 h-2 w-full overflow-hidden rounded bg-white/30">
              <div
                className="h-full bg-brand-500 transition-all"
                style={{ width: `${Math.max(progress, 4)}%` }}
              />
            </div>
          </div>
        )}
      </div>
      <input
        ref={input}
        id={inputId}
        type="file"
        className="sr-only"
        accept="image/jpeg,image/png,.jpg,.jpeg,.png"
        disabled={disabled || status === 'uploading'}
        onChange={(event) => pick(event.target.files)}
      />
      <div className="mt-3 flex flex-wrap gap-2">
        <label
          htmlFor={inputId}
          className={`${secondaryButton} cursor-pointer ${
            disabled || status === 'uploading' ? 'pointer-events-none opacity-50' : ''
          }`}
        >
          <ImagePlus size={16} className="mr-2" />
          {value ? 'Replace' : 'Choose file'}
        </label>
        {value && (
          <button
            type="button"
            className="rounded-xl border border-rose-200 px-3 py-2 text-sm font-bold text-rose-600"
            disabled={disabled || status === 'uploading'}
            onClick={() => onChange('')}
          >
            <Trash2 size={16} className="mr-2 inline" />
            Remove
          </button>
        )}
        {status === 'error' && file && (
          <button type="button" className={secondaryButton} onClick={() => void upload(file)}>
            <RefreshCw size={16} className="mr-2" />
            Retry
          </button>
        )}
      </div>
      {required && !value && status !== 'uploading' && (
        <p className="mt-2 text-xs font-semibold text-amber-700">
          An uploaded image is required before saving.
        </p>
      )}
      {error && (
        <p role="alert" className="mt-2 text-sm font-semibold text-rose-600">
          {error}
        </p>
      )}
    </div>
  );
}
