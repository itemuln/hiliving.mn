import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthContext, type AuthContextValue } from '../auth/AuthContext';
import { authenticatedUser } from '../../test/accountFixtures';
import { AdminCategoriesPage } from './categories/AdminCategoriesPage';
import * as api from '../../api/adminApi';

vi.mock('../../api/adminApi', () => ({
  listCategories: vi.fn(),
  createCategory: vi.fn().mockResolvedValue({}),
  updateCategory: vi.fn().mockResolvedValue({}),
  deleteCategory: vi.fn().mockResolvedValue(undefined),
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

describe('admin taxonomy forms', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.listCategories).mockResolvedValue([
      {
        id: 1,
        name: 'Home',
        slug: 'home',
        parentId: 9,
        parentName: 'Legacy parent',
        description: null,
        sortOrder: 0,
        active: true,
        childCount: 2,
        productCount: 3,
      },
    ]);
  });

  it('does not expose category parent or children controls', async () => {
    render(
      <AuthContext.Provider value={auth}>
        <MemoryRouter>
          <AdminCategoriesPage />
        </MemoryRouter>
      </AuthContext.Provider>
    );

    await screen.findByText('Home');
    expect(screen.queryByRole('columnheader', { name: 'Parent' })).not.toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: 'Children' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Add category' }));
    expect(screen.queryByLabelText('Parent')).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Cleaning' } });
    fireEvent.change(screen.getByLabelText('Slug'), { target: { value: 'cleaning' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save category' }));

    await waitFor(() => expect(api.createCategory).toHaveBeenCalledTimes(1));
    expect(vi.mocked(api.createCategory).mock.calls[0][0].parentId).toBeNull();
  });
});
