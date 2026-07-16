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

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
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
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
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

export async function getCurrentUser() {
  try { return await request<AuthenticatedUser>('/api/v1/account/me') }
  catch (error) {
    if (error instanceof AccountApiError && error.status === 401) return null
    throw error
  }
}

export const login = (input: LoginInput) => request<AuthenticatedUser>('/api/v1/auth/login', { method: 'POST', body: JSON.stringify(input) })
export const register = (input: RegisterInput) => request<AuthenticatedUser>('/api/v1/auth/register', { method: 'POST', body: JSON.stringify(input) })
export const logout = () => request<void>('/api/v1/auth/logout', { method: 'POST' })
export const updateProfile = (input: ProfileInput) => request<AuthenticatedUser>('/api/v1/account/profile', { method: 'PATCH', body: JSON.stringify(input) })
export const changePassword = (input: PasswordInput) => request<void>('/api/v1/account/password', { method: 'POST', body: JSON.stringify(input) })
export const getAddresses = () => request<readonly Address[]>('/api/v1/account/addresses')
export const createAddress = (input: AddressInput) => request<Address>('/api/v1/account/addresses', { method: 'POST', body: JSON.stringify(input) })
export const updateAddress = (id: number, input: AddressInput) => request<Address>(`/api/v1/account/addresses/${id}`, { method: 'PATCH', body: JSON.stringify(input) })
export const deleteAddress = (id: number) => request<void>(`/api/v1/account/addresses/${id}`, { method: 'DELETE' })
