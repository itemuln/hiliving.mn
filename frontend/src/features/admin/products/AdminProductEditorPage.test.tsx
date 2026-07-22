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
  it('shows image cards only after batch selection and validates publishing', async () => {
    render(page());
    await waitFor(() => expect(screen.getByText('1. Product information')).toBeInTheDocument());
    expect(screen.queryByLabelText('Product image 1')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Add product photos')).toHaveAttribute('multiple');
    expect(screen.queryByPlaceholderText('https://…')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Publish' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Publishing requires exactly one primary image'
    );
    const file = new File(['png'], 'photo.png', { type: 'image/png' });
    fireEvent.change(screen.getByLabelText('Add product photos'), {
      target: { files: [file] },
    });
    await waitFor(() => expect(api.uploadMediaImage).toHaveBeenCalledWith(file, 'PRODUCT'));
    await waitFor(() =>
      expect(screen.getByAltText('Product image 1 preview')).toHaveAttribute(
        'src',
        '/media/products/generated.png'
      )
    );
    expect(screen.getByText('Replace')).toBeInTheDocument();
    expect(screen.queryByLabelText('Product image 2')).not.toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Primary image' })).toBeChecked();
  });

  it('renders selected product photos dynamically up to the six-image limit', async () => {
    vi.mocked(api.uploadMediaImage).mockImplementation(async (file) => ({
      id: 1,
      storageKey: `products/${file.name}`,
      url: `/media/products/${file.name}`,
      originalFilename: file.name,
      contentType: file.type as 'image/jpeg' | 'image/png',
      sizeBytes: file.size,
      width: 10,
      height: 10,
    }));
    render(page());
    await screen.findByText('1. Product information');
    const files = [
      new File(['one'], 'one.png', { type: 'image/png' }),
      new File(['two'], 'two.jpg', { type: 'image/jpeg' }),
      new File(['three'], 'three.png', { type: 'image/png' }),
    ];

    fireEvent.change(screen.getByLabelText('Add product photos'), {
      target: { files },
    });

    await waitFor(() => expect(api.uploadMediaImage).toHaveBeenCalledTimes(3));
    expect(await screen.findByAltText('Product image 1 preview')).toHaveAttribute(
      'src',
      '/media/products/one.png'
    );
    expect(screen.getByAltText('Product image 2 preview')).toHaveAttribute(
      'src',
      '/media/products/two.jpg'
    );
    expect(screen.getByAltText('Product image 3 preview')).toHaveAttribute(
      'src',
      '/media/products/three.png'
    );
    expect(screen.queryByLabelText('Product image 4')).not.toBeInTheDocument();
    expect(screen.getAllByRole('radio', { name: 'Primary image' })[0]).toBeChecked();

    const moreFiles = [
      new File(['four'], 'four.png', { type: 'image/png' }),
      new File(['five'], 'five.jpg', { type: 'image/jpeg' }),
      new File(['six'], 'six.png', { type: 'image/png' }),
    ];
    fireEvent.change(screen.getByLabelText('Add product photos'), {
      target: { files: moreFiles },
    });

    await waitFor(() => expect(api.uploadMediaImage).toHaveBeenCalledTimes(6));
    expect(await screen.findByAltText('Product image 6 preview')).toHaveAttribute(
      'src',
      '/media/products/six.png'
    );
    expect(screen.queryByLabelText('Add product photos')).not.toBeInTheDocument();
  });

  it('normalizes product number inputs without breaking decimal prices', async () => {
    render(page());
    await screen.findByText('1. Product information');
    const basePrice = screen.getByRole('spinbutton', { name: 'Base price' });
    const stockQuantity = screen.getByRole('spinbutton', { name: 'Stock quantity' });

    fireEvent.change(basePrice, { target: { value: '023' } });
    fireEvent.change(stockQuantity, { target: { value: '01' } });
    expect(basePrice).toHaveValue(23);
    expect(stockQuantity).toHaveValue(1);

    fireEvent.change(basePrice, { target: { value: '0.25' } });
    expect(basePrice).toHaveValue(0.25);
  });

  it('shows an invalid state instead of a negative discount percentage', async () => {
    render(page());
    await screen.findByText('1. Product information');

    fireEvent.change(screen.getByRole('spinbutton', { name: 'Base price' }), {
      target: { value: '100' },
    });
    fireEvent.click(screen.getByRole('checkbox', { name: 'This product has a discount' }));
    fireEvent.click(screen.getByRole('radio', { name: 'Discounted price' }));
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Discounted price' }), {
      target: { value: '14930' },
    });

    expect(screen.getByText('Enter a valid discount')).toBeInTheDocument();
    expect(screen.queryByText('-14830%')).not.toBeInTheDocument();
  });

  it('keeps discount fields hidden until enabled and accepts a percentage', async () => {
    render(page());
    await screen.findByText('1. Product information');

    const discountToggle = screen.getByRole('checkbox', {
      name: 'This product has a discount',
    });
    expect(discountToggle).not.toBeChecked();
    expect(
      screen.queryByRole('spinbutton', { name: 'Discount percentage' })
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('spinbutton', { name: 'Discounted price' })).not.toBeInTheDocument();

    fireEvent.change(screen.getByRole('spinbutton', { name: 'Base price' }), {
      target: { value: '1000' },
    });
    fireEvent.click(discountToggle);
    expect(screen.getByRole('radio', { name: 'Percentage' })).toBeChecked();
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Discount percentage' }), {
      target: { value: '25' },
    });

    expect(screen.getByText('₮ 750')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Category'), { target: { value: '1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save draft' }));

    await waitFor(() => expect(api.createProduct).toHaveBeenCalledTimes(1));
    expect(vi.mocked(api.createProduct).mock.calls[0][0].discountPrice).toBe(750);
  });

  it('accepts a final discounted price and calculates its percentage', async () => {
    render(page());
    await screen.findByText('1. Product information');

    fireEvent.change(screen.getByRole('spinbutton', { name: 'Base price' }), {
      target: { value: '200' },
    });
    fireEvent.click(screen.getByRole('checkbox', { name: 'This product has a discount' }));
    fireEvent.click(screen.getByRole('radio', { name: 'Discounted price' }));
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Discounted price' }), {
      target: { value: '150' },
    });

    expect(screen.getByText('25%')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Category'), { target: { value: '1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save draft' }));

    await waitFor(() => expect(api.createProduct).toHaveBeenCalledTimes(1));
    expect(vi.mocked(api.createProduct).mock.calls[0][0].discountPrice).toBe(150);
  });

  it('loads an existing discount and removes it when the checkbox is cleared', async () => {
    vi.mocked(api.getProduct).mockResolvedValue({
      ...existingProduct,
      discountPrice: 80,
    });
    render(page('/admin/products/42/edit'));

    expect(await screen.findByDisplayValue('Existing product')).toBeInTheDocument();
    const discountToggle = screen.getByRole('checkbox', {
      name: 'This product has a discount',
    });
    expect(discountToggle).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Discounted price' })).toBeChecked();
    expect(screen.getByRole('spinbutton', { name: 'Discounted price' })).toHaveValue(80);
    expect(screen.getByText('20%')).toBeInTheDocument();

    fireEvent.click(discountToggle);
    expect(screen.queryByRole('spinbutton', { name: 'Discounted price' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Save draft' }));

    await waitFor(() => expect(api.updateProduct).toHaveBeenCalledTimes(1));
    expect(vi.mocked(api.updateProduct).mock.calls[0][1].discountPrice).toBeNull();
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
