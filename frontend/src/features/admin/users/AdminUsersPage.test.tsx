import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as api from '../../../api/adminApi';
import { authenticatedUser } from '../../../test/accountFixtures';
import { AuthContext, type AuthContextValue } from '../../auth/AuthContext';
import { AdminUsersPage } from './AdminUsersPage';

vi.mock('../../../api/adminApi', () => ({
  listUsers: vi.fn(),
}));

const auth: AuthContextValue = {
  state: { status: 'authenticated', user: { ...authenticatedUser, role: 'ADMIN' } },
  hydrationError: false,
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  refresh: vi.fn(),
  replaceUser: vi.fn(),
};

describe('admin users list', () => {
  beforeEach(() => {
    vi.mocked(api.listUsers).mockResolvedValue({
      items: [{ ...authenticatedUser, orderCount: 2, totalPaid: 1089000 }],
      page: 0,
      size: 20,
      totalElements: 1,
      totalPages: 1,
      first: true,
      last: true,
    });
  });

  it('shows order, payment, membership, and registration columns', async () => {
    render(
      <AuthContext.Provider value={auth}>
        <MemoryRouter>
          <AdminUsersPage />
        </MemoryRouter>
      </AuthContext.Provider>
    );

    expect(await screen.findByText('Temuulen Ikhmandal')).toBeVisible();
    expect(screen.getByRole('columnheader', { name: 'Утасны дугаар' })).toBeVisible();
    expect(screen.getByRole('columnheader', { name: 'Захиалга' })).toBeVisible();
    expect(screen.getByRole('columnheader', { name: 'Нийт төлбөр' })).toBeVisible();
    expect(screen.getByRole('columnheader', { name: 'Гишүүнчлэл' })).toBeVisible();
    expect(screen.getByRole('columnheader', { name: 'Бүртгүүлсэн' })).toBeVisible();
    expect(screen.getByText('2 захиалга')).toBeVisible();
    expect(screen.getByText(/1[,.\s]?089[,.\s]?000₮/)).toBeVisible();
    expect(screen.getByRole('link', { name: 'Temuulen хэрэглэгчийг харах' })).toHaveAttribute(
      'href',
      '/admin/users/42'
    );
  });
});
