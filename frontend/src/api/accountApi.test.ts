import { afterEach, describe, expect, it, vi } from 'vitest'
import { accountJson, authenticatedUser } from '../test/accountFixtures'
import { AccountApiError, createAddress, getCurrentUser, login, logout } from './accountApi'

afterEach(() => {
  vi.unstubAllGlobals()
  document.cookie = 'XSRF-TOKEN=; Max-Age=0; path=/'
})

describe('account API adapter', () => {
  it('hydrates an authenticated session with included credentials', async () => {
    const fetchMock = vi.fn().mockResolvedValue(accountJson({ data: authenticatedUser }))
    vi.stubGlobal('fetch', fetchMock)
    await expect(getCurrentUser()).resolves.toEqual(authenticatedUser)
    expect(fetchMock).toHaveBeenCalledWith('/api/v1/account/me', expect.objectContaining({ credentials: 'include' }))
  })

  it('maps only a 401 current-user response to anonymous', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(accountJson({ error: { code: 'AUTHENTICATION_REQUIRED' } }, 401)))
    await expect(getCurrentUser()).resolves.toBeNull()
  })

  it('sends the readable CSRF cookie in the header for mutations', async () => {
    document.cookie = 'XSRF-TOKEN=safe-token; path=/'
    const fetchMock = vi.fn().mockResolvedValue(accountJson({ data: authenticatedUser }))
    vi.stubGlobal('fetch', fetchMock)
    await login({ identifier: 'temuulen@example.com', password: 'StrongPass123' })
    expect(fetchMock).toHaveBeenCalledWith('/api/v1/auth/login', expect.objectContaining({
      method: 'POST', credentials: 'include', headers: expect.objectContaining({ 'X-XSRF-TOKEN': 'safe-token' }),
    }))
  })

  it('initializes CSRF before a mutation when the cookie is absent', async () => {
    const fetchMock = vi.fn()
      .mockImplementationOnce(async () => { document.cookie = 'XSRF-TOKEN=fresh-token; path=/'; return accountJson({ data: { headerName: 'X-XSRF-TOKEN' } }) })
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
    vi.stubGlobal('fetch', fetchMock)
    await logout()
    expect(fetchMock).toHaveBeenNthCalledWith(1, '/api/v1/auth/csrf', expect.objectContaining({ credentials: 'include' }))
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/api/v1/auth/logout', expect.objectContaining({ headers: expect.objectContaining({ 'X-XSRF-TOKEN': 'fresh-token' }) }))
  })

  it('keeps stable backend error codes without exposing backend messages', async () => {
    document.cookie = 'XSRF-TOKEN=token; path=/'
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(accountJson({ error: { code: 'INVALID_CREDENTIALS', message: 'database details' } }, 401)))
    await expect(login({ identifier: 'x@example.com', password: 'wrong' })).rejects.toMatchObject({
      status: 401, code: 'INVALID_CREDENTIALS', message: 'The account request could not be completed.',
    } satisfies Partial<AccountApiError>)
  })

  it('serializes address creation through the ownership-scoped endpoint', async () => {
    document.cookie = 'XSRF-TOKEN=token; path=/'
    const input = { label: 'Home', cityOrProvince: 'UB', districtOrSoum: 'SBD', khorooOrBag: null, addressLine: 'Street 1', additionalDetails: null, recipientName: 'Temuulen', recipientPhone: '99112233', defaultAddress: true }
    const fetchMock = vi.fn().mockResolvedValue(accountJson({ data: { id: 1, ...input } }))
    vi.stubGlobal('fetch', fetchMock)
    await createAddress(input)
    expect(fetchMock).toHaveBeenCalledWith('/api/v1/account/addresses', expect.objectContaining({ method: 'POST', body: JSON.stringify(input) }))
  })
})
