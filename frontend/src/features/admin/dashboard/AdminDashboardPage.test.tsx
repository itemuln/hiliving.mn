import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AuthContext, type AuthContextValue } from '../../auth/AuthContext';
import { authenticatedUser } from '../../../test/accountFixtures';
import { AdminDashboardPage } from './AdminDashboardPage';

vi.mock('../../../api/adminApi', () => ({
  getDashboard: vi.fn().mockResolvedValue({
    totalProducts: 12,
    activeProducts: 8,
    draftProducts: 3,
    archivedProducts: 1,
    categories: 4,
    brands: 5,
    users: 6,
    activeBanners: 2,
    publishedNews: 7,
  }),
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

describe('admin dashboard', () => {
  it('links every summary card to its corresponding admin area', async () => {
    render(
      <AuthContext.Provider value={auth}>
        <MemoryRouter>
          <AdminDashboardPage />
        </MemoryRouter>
      </AuthContext.Provider>
    );

    expect(await screen.findByRole('link', { name: '12 Нийт бүтээгдэхүүн' })).toHaveAttribute(
      'href',
      '/admin/products'
    );
    expect(screen.getByRole('link', { name: '4 Ангилал' })).toHaveAttribute(
      'href',
      '/admin/categories'
    );
    expect(screen.getByRole('link', { name: '5 Брэнд' })).toHaveAttribute('href', '/admin/brands');
    expect(screen.getByRole('link', { name: '6 Хэрэглэгч' })).toHaveAttribute(
      'href',
      '/admin/users'
    );
    expect(screen.getByRole('link', { name: '2 Идэвхтэй баннер' })).toHaveAttribute(
      'href',
      '/admin/banners'
    );
    expect(screen.getByRole('link', { name: '7 Нийтэлсэн мэдээ' })).toHaveAttribute(
      'href',
      '/admin/news'
    );
  });
});
