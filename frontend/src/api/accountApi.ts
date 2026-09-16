import { apiRequest, ApiRequestError } from './http';
import type {
  Address,
  AddressInput,
  PasswordInput,
  ProfileInput,
} from '../features/account/account.types';
import type {
  AuthenticatedUser,
  LoginInput,
  MessageResponse,
  PasswordResetConfirmInput,
  RegisterInput,
} from '../features/auth/auth.types';

export async function getCurrentUser() {
  try {
    return await apiRequest<AuthenticatedUser>('/api/v1/account/me');
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 401) return null;
    throw error;
  }
}

export const login = (input: LoginInput) =>
  apiRequest<AuthenticatedUser>('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify(input),
  });
export const register = (input: RegisterInput) =>
  apiRequest<AuthenticatedUser>('/api/v1/auth/register', {
    method: 'POST',
    body: JSON.stringify(input),
  });
export const requestEmailVerification = () =>
  apiRequest<MessageResponse>('/api/v1/auth/email-verification/request', { method: 'POST' });
export const confirmEmailVerification = (token: string) =>
  apiRequest<MessageResponse>('/api/v1/auth/email-verification/confirm', {
    method: 'POST',
    body: JSON.stringify({ token }),
  });
export const requestPasswordReset = (email: string) =>
  apiRequest<MessageResponse>('/api/v1/auth/password-reset/request', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
export const confirmPasswordReset = (input: PasswordResetConfirmInput) =>
  apiRequest<MessageResponse>('/api/v1/auth/password-reset/confirm', {
    method: 'POST',
    body: JSON.stringify(input),
  });
export const logout = () => apiRequest<void>('/api/v1/auth/logout', { method: 'POST' });
export const updateProfile = (input: ProfileInput) =>
  apiRequest<AuthenticatedUser>('/api/v1/account/profile', {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
export const changePassword = (input: PasswordInput) =>
  apiRequest<void>('/api/v1/account/password', { method: 'POST', body: JSON.stringify(input) });
export const getAddresses = () => apiRequest<readonly Address[]>('/api/v1/account/addresses');
export const createAddress = (input: AddressInput) =>
  apiRequest<Address>('/api/v1/account/addresses', { method: 'POST', body: JSON.stringify(input) });
export const updateAddress = (id: number, input: AddressInput) =>
  apiRequest<Address>(`/api/v1/account/addresses/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
export const deleteAddress = (id: number) =>
  apiRequest<void>(`/api/v1/account/addresses/${id}`, { method: 'DELETE' });
