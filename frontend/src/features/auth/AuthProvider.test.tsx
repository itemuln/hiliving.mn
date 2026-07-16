import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { accountJson, authenticatedUser } from '../../test/accountFixtures';
import { AuthProvider } from './AuthProvider';
import { useAuth } from './useAuth';

function Probe() {
  const { state, hydrationError, login, logout } = useAuth();
  return (
    <div>
      <span>{state.status}</span>
      <span>{hydrationError ? 'hydration-error' : 'hydration-ok'}</span>
      {state.user ? <span>{state.user.email}</span> : null}
      <button onClick={() => void login({ identifier: 'x', password: 'y' })}>login</button>
      <button onClick={() => void logout()}>logout</button>
    </div>
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
  document.cookie = 'XSRF-TOKEN=; Max-Age=0; path=/';
});

describe('AuthProvider', () => {
  it('starts loading then hydrates anonymous state', async () => {
    let resolveFetch!: (value: Response) => void;
    vi.stubGlobal(
      'fetch',
      vi.fn().mockReturnValue(
        new Promise<Response>((resolve) => {
          resolveFetch = resolve;
        })
      )
    );
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );
    expect(screen.getByText('loading')).toBeInTheDocument();
    resolveFetch(accountJson({ error: { code: 'AUTHENTICATION_REQUIRED' } }, 401));
    expect(await screen.findByText('anonymous')).toBeInTheDocument();
  });

  it('hydrates an authenticated user', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(accountJson({ data: authenticatedUser })));
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );
    expect(await screen.findByText('authenticated')).toBeInTheDocument();
    expect(screen.getByText(authenticatedUser.email)).toBeInTheDocument();
  });

  it('does not turn an operational hydration failure into logout', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')));
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );
    expect(await screen.findByText('hydration-error')).toBeInTheDocument();
    expect(screen.getByText('loading')).toBeInTheDocument();
    expect(screen.queryByText('anonymous')).not.toBeInTheDocument();
  });

  it('updates state after login and logout', async () => {
    document.cookie = 'XSRF-TOKEN=token; path=/';
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(accountJson({ error: { code: 'AUTHENTICATION_REQUIRED' } }, 401))
      .mockResolvedValueOnce(accountJson({ data: authenticatedUser }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetchMock);
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );
    expect(await screen.findByText('anonymous')).toBeInTheDocument();
    fireEvent.click(screen.getByText('login'));
    expect(await screen.findByText('authenticated')).toBeInTheDocument();
    fireEvent.click(screen.getByText('logout'));
    await waitFor(() => expect(screen.getByText('anonymous')).toBeInTheDocument());
  });
});
