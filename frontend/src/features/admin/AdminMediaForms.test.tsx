import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
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
    fireEvent.click(screen.getByRole('button', { name: 'Add brand' }));
    expect(screen.queryByLabelText('Logo URL')).not.toBeInTheDocument();
    fireEvent.change(document.querySelector('input[type="file"]') as HTMLInputElement, {
      target: { files: [file] },
    });
    await waitFor(() =>
      expect(screen.getByAltText('Brand logo preview')).toHaveAttribute(
        'src',
        '/media/brand/generated.png'
      )
    );
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Uploaded brand' } });
    fireEvent.change(screen.getByLabelText('Slug'), { target: { value: 'uploaded-brand' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save brand' }));
    await waitFor(() =>
      expect(api.createBrand).toHaveBeenCalledWith(
        expect.objectContaining({ logoUrl: '/media/brand/generated.png' })
      )
    );
  });

  it('uses required desktop and optional mobile banner upload controls', async () => {
    render(page(<AdminBannersPage />));
    fireEvent.click(screen.getByRole('button', { name: 'Add banner' }));
    expect(document.querySelectorAll('input[type="file"]')).toHaveLength(2);
    expect(screen.queryByText('Desktop image URL')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Starts at')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Ends at')).not.toBeInTheDocument();
    fireEvent.change(document.querySelectorAll('input[type="file"]')[0] as HTMLInputElement, {
      target: { files: [file] },
    });
    await waitFor(() =>
      expect(screen.getByAltText('Desktop banner preview')).toHaveAttribute(
        'src',
        '/media/banner/generated.png'
      )
    );
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Uploaded banner' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save banner' }));
    await waitFor(() =>
      expect(api.createBanner).toHaveBeenCalledWith(
        {
          title: 'Uploaded banner',
          subtitle: '',
          imageUrl: '/media/banner/generated.png',
          mobileImageUrl: '',
          linkUrl: '',
          linkLabel: '',
          sortOrder: 0,
          active: true,
        }
      )
    );
  });

  it('uploads and persists a news thumbnail while body authoring stays text based', async () => {
    render(page(<AdminNewsEditorPage />));
    expect(document.querySelectorAll('input[type="file"]')).toHaveLength(1);
    expect(screen.getByLabelText('Content')).toHaveAttribute('rows', '12');
    fireEvent.change(document.querySelector('input[type="file"]') as HTMLInputElement, {
      target: { files: [file] },
    });
    await waitFor(() =>
      expect(screen.getByAltText('News thumbnail preview')).toHaveAttribute(
        'src',
        '/media/news/generated.png'
      )
    );
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Uploaded news' } });
    fireEvent.change(screen.getByLabelText('Slug'), { target: { value: 'uploaded-news' } });
    fireEvent.change(screen.getByLabelText('Summary'), { target: { value: 'Summary' } });
    fireEvent.change(screen.getByLabelText('Content'), { target: { value: 'Content' } });
    fireEvent.click(screen.getByRole('button', { name: 'Publish' }));
    await waitFor(() =>
      expect(api.createNews).toHaveBeenCalledWith(
        expect.objectContaining({ thumbnailUrl: '/media/news/generated.png', published: true })
      )
    );
  });
});
