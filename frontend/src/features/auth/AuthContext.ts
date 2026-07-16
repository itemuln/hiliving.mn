import { createContext } from 'react';
import type { AuthState, AuthenticatedUser, LoginInput, RegisterInput } from './auth.types';

export interface AuthContextValue {
  state: AuthState;
  hydrationError: boolean;
  login(input: LoginInput): Promise<AuthenticatedUser>;
  register(input: RegisterInput): Promise<AuthenticatedUser>;
  logout(): Promise<void>;
  refresh(): Promise<void>;
  replaceUser(user: AuthenticatedUser): void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
