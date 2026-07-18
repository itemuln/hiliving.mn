import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthContext, type AuthContextValue } from '../../auth/AuthContext';
import { authenticatedUser } from '../../../test/accountFixtures';
import { AdminProductEditorPage } from './AdminProductEditorPage';
import * as api from '../../../api/adminApi';

vi.mock('../../../api/adminApi', () => ({
  listCategories: vi.fn().mockResolvedValue([
    {
      id: 1,
      name: 'Home',
      slug: 'home',
      parentId: null,
      parentName: null,
      description: null,
      sortOrder: 0,
      active: true,
      childCount: 0,
      productCount: 0,
    },
  ]),
  listBrands: vi.fn().mockResolvedValue([]),
  getProduct: vi.fn(),
  createProduct: vi.fn().mockResolvedValue({}),
  updateProduct: vi.fn().mockResolvedValue({}),
  uploadMediaImage: vi.fn().mockResolvedValue({
    id: 1,
    storageKey: 'products/generated.png',
    url: '/media/products/generated.png',
    originalFilename: 'photo.png',
    contentType: 'image/png',
    sizeBytes: 100,
    width: 10,
    height: 10,
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

const existingProduct = {
  id: 42,
  name: 'Existing product',
  slug: 'existing-product',
  productCode: 'PRD-000042',
  shortDescription: 'Existing summary',
  description: 'Existing details',
  basePrice: 100,
  discountPrice: null,
  category: { id: 1, name: 'Home', slug: 'home' },
  brand: null,
  lifecycle: 'DRAFT' as const,
  stockQuantity: 2,
  lowStockThreshold: 1,
  inventoryState: 'IN_STOCK' as const,
  featured: false,
  newProduct: false,
  active: true,
  membershipDiscountEligible: true,
  images: [],
  createdAt: '2026-07-18T00:00:00Z',
  updatedAt: '2026-07-18T00:00:00Z',
};

function page(path = '/admin/products/new') {
  return (
    <AuthContext.Provider value={auth}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/admin/products/new" element={<AdminProductEditorPage />} />
          <Route path="/admin/products/:id/edit" element={<AdminProductEditorPage />} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );
}

describe('admin product editor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.getProduct).mockResolvedValue(existingProduct);
    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL: vi.fn(() => 'blob:preview'),
      revokeObjectURL: vi.fn(),
    });
  });
  it('offers exactly four upload slots, persists returned URLs, and validates publishing', async () => {
    render(page());
    await waitFor(() => expect(screen.getByText('1. Product information')).toBeInTheDocument());
    expect(screen.getAllByText('Choose file')).toHaveLength(4);
    expect(screen.queryByPlaceholderText('https://…')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Publish' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Publishing requires exactly one primary image'
    );
    const file = new File(['png'], 'photo.png', { type: 'image/png' });
    fireEvent.change(document.querySelector('input[type="file"]') as HTMLInputElement, {
      target: { files: [file] },
    });
    await waitFor(() =>
      expect(api.uploadMediaImage).toHaveBeenCalledWith(file, 'PRODUCT', expect.any(Object))
    );
    await waitFor(() =>
      expect(screen.getByAltText('Product image 1 preview')).toHaveAttribute(
        'src',
        '/media/products/generated.png'
      )
    );
    expect(screen.getAllByText('Choose file')).toHaveLength(3);
    expect(screen.getByText('Replace')).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Primary image' })).toBeChecked();
  });

  it('creates a product without exposing or submitting slug and product code fields', async () => {
    render(page());
    await screen.findByText('1. Product information');

    expect(screen.queryByLabelText('Slug')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Product code')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Short description')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Full description')).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Product name'), {
      target: { value: 'Generated identifiers' },
    });
    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: 'One product description' },
    });
    fireEvent.change(screen.getByLabelText('Category'), { target: { value: '1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save draft' }));

    await waitFor(() => expect(api.createProduct).toHaveBeenCalledTimes(1));
    const payload = vi.mocked(api.createProduct).mock.calls[0][0];
    expect(payload).toMatchObject({
      name: 'Generated identifiers',
      description: 'One product description',
      categoryId: 1,
    });
    expect(payload).not.toHaveProperty('slug');
    expect(payload).not.toHaveProperty('productCode');
    expect(payload).not.toHaveProperty('shortDescription');
  });

  it('updates a renamed product without submitting its stable identifiers', async () => {
    render(page('/admin/products/42/edit'));
    expect(await screen.findByDisplayValue('Existing product')).toBeInTheDocument();

    expect(screen.queryByLabelText('Slug')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Product code')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toHaveValue('Existing details');
    fireEvent.change(screen.getByLabelText('Product name'), {
      target: { value: 'Renamed product' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save draft' }));

    await waitFor(() => expect(api.updateProduct).toHaveBeenCalledTimes(1));
    const payload = vi.mocked(api.updateProduct).mock.calls[0][1];
    expect(payload.name).toBe('Renamed product');
    expect(payload).not.toHaveProperty('slug');
    expect(payload).not.toHaveProperty('productCode');
    expect(payload).not.toHaveProperty('shortDescription');
  });
});
