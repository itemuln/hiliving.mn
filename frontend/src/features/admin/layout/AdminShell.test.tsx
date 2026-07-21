import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AuthContext, type AuthContextValue } from '../../auth/AuthContext';
import { authenticatedUser } from '../../../test/accountFixtures';
import { AdminShell } from './AdminShell';
const context: AuthContextValue = {
  state: { status: 'authenticated', user: { ...authenticatedUser, role: 'ADMIN' } },
  hydrationError: false,
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  refresh: vi.fn(),
  replaceUser: vi.fn(),
};
describe('admin shell', () => {
  it('renders the separate navigation, disabled future items, and mobile drawer control', () => {
    render(
      <AuthContext.Provider value={context}>
        <MemoryRouter initialEntries={['/admin']}>
          <AdminShell title="Dashboard">
            <p>Counts</p>
          </AdminShell>
        </MemoryRouter>
      </AuthContext.Provider>
    );
    expect(screen.getByText('HiLiving')).toBeInTheDocument();
    expect(screen.getByText('Orders').closest('[aria-disabled="true"]')).toBeInTheDocument();
    expect(screen.getByText('Pages').closest('[aria-disabled="true"]')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Open navigation' }));
    expect(screen.getByRole('button', { name: 'Close navigation overlay' })).toBeInTheDocument();
    expect(screen.getByText('Counts')).toBeInTheDocument();
  });

  it('highlights only Add product on the new-product route', () => {
    render(
      <AuthContext.Provider value={context}>
        <MemoryRouter initialEntries={['/admin/products/new']}>
          <AdminShell title="Add product">
            <p>Editor</p>
          </AdminShell>
        </MemoryRouter>
      </AuthContext.Provider>
    );

    expect(screen.getByRole('link', { name: 'Add product' })).toHaveClass('bg-brand-500');
    expect(screen.getByRole('link', { name: 'All products' })).not.toHaveClass('bg-brand-500');
  });
});
