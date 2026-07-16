import type { AuthenticatedUser } from '../features/auth/auth.types'

export const authenticatedUser: AuthenticatedUser = {
  id: 42,
  firstName: 'Temuulen',
  lastName: 'Ikhmandal',
  email: 'temuulen@example.com',
  phoneNumber: '+97699112233',
  role: 'CUSTOMER',
  status: 'ACTIVE',
  emailVerified: false,
  phoneVerified: false,
  membership: {
    code: 'SILVER', displayName: 'Silver', defaultDiscountPercentage: 5,
    discountOverridePercentage: null, effectiveDiscountPercentage: 5,
  },
  createdAt: '2026-07-16T00:00:00Z',
  updatedAt: '2026-07-16T00:00:00Z',
}

export function accountJson(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })
}
