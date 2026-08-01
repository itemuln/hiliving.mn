import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as api from '../../../api/adminApi';
import { authenticatedUser } from '../../../test/accountFixtures';
import { AuthContext, type AuthContextValue } from '../../auth/AuthContext';
import type { ContentPage } from '../admin.types';
import { AdminPageEditorPage } from './AdminPageEditorPage';
import { AdminPagesPage } from './AdminPagesPage';

vi.mock('../../../api/adminApi', () => ({
  listContentPages: vi.fn(),
  getContentPage: vi.fn(),
  updateContentPage: vi.fn(),
}));

vi.mock('../components/RichTextEditor', () => ({
  RichTextEditor: ({
    value,
    onChange,
    onReady,
  }: {
    value: string;
    onChange: (value: string) => void;
    onReady: (editor: {
      getContent: () => string;
      uploadImages: () => Promise<readonly { status: boolean }[]>;
    }) => void;
  }) => {
    onReady({ getContent: () => value, uploadImages: async () => [] });
    return (
      <textarea
        aria-label="HTML агуулга"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    );
  },
}));

const contentPage: ContentPage = {
  id: 3,
  slug: 'membership',
  navigationLabel: 'ГИШҮҮНЧЛЭЛ',
  title: 'Гишүүнчлэл',
  contentHtml: '<p>Одоогийн агуулга</p>',
  published: false,
  sortOrder: 30,
  createdAt: '2026-08-01T00:00:00Z',
  updatedAt: '2026-08-01T00:00:00Z',
};

const auth: AuthContextValue = {
  state: { status: 'authenticated', user: { ...authenticatedUser, role: 'ADMIN' } },
  hydrationError: false,
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  refresh: vi.fn(),
  replaceUser: vi.fn(),
};

describe('administration pages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.listContentPages).mockResolvedValue([contentPage]);
    vi.mocked(api.getContentPage).mockResolvedValue(contentPage);
    vi.mocked(api.updateContentPage).mockResolvedValue({ ...contentPage, published: true });
  });

  it('lists the fixed Hiliving MGL sections with publication state', async () => {
    render(
      <AuthContext.Provider value={auth}>
        <MemoryRouter initialEntries={['/admin/pages']}>
          <AdminPagesPage />
        </MemoryRouter>
      </AuthContext.Provider>
    );

    expect(await screen.findByText('Гишүүнчлэл')).toBeInTheDocument();
    expect(screen.queryByText('ГИШҮҮНЧЛЭЛ')).not.toBeInTheDocument();
    expect(screen.getByText('Ноорог')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Гишүүнчлэл засах' })).toHaveAttribute(
      'href',
      '/admin/pages/3/edit'
    );
  });

  it('uploads editor state before publishing the selected page', async () => {
    render(
      <AuthContext.Provider value={auth}>
        <MemoryRouter initialEntries={['/admin/pages/3/edit']}>
          <Routes>
            <Route path="/admin/pages/:id/edit" element={<AdminPageEditorPage />} />
            <Route path="/admin/pages" element={<p>Page list</p>} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    );

    fireEvent.change(await screen.findByLabelText('Гарчиг'), {
      target: { value: 'Шинэ гишүүнчлэл' },
    });
    fireEvent.change(screen.getByLabelText('HTML агуулга'), {
      target: { value: '<h2>Шинэ агуулга</h2>' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Нийтлэх' }));

    await waitFor(() =>
      expect(api.updateContentPage).toHaveBeenCalledWith(3, {
        title: 'Шинэ гишүүнчлэл',
        contentHtml: '<h2>Шинэ агуулга</h2>',
        published: true,
      })
    );
    expect(await screen.findByText('Page list')).toBeInTheDocument();
  });
});
