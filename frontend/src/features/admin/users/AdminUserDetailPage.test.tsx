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
  getUserOrders: vi.fn(),
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
    vi.mocked(api.getUserOrders).mockResolvedValue({
      cancelledCount: 2,
      shippedCount: 1,
      orders: {
        items: [
          {
            orderNumber: 'HL-2026-0042',
            placedAt: '2026-07-30T10:00:00Z',
            orderStatus: 'SHIPPED',
            paymentStatus: 'PAID',
            paymentMethod: 'QPAY',
            grandTotal: 130350,
            currency: 'MNT',
            itemCount: 3,
          },
        ],
        page: 0,
        size: 20,
        totalElements: 1,
        totalPages: 1,
        first: true,
        last: true,
      },
    });
  });

  it('shows the customer profile, order summary, history, and account controls', async () => {
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
      name: /Үйлчлэх хөнгөлөлт/,
    });
    expect(discountInput).toHaveAttribute('placeholder', 'Жишээ: 5');
    expect(screen.getByText('Хоосон бол үндсэн 5% хөнгөлөлт үйлчилнэ.')).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Temuulen Ikhmandal' })).toBeVisible();
    expect(screen.getByText('Хадгалсан хаяг алга')).toBeVisible();
    expect(screen.getByText('2 захиалга')).toBeVisible();
    expect(screen.getByText('1 захиалга')).toBeVisible();
    expect(screen.getByText('HL-2026-0042')).toBeVisible();
    expect(screen.getByText('3 ширхэг')).toBeVisible();
    expect(screen.getByText('Хүргэлтэд гарсан')).toBeVisible();
    expect(screen.getByText('Төлөгдсөн')).toBeVisible();
    expect(screen.getByRole('combobox', { name: 'Бүртгэлийн төлөв' })).toHaveValue('ACTIVE');
    expect(screen.getByRole('heading', { name: 'Бүртгэл удирдах' })).toBeVisible();
  });
});
