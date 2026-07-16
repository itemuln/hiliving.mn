import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AuthContext, type AuthContextValue } from './AuthContext';
import { ProtectedRoute } from './ProtectedRoute';
import { safeReturnTo } from './returnTo';
import { authenticatedUser } from '../../test/accountFixtures';

function LocationProbe() {
  const location = useLocation();
  return <span>{`${location.pathname}${location.search}`}</span>;
}
const anonymous: AuthContextValue = {
  state: { status: 'anonymous', user: null },
  hydrationError: false,
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  refresh: vi.fn(),
  replaceUser: vi.fn(),
};

describe('protected account routes', () => {
  it('redirects anonymous users with the internal return path', () => {
    render(
      <AuthContext.Provider value={anonymous}>
        <MemoryRouter initialEntries={['/account/addresses?edit=2']}>
          <Routes>
            <Route
              path="/account/addresses"
              element={
                <ProtectedRoute>
                  <span>private</span>
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<LocationProbe />} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    );
    expect(
      screen.getByText('/login?returnTo=%2Faccount%2Faddresses%3Fedit%3D2')
    ).toBeInTheDocument();
  });

  it('accepts only same-origin relative return paths', () => {
    expect(safeReturnTo('/account/security?from=login')).toBe('/account/security?from=login');
    expect(safeReturnTo('//evil.example/steal')).toBe('/account');
    expect(safeReturnTo('https://evil.example/steal')).toBe('/account');
    expect(safeReturnTo('/\\evil')).toBe('/account');
  });

  it('rejects customers from admin routes and allows admins', () => {
    const customer: AuthContextValue = {
      ...anonymous,
      state: { status: 'authenticated', user: authenticatedUser },
    };
    const { unmount } = render(
      <AuthContext.Provider value={customer}>
        <MemoryRouter initialEntries={['/admin']}>
          <Routes>
            <Route
              path="/admin"
              element={
                <ProtectedRoute admin>
                  <span>admin area</span>
                </ProtectedRoute>
              }
            />
            <Route path="/account" element={<span>account home</span>} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    );
    expect(screen.getByText('account home')).toBeInTheDocument();
    unmount();
    const admin: AuthContextValue = {
      ...customer,
      state: { status: 'authenticated', user: { ...authenticatedUser, role: 'ADMIN' } },
    };
    render(
      <AuthContext.Provider value={admin}>
        <MemoryRouter initialEntries={['/admin']}>
          <ProtectedRoute admin>
            <span>admin area</span>
          </ProtectedRoute>
        </MemoryRouter>
      </AuthContext.Provider>
    );
    expect(screen.getByText('admin area')).toBeInTheDocument();
  });
});
