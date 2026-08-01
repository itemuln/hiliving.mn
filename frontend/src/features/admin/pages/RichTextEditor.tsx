import { Editor } from '@tinymce/tinymce-react';
import { useRef, useState } from 'react';
import { environment } from '../../../config/environment';
import { uploadMediaImage } from '../../../api/adminApi';
import { ErrorNotice } from '../components/AdminUi';

export interface RichTextEditorHandle {
  getContent: () => string;
  uploadImages: () => Promise<readonly { status: boolean }[]>;
}

interface TinyMceBlobInfo {
  blob: () => Blob;
  filename: () => string;
}

type ImagePickerCallback = (url: string, metadata: { alt?: string }) => void;

interface Props {
  value: string;
  onChange: (value: string) => void;
  onReady: (editor: RichTextEditorHandle) => void;
  onUploadStateChange: (uploading: boolean) => void;
  disabled?: boolean;
}

export function RichTextEditor({
  value,
  onChange,
  onReady,
  onUploadStateChange,
  disabled = false,
}: Props) {
  const uploadCount = useRef(0);
  const [configurationError, setConfigurationError] = useState('');

  const trackUpload = async <T,>(operation: () => Promise<T>) => {
    uploadCount.current += 1;
    onUploadStateChange(true);
    try {
      return await operation();
    } finally {
      uploadCount.current -= 1;
      onUploadStateChange(uploadCount.current > 0);
    }
  };

  const uploadImage = async (file: File, progress?: (percentage: number) => void) =>
    trackUpload(async () => {
      const asset = await uploadMediaImage(file, 'PAGE', { onProgress: progress });
      return asset.url;
    });

  if (!environment.tinymceApiKey) {
    return (
      <ErrorNotice message="TinyMCE API түлхүүр тохируулаагүй байна. VITE_TINYMCE_API_KEY орчны хувьсагчийг тохируулсны дараа редактор нээгдэнэ." />
    );
  }

  return (
    <div className="min-w-0" aria-label="HTML агуулгын редактор">
      {configurationError ? (
        <div className="mb-3">
          <ErrorNotice message={configurationError} />
        </div>
      ) : null}
      <Editor
        apiKey={environment.tinymceApiKey}
        cloudChannel="8"
        value={value}
        disabled={disabled}
        onInit={(_event: unknown, editor: RichTextEditorHandle) => onReady(editor)}
        onEditorChange={onChange}
        onScriptsLoadError={() =>
          setConfigurationError(
            'TinyMCE редакторыг ачаалж чадсангүй. API түлхүүр, зөвшөөрөгдсөн домэйн болон сүлжээний холболтыг шалгана уу.'
          )
        }
        init={{
          height: 560,
          menubar: 'edit view insert format tools table help',
          plugins: [
            'advlist',
            'autolink',
            'lists',
            'link',
            'image',
            'charmap',
            'preview',
            'anchor',
            'searchreplace',
            'visualblocks',
            'code',
            'fullscreen',
            'insertdatetime',
            'table',
            'help',
            'wordcount',
            'autosave',
          ],
          toolbar:
            'undo redo | blocks | bold italic underline strikethrough | forecolor backcolor | alignleft aligncenter alignright alignjustify | bullist numlist blockquote | link image table | code preview fullscreen | removeformat help',
          toolbar_mode: 'sliding',
          branding: false,
          promotion: false,
          browser_spellcheck: true,
          contextmenu: 'link image table',
          automatic_uploads: true,
          paste_data_images: true,
          convert_urls: false,
          image_caption: true,
          image_advtab: true,
          file_picker_types: 'image',
          link_default_target: '_blank',
          autosave_interval: '30s',
          autosave_retention: '20m',
          content_style:
            'body { font-family: Arial, sans-serif; color: #444; font-size: 16px; line-height: 1.75; padding: 12px 18px; } img { max-width: 100%; height: auto; }',
          images_upload_handler: async (
            blobInfo: TinyMceBlobInfo,
            progress: (percentage: number) => void
          ) => {
            const blob = blobInfo.blob();
            const file = new File([blob], blobInfo.filename(), { type: blob.type });
            return uploadImage(file, progress);
          },
          file_picker_callback: (
            callback: ImagePickerCallback,
            _value: string,
            meta: { filetype: string }
          ) => {
            if (meta.filetype !== 'image') return;
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/jpeg,image/png,.jpg,.jpeg,.png';
            input.addEventListener('change', () => {
              const file = input.files?.[0];
              if (!file) return;
              void uploadImage(file)
                .then((url) => callback(url, { alt: file.name }))
                .catch(() =>
                  setConfigurationError('Зургийг байршуулж чадсангүй. Дахин оролдоно уу.')
                );
            });
            input.click();
          },
        }}
      />
    </div>
  );
}
