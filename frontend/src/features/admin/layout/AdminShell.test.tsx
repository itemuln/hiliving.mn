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
  it('renders the separate navigation, pages destination, and mobile drawer control', () => {
    render(
      <AuthContext.Provider value={context}>
        <MemoryRouter initialEntries={['/admin']}>
          <AdminShell title="Хяналтын самбар">
            <p>Counts</p>
          </AdminShell>
        </MemoryRouter>
      </AuthContext.Provider>
    );
    expect(screen.queryByRole('img', { name: 'HiLiving' })).not.toBeInTheDocument();
    expect(screen.queryByText('Удирдлагын хэсэг')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Захиалга' })).toHaveAttribute('href', '/admin/orders');
    expect(screen.getByRole('link', { name: 'Нүүр хуудас руу буцах' })).toHaveAttribute(
      'href',
      '/'
    );
    expect(screen.getByRole('link', { name: 'Хуудас' })).toHaveAttribute('href', '/admin/pages');
    fireEvent.click(screen.getByRole('button', { name: 'Цэс нээх' }));
    expect(screen.getByRole('button', { name: 'Цэсний дэвсгэр хаах' })).toBeInTheDocument();
    expect(screen.getByText('Counts')).toBeInTheDocument();
  });

  it('highlights only Add product on the new-product route', () => {
    render(
      <AuthContext.Provider value={context}>
        <MemoryRouter initialEntries={['/admin/products/new']}>
          <AdminShell title="Бүтээгдэхүүн нэмэх">
            <p>Editor</p>
          </AdminShell>
        </MemoryRouter>
      </AuthContext.Provider>
    );

    expect(screen.getByRole('link', { name: 'Бүтээгдэхүүн нэмэх' })).toHaveClass('bg-brand-500');
    expect(screen.getByRole('link', { name: 'Бүх бүтээгдэхүүн' })).not.toHaveClass('bg-brand-500');
  });
});
