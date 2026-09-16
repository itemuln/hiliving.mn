import { environment } from '../config/environment';
import type { ApiResponse } from './api.types';

interface ErrorEnvelope {
  error?: { code?: string };
}

export class ApiRequestError extends Error {
  constructor(readonly status: number | null, readonly code: string) {
    super('The API request could not be completed.');
    this.name = 'ApiRequestError';
  }
}

function apiUrl(path: string) {
  return `${environment.apiBaseUrl}${path}`;
}

async function errorCode(response: Response) {
  try {
    const payload = (await response.json()) as ErrorEnvelope;
    return payload.error?.code ?? 'REQUEST_FAILED';
  } catch {
    return 'REQUEST_FAILED';
  }
}

function cookie(name: string) {
  const prefix = `${encodeURIComponent(name)}=`;
  return (
    document.cookie
      .split(';')
      .map((value) => value.trim())
      .find((value) => value.startsWith(prefix))
      ?.slice(prefix.length) ?? null
  );
}

async function ensureCsrf() {
  if (cookie('XSRF-TOKEN')) return;
  const response = await fetch(apiUrl('/api/v1/auth/csrf'), {
    credentials: 'include',
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) throw new ApiRequestError(response.status, await errorCode(response));
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const method = init.method?.toUpperCase() ?? 'GET';
  const mutating = !['GET', 'HEAD', 'OPTIONS'].includes(method);
  if (mutating) await ensureCsrf();
  const csrf = mutating ? cookie('XSRF-TOKEN') : null;
  let response: Response;
  try {
    response = await fetch(apiUrl(path), {
      ...init,
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        ...(init.body && !(init.body instanceof FormData)
          ? { 'Content-Type': 'application/json' }
          : {}),
        ...(csrf ? { 'X-XSRF-TOKEN': decodeURIComponent(csrf) } : {}),
        ...init.headers,
      },
    });
  } catch (error) {
    if (init.signal?.aborted || (error instanceof DOMException && error.name === 'AbortError')) {
      throw new ApiRequestError(null, 'REQUEST_ABORTED');
    }
    throw new ApiRequestError(null, 'SERVICE_UNAVAILABLE');
  }
  if (!response.ok) {
    const code = await errorCode(response);
    if (response.status === 401 && code === 'AUTHENTICATION_REQUIRED') {
      window.dispatchEvent(new Event('hiliving:session-expired'));
    }
    throw new ApiRequestError(response.status, code);
  }
  if (response.status === 204) return undefined as T;
  try {
    const payload = (await response.json()) as ApiResponse<T>;
    if (!payload || !('data' in payload)) throw new Error('Missing data envelope');
    return payload.data;
  } catch {
    throw new ApiRequestError(response.status, 'INVALID_RESPONSE');
  }
}

export interface UploadOptions {
  signal?: AbortSignal;
  onProgress?: (percentage: number) => void;
}

export async function apiUpload<T>(
  path: string,
  body: FormData,
  options: UploadOptions = {}
): Promise<T> {
  await ensureCsrf();
  const csrf = cookie('XSRF-TOKEN');
  return await new Promise<T>((resolve, reject) => {
    const request = new XMLHttpRequest();
    const abort = () => request.abort();
    request.open('POST', apiUrl(path));
    request.withCredentials = true;
    request.setRequestHeader('Accept', 'application/json');
    if (csrf) request.setRequestHeader('X-XSRF-TOKEN', decodeURIComponent(csrf));
    request.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable)
        options.onProgress?.(Math.round((event.loaded / event.total) * 100));
    });
    request.addEventListener('load', () => {
      options.signal?.removeEventListener('abort', abort);
      let payload: ApiResponse<T> | ErrorEnvelope | null = null;
      try {
        payload = JSON.parse(request.responseText) as ApiResponse<T> | ErrorEnvelope;
      } catch {
        /* normalized below */
      }
      if (request.status < 200 || request.status >= 300) {
        const code =
          payload && 'error' in payload
            ? payload.error?.code ?? 'REQUEST_FAILED'
            : 'REQUEST_FAILED';
        if (request.status === 401 && code === 'AUTHENTICATION_REQUIRED') {
          window.dispatchEvent(new Event('hiliving:session-expired'));
        }
        reject(new ApiRequestError(request.status, code));
        return;
      }
      if (!payload || !('data' in payload)) {
        reject(new ApiRequestError(request.status, 'INVALID_RESPONSE'));
      } else {
        resolve(payload.data);
      }
    });
    request.addEventListener('error', () => {
      options.signal?.removeEventListener('abort', abort);
      reject(new ApiRequestError(null, 'SERVICE_UNAVAILABLE'));
    });
    request.addEventListener('abort', () => {
      options.signal?.removeEventListener('abort', abort);
      reject(new DOMException('Upload aborted', 'AbortError'));
    });
    if (options.signal?.aborted) abort();
    else {
      options.signal?.addEventListener('abort', abort, { once: true });
      request.send(body);
    }
  });
}
