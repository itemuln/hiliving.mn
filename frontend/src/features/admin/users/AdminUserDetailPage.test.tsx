import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthContext, type AuthContextValue } from '../../auth/AuthContext';
import { authenticatedUser } from '../../../test/accountFixtures';
import * as api from '../../../api/adminApi';
import { AdminUserDetailPage } from './AdminUserDetailPage';

vi.mock('../../../api/adminApi', () => ({
  getUser: vi.fn(),
  getUserAddresses: vi.fn(),
  updateUserMembership: vi.fn(),
  updateUserDiscount: vi.fn(),
  updateUserStatus: vi.fn(),
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

describe('admin user detail', () => {
  beforeEach(() => {
    vi.mocked(api.getUser).mockResolvedValue(authenticatedUser);
    vi.mocked(api.getUserAddresses).mockResolvedValue([]);
  });

  it('shows only the membership default and applied discount with a readable editor', async () => {
    render(
      <AuthContext.Provider value={auth}>
        <MemoryRouter initialEntries={['/admin/users/42']}>
          <Routes>
            <Route path="/admin/users/:id" element={<AdminUserDetailPage />} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    );

    const discountInput = await screen.findByRole('spinbutton', {
      name: /Үйлчлэх хөнгөлөлт тохируулах/,
    });
    expect(discountInput).toHaveAttribute('placeholder', 'Жишээ: 5');
    expect(discountInput.parentElement).toHaveClass('sm:grid-cols-[minmax(12rem,1fr)_auto_auto]');

    expect(screen.queryByText('Тусгай хөнгөлөлт')).not.toBeInTheDocument();
    const baseDiscount = screen.getByText('Гишүүнчлэлийн үндсэн хөнгөлөлт').parentElement;
    const effectiveDiscount = screen.getByText('Хэрэглэгчид үйлчлэх хөнгөлөлт').parentElement;
    expect(baseDiscount).toHaveClass('bg-slate-50');
    expect(effectiveDiscount).toHaveClass('bg-slate-50');
    expect(
      screen.getByText('Цэвэрлэхэд гишүүнчлэлийн үндсэн 5% хөнгөлөлт үйлчилнэ.')
    ).toBeVisible();

    const membershipPanel = screen.getByRole('heading', {
      name: 'Гишүүнчлэл ба хөнгөлөлт',
    }).parentElement;
    const statusPanel = screen.getByRole('heading', { name: 'Бүртгэлийн төлөв' }).parentElement;
    expect(membershipPanel?.parentElement).not.toHaveClass('xl:grid-cols-[1.1fr_.9fr]');
    expect(
      membershipPanel && statusPanel
        ? membershipPanel.compareDocumentPosition(statusPanel) & Node.DOCUMENT_POSITION_FOLLOWING
        : 0
    ).toBeTruthy();
    expect(screen.getByRole('combobox', { name: 'Бүртгэлийн төлөв' })).toHaveValue('ACTIVE');
    expect(screen.getAllByText('Идэвхтэй')).toHaveLength(1);
  });
});
