export interface Membership {
  code: 'REGULAR' | 'BRONZE' | 'SILVER' | 'GOLD'
  displayName: string
  defaultDiscountPercentage: number
  discountOverridePercentage: number | null
  effectiveDiscountPercentage: number
}

export interface AuthenticatedUser {
  id: number
  firstName: string
  lastName: string
  email: string
  phoneNumber: string
  role: 'CUSTOMER' | 'ADMIN'
  status: 'ACTIVE' | 'DISABLED' | 'LOCKED'
  emailVerified: boolean
  phoneVerified: boolean
  membership: Membership
  createdAt: string
  updatedAt: string
}

export type AuthState =
  | { status: 'loading'; user: null }
  | { status: 'anonymous'; user: null }
  | { status: 'authenticated'; user: AuthenticatedUser }

export interface LoginInput { identifier: string; password: string }
export interface RegisterInput { firstName: string; lastName: string; phoneNumber: string; email: string; password: string }
