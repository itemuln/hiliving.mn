import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import * as accountApi from '../../api/accountApi';
import { AuthContext } from './AuthContext';
import type { AuthState, AuthenticatedUser, LoginInput } from './auth.types';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'loading', user: null });
  const [hydrationError, setHydrationError] = useState(false);

  const refresh = useCallback(async () => {
    setHydrationError(false);
    try {
      const user = await accountApi.getCurrentUser();
      setState(user ? { status: 'authenticated', user } : { status: 'anonymous', user: null });
    } catch {
      setHydrationError(true);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);
  useEffect(() => {
    const expired = () => {
      setHydrationError(false);
      setState({ status: 'anonymous', user: null });
    };
    window.addEventListener('hiliving:session-expired', expired);
    return () => window.removeEventListener('hiliving:session-expired', expired);
  }, []);

  const value = useMemo(
    () => ({
      state,
      hydrationError,
      async login(input: LoginInput) {
        const user = await accountApi.login(input);
        setHydrationError(false);
        setState({ status: 'authenticated', user });
        return user;
      },
      register: accountApi.register,
      async logout() {
        try {
          await accountApi.logout();
        } finally {
          setHydrationError(false);
          setState({ status: 'anonymous', user: null });
        }
      },
      refresh,
      replaceUser(user: AuthenticatedUser) {
        setState({ status: 'authenticated', user });
      },
    }),
    [hydrationError, refresh, state]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
