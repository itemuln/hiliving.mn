import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { AdminBrandsPage } from './brands/AdminBrandsPage';
import { AdminBannersPage } from './banners/AdminBannersPage';
import { AdminNewsEditorPage } from './news/AdminNewsEditorPage';
import * as api from '../../api/adminApi';
import { AuthContext, type AuthContextValue } from '../auth/AuthContext';
import { authenticatedUser } from '../../test/accountFixtures';

vi.mock('../../api/adminApi', () => ({
  listBrands: vi.fn().mockResolvedValue([]),
  createBrand: vi.fn().mockResolvedValue({}),
  listBanners: vi.fn().mockResolvedValue([]),
  createBanner: vi.fn().mockResolvedValue({}),
  createNews: vi.fn().mockResolvedValue({}),
  uploadMediaImage: vi.fn(),
}));

const asset = (purpose: string) => ({
  id: 1,
  storageKey: `${purpose}/generated.png`,
  url: `/media/${purpose}/generated.png`,
  originalFilename: 'image.png',
  contentType: 'image/png' as const,
  sizeBytes: 10,
  width: 10,
  height: 10,
});
const file = new File(['png'], 'image.png', { type: 'image/png' });
const auth: AuthContextValue = {
  state: { status: 'authenticated', user: { ...authenticatedUser, role: 'ADMIN' } },
  hydrationError: false,
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  refresh: vi.fn(),
  replaceUser: vi.fn(),
};
const page = (component: ReactNode) => (
  <AuthContext.Provider value={auth}>
    <MemoryRouter>{component}</MemoryRouter>
  </AuthContext.Provider>
);

describe('admin media forms', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL: vi.fn(() => 'blob:preview'),
      revokeObjectURL: vi.fn(),
    });
    vi.mocked(api.uploadMediaImage).mockImplementation(async (_file, purpose) =>
      asset(purpose.toLowerCase())
    );
  });

  it('uploads a brand logo without exposing a URL input', async () => {
    render(page(<AdminBrandsPage />));
    fireEvent.click(screen.getByRole('button', { name: 'Брэнд нэмэх' }));
    expect(screen.queryByLabelText('Logo URL')).not.toBeInTheDocument();
    fireEvent.change(document.querySelector('input[type="file"]') as HTMLInputElement, {
      target: { files: [file] },
    });
    await waitFor(() =>
      expect(screen.getByAltText('Брэндийн лого харагдац')).toHaveAttribute(
        'src',
        '/media/brand/generated.png'
      )
    );
    fireEvent.change(screen.getByLabelText('Нэр'), { target: { value: 'Uploaded brand' } });
    fireEvent.change(screen.getByLabelText('Slug'), { target: { value: 'uploaded-brand' } });
    expect(screen.queryByLabelText('Sort order')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Брэнд хадгалах' }));
    await waitFor(() =>
      expect(api.createBrand).toHaveBeenCalledWith(
        expect.objectContaining({ logoUrl: '/media/brand/generated.png' })
      )
    );
    expect(vi.mocked(api.createBrand).mock.calls[0][0]).not.toHaveProperty('sortOrder');
  });

  it('uploads desktop and mobile banner photos in one two-file batch', async () => {
    vi.mocked(api.uploadMediaImage).mockImplementation(async (selectedFile, purpose) => ({
      ...asset(purpose.toLowerCase()),
      url: `/media/banner/${selectedFile.name}`,
      originalFilename: selectedFile.name,
    }));
    render(page(<AdminBannersPage />));
    fireEvent.click(screen.getByRole('button', { name: 'Баннер нэмэх' }));
    expect(screen.getByLabelText('Баннер зураг нэмэх')).toHaveAttribute('multiple');
    expect(screen.queryByLabelText('Компьютерийн баннер')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Destination URL')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Link label')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Starts at')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Ends at')).not.toBeInTheDocument();
    const sortOrder = screen.getByRole('spinbutton', { name: 'Эрэмбэ' });
    fireEvent.change(sortOrder, { target: { value: '023' } });
    expect(sortOrder).toHaveValue(23);
    const desktop = new File(['desktop'], 'desktop.png', { type: 'image/png' });
    const mobile = new File(['mobile'], 'mobile.jpg', { type: 'image/jpeg' });
    fireEvent.change(screen.getByLabelText('Баннер зураг нэмэх'), {
      target: { files: [desktop, mobile] },
    });
    await waitFor(() => expect(api.uploadMediaImage).toHaveBeenCalledTimes(2));
    expect(await screen.findByAltText('Компьютерийн баннер харагдац')).toHaveAttribute(
      'src',
      '/media/banner/desktop.png'
    );
    expect(screen.getByAltText('Гар утасны баннер харагдац')).toHaveAttribute(
      'src',
      '/media/banner/mobile.jpg'
    );
    expect(screen.queryByLabelText('Баннер зураг нэмэх')).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Гарчиг'), { target: { value: 'Uploaded banner' } });
    fireEvent.click(screen.getByRole('button', { name: 'Баннер хадгалах' }));
    await waitFor(() =>
      expect(api.createBanner).toHaveBeenCalledWith({
        title: 'Uploaded banner',
        subtitle: '',
        imageUrl: '/media/banner/desktop.png',
        mobileImageUrl: '/media/banner/mobile.jpg',
        sortOrder: 23,
        active: true,
      })
    );
  });

  it('uploads and persists a news thumbnail while body authoring stays text based', async () => {
    render(page(<AdminNewsEditorPage />));
    expect(document.querySelectorAll('input[type="file"]')).toHaveLength(1);
    expect(screen.getByLabelText('Агуулга')).toHaveAttribute('rows', '12');
    expect(screen.queryByLabelText('Sort order')).not.toBeInTheDocument();
    fireEvent.change(document.querySelector('input[type="file"]') as HTMLInputElement, {
      target: { files: [file] },
    });
    await waitFor(() =>
      expect(screen.getByAltText('Мэдээний нүүр зураг харагдац')).toHaveAttribute(
        'src',
        '/media/news/generated.png'
      )
    );
    fireEvent.change(screen.getByLabelText('Гарчиг'), { target: { value: 'Uploaded news' } });
    fireEvent.change(screen.getByLabelText('Slug'), { target: { value: 'uploaded-news' } });
    fireEvent.change(screen.getByLabelText('Товч тайлбар'), { target: { value: 'Summary' } });
    fireEvent.change(screen.getByLabelText('Агуулга'), { target: { value: 'Content' } });
    fireEvent.click(screen.getByRole('button', { name: 'Нийтлэх' }));
    await waitFor(() =>
      expect(api.createNews).toHaveBeenCalledWith(
        expect.objectContaining({ thumbnailUrl: '/media/news/generated.png', published: true })
      )
    );
    expect(vi.mocked(api.createNews).mock.calls[0][0]).not.toHaveProperty('sortOrder');
  });
});
