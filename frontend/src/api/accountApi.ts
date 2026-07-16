import { environment } from '../config/environment'
import type { Address, AddressInput, PasswordInput, ProfileInput } from '../features/account/account.types'
import type { AuthenticatedUser, LoginInput, RegisterInput } from '../features/auth/auth.types'

interface DataEnvelope<T> { data: T }
interface ErrorEnvelope { error?: { code?: string } }

export class AccountApiError extends Error {
  constructor(readonly status: number | null, readonly code: string) {
    super('The account request could not be completed.')
    this.name = 'AccountApiError'
  }
}

function apiUrl(path: string) { return `${environment.apiBaseUrl}${path}` }

async function errorCode(response: Response) {
  try {
    const payload = await response.json() as ErrorEnvelope
    return payload.error?.code ?? 'REQUEST_FAILED'
  } catch {
    return 'REQUEST_FAILED'
  }
}

function cookie(name: string) {
  const prefix = `${encodeURIComponent(name)}=`
  return document.cookie.split(';').map((value) => value.trim()).find((value) => value.startsWith(prefix))
    ?.slice(prefix.length) ?? null
}

async function ensureCsrf() {
  if (cookie('XSRF-TOKEN')) return
  const response = await fetch(apiUrl('/api/v1/auth/csrf'), { credentials: 'include', headers: { Accept: 'application/json' } })
  if (!response.ok) throw new AccountApiError(response.status, await errorCode(response))
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const method = init.method?.toUpperCase() ?? 'GET'
  const mutating = !['GET', 'HEAD', 'OPTIONS'].includes(method)
  if (mutating) await ensureCsrf()
  const csrf = mutating ? cookie('XSRF-TOKEN') : null
  let response: Response
  try {
    response = await fetch(apiUrl(path), {
      ...init,
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        ...(init.body && !(init.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
        ...(csrf ? { 'X-XSRF-TOKEN': decodeURIComponent(csrf) } : {}),
        ...init.headers,
      },
    })
  } catch {
    throw new AccountApiError(null, 'SERVICE_UNAVAILABLE')
  }
  if (!response.ok) {
    const code = await errorCode(response)
    if (response.status === 401 && code === 'AUTHENTICATION_REQUIRED') {
      window.dispatchEvent(new Event('hiliving:session-expired'))
    }
    throw new AccountApiError(response.status, code)
  }
  if (response.status === 204) return undefined as T
  try {
    const payload = await response.json() as DataEnvelope<T>
    if (!payload || !('data' in payload)) throw new Error('Missing data envelope')
    return payload.data
  } catch {
    throw new AccountApiError(response.status, 'INVALID_RESPONSE')
  }
}

export interface UploadOptions {
  signal?: AbortSignal
  onProgress?: (percentage: number) => void
}

export async function apiUpload<T>(path: string, body: FormData, options: UploadOptions = {}): Promise<T> {
  await ensureCsrf()
  const csrf = cookie('XSRF-TOKEN')
  return await new Promise<T>((resolve, reject) => {
    const request = new XMLHttpRequest()
    const abort = () => request.abort()
    request.open('POST', apiUrl(path))
    request.withCredentials = true
    request.setRequestHeader('Accept', 'application/json')
    if (csrf) request.setRequestHeader('X-XSRF-TOKEN', decodeURIComponent(csrf))
    request.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) options.onProgress?.(Math.round((event.loaded / event.total) * 100))
    })
    request.addEventListener('load', () => {
      options.signal?.removeEventListener('abort', abort)
      let payload: DataEnvelope<T> | ErrorEnvelope | null = null
      try { payload = JSON.parse(request.responseText) as DataEnvelope<T> | ErrorEnvelope } catch { /* normalized below */ }
      if (request.status < 200 || request.status >= 300) {
        const code = payload && 'error' in payload ? payload.error?.code ?? 'REQUEST_FAILED' : 'REQUEST_FAILED'
        if (request.status === 401 && code === 'AUTHENTICATION_REQUIRED') window.dispatchEvent(new Event('hiliving:session-expired'))
        reject(new AccountApiError(request.status, code))
        return
      }
      if (!payload || !('data' in payload)) reject(new AccountApiError(request.status, 'INVALID_RESPONSE'))
      else resolve(payload.data)
    })
    request.addEventListener('error', () => {
      options.signal?.removeEventListener('abort', abort)
      reject(new AccountApiError(null, 'SERVICE_UNAVAILABLE'))
    })
    request.addEventListener('abort', () => {
      options.signal?.removeEventListener('abort', abort)
      reject(new DOMException('Upload aborted', 'AbortError'))
    })
    if (options.signal?.aborted) abort()
    else {
      options.signal?.addEventListener('abort', abort, { once: true })
      request.send(body)
    }
  })
}

export async function getCurrentUser() {
  try { return await apiRequest<AuthenticatedUser>('/api/v1/account/me') }
  catch (error) {
    if (error instanceof AccountApiError && error.status === 401) return null
    throw error
  }
}

export const login = (input: LoginInput) => apiRequest<AuthenticatedUser>('/api/v1/auth/login', { method: 'POST', body: JSON.stringify(input) })
export const register = (input: RegisterInput) => apiRequest<AuthenticatedUser>('/api/v1/auth/register', { method: 'POST', body: JSON.stringify(input) })
export const logout = () => apiRequest<void>('/api/v1/auth/logout', { method: 'POST' })
export const updateProfile = (input: ProfileInput) => apiRequest<AuthenticatedUser>('/api/v1/account/profile', { method: 'PATCH', body: JSON.stringify(input) })
export const changePassword = (input: PasswordInput) => apiRequest<void>('/api/v1/account/password', { method: 'POST', body: JSON.stringify(input) })
export const getAddresses = () => apiRequest<readonly Address[]>('/api/v1/account/addresses')
export const createAddress = (input: AddressInput) => apiRequest<Address>('/api/v1/account/addresses', { method: 'POST', body: JSON.stringify(input) })
export const updateAddress = (id: number, input: AddressInput) => apiRequest<Address>(`/api/v1/account/addresses/${id}`, { method: 'PATCH', body: JSON.stringify(input) })
export const deleteAddress = (id: number) => apiRequest<void>(`/api/v1/account/addresses/${id}`, { method: 'DELETE' })
