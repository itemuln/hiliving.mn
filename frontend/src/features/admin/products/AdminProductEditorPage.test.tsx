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
    await waitFor(() => expect(screen.getByText('1. Бүтээгдэхүүний мэдээлэл')).toBeInTheDocument());
    expect(screen.queryByLabelText('Бүтээгдэхүүний зураг 1')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Бүтээгдэхүүний зураг нэмэх')).toHaveAttribute('multiple');
    expect(screen.queryByPlaceholderText('https://…')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Нийтлэх' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Нийтлэхийн тулд яг нэг үндсэн зураг сонгоно уу'
    );
    const file = new File(['png'], 'photo.png', { type: 'image/png' });
    fireEvent.change(screen.getByLabelText('Бүтээгдэхүүний зураг нэмэх'), {
      target: { files: [file] },
    });
    await waitFor(() => expect(api.uploadMediaImage).toHaveBeenCalledWith(file, 'PRODUCT'));
    await waitFor(() =>
      expect(screen.getByAltText('Бүтээгдэхүүний зураг 1 харагдац')).toHaveAttribute(
        'src',
        '/media/products/generated.png'
      )
    );
    expect(screen.getByText('Солих')).toBeInTheDocument();
    expect(screen.queryByLabelText('Бүтээгдэхүүний зураг 2')).not.toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Үндсэн зураг' })).toBeChecked();
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
    await screen.findByText('1. Бүтээгдэхүүний мэдээлэл');
    const files = [
      new File(['one'], 'one.png', { type: 'image/png' }),
      new File(['two'], 'two.jpg', { type: 'image/jpeg' }),
      new File(['three'], 'three.png', { type: 'image/png' }),
    ];

    fireEvent.change(screen.getByLabelText('Бүтээгдэхүүний зураг нэмэх'), {
      target: { files },
    });

    await waitFor(() => expect(api.uploadMediaImage).toHaveBeenCalledTimes(3));
    expect(await screen.findByAltText('Бүтээгдэхүүний зураг 1 харагдац')).toHaveAttribute(
      'src',
      '/media/products/one.png'
    );
    expect(screen.getByAltText('Бүтээгдэхүүний зураг 2 харагдац')).toHaveAttribute(
      'src',
      '/media/products/two.jpg'
    );
    expect(screen.getByAltText('Бүтээгдэхүүний зураг 3 харагдац')).toHaveAttribute(
      'src',
      '/media/products/three.png'
    );
    expect(screen.queryByLabelText('Бүтээгдэхүүний зураг 4')).not.toBeInTheDocument();
    expect(screen.getAllByRole('radio', { name: 'Үндсэн зураг' })[0]).toBeChecked();

    const moreFiles = [
      new File(['four'], 'four.png', { type: 'image/png' }),
      new File(['five'], 'five.jpg', { type: 'image/jpeg' }),
      new File(['six'], 'six.png', { type: 'image/png' }),
    ];
    fireEvent.change(screen.getByLabelText('Бүтээгдэхүүний зураг нэмэх'), {
      target: { files: moreFiles },
    });

    await waitFor(() => expect(api.uploadMediaImage).toHaveBeenCalledTimes(6));
    expect(await screen.findByAltText('Бүтээгдэхүүний зураг 6 харагдац')).toHaveAttribute(
      'src',
      '/media/products/six.png'
    );
    expect(screen.queryByLabelText('Бүтээгдэхүүний зураг нэмэх')).not.toBeInTheDocument();
  });

  it('normalizes product number inputs without breaking decimal prices', async () => {
    render(page());
    await screen.findByText('1. Бүтээгдэхүүний мэдээлэл');
    const basePrice = screen.getByRole('spinbutton', { name: 'Үндсэн үнэ' });
    const stockQuantity = screen.getByRole('spinbutton', { name: 'Үлдэгдэл тоо' });

    fireEvent.change(basePrice, { target: { value: '023' } });
    fireEvent.change(stockQuantity, { target: { value: '01' } });
    expect(basePrice).toHaveValue(23);
    expect(stockQuantity).toHaveValue(1);

    fireEvent.change(basePrice, { target: { value: '0.25' } });
    expect(basePrice).toHaveValue(0.25);
  });

  it('shows an invalid state instead of a negative discount percentage', async () => {
    render(page());
    await screen.findByText('1. Бүтээгдэхүүний мэдээлэл');

    fireEvent.change(screen.getByRole('spinbutton', { name: 'Үндсэн үнэ' }), {
      target: { value: '100' },
    });
    fireEvent.click(screen.getByRole('checkbox', { name: 'Энэ бүтээгдэхүүн хөнгөлөлттэй' }));
    fireEvent.click(screen.getByRole('radio', { name: 'Хямдарсан үнээр' }));
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Хямдарсан үнэ' }), {
      target: { value: '14930' },
    });

    expect(screen.getByText('Зөв хөнгөлөлт оруулна уу')).toBeInTheDocument();
    expect(screen.queryByText('-14830%')).not.toBeInTheDocument();
  });

  it('keeps discount fields hidden until enabled and accepts a percentage', async () => {
    render(page());
    await screen.findByText('1. Бүтээгдэхүүний мэдээлэл');

    const discountToggle = screen.getByRole('checkbox', {
      name: 'Энэ бүтээгдэхүүн хөнгөлөлттэй',
    });
    expect(discountToggle).not.toBeChecked();
    expect(screen.queryByRole('spinbutton', { name: 'Хөнгөлөлтийн хувь' })).not.toBeInTheDocument();
    expect(screen.queryByRole('spinbutton', { name: 'Хямдарсан үнэ' })).not.toBeInTheDocument();

    fireEvent.change(screen.getByRole('spinbutton', { name: 'Үндсэн үнэ' }), {
      target: { value: '1000' },
    });
    fireEvent.click(discountToggle);
    expect(screen.getByRole('radio', { name: 'Хувиар' })).toBeChecked();
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Хөнгөлөлтийн хувь' }), {
      target: { value: '25' },
    });

    expect(screen.getByText('₮ 750')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Ангилал'), { target: { value: '1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Ноорог хадгалах' }));

    await waitFor(() => expect(api.createProduct).toHaveBeenCalledTimes(1));
    expect(vi.mocked(api.createProduct).mock.calls[0][0].discountPrice).toBe(750);
  });

  it('accepts a final discounted price and calculates its percentage', async () => {
    render(page());
    await screen.findByText('1. Бүтээгдэхүүний мэдээлэл');

    fireEvent.change(screen.getByRole('spinbutton', { name: 'Үндсэн үнэ' }), {
      target: { value: '200' },
    });
    fireEvent.click(screen.getByRole('checkbox', { name: 'Энэ бүтээгдэхүүн хөнгөлөлттэй' }));
    fireEvent.click(screen.getByRole('radio', { name: 'Хямдарсан үнээр' }));
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Хямдарсан үнэ' }), {
      target: { value: '150' },
    });

    expect(screen.getByText('25%')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Ангилал'), { target: { value: '1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Ноорог хадгалах' }));

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
      name: 'Энэ бүтээгдэхүүн хөнгөлөлттэй',
    });
    expect(discountToggle).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Хямдарсан үнээр' })).toBeChecked();
    expect(screen.getByRole('spinbutton', { name: 'Хямдарсан үнэ' })).toHaveValue(80);
    expect(screen.getByText('20%')).toBeInTheDocument();

    fireEvent.click(discountToggle);
    expect(screen.queryByRole('spinbutton', { name: 'Хямдарсан үнэ' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Ноорог хадгалах' }));

    await waitFor(() => expect(api.updateProduct).toHaveBeenCalledTimes(1));
    expect(vi.mocked(api.updateProduct).mock.calls[0][1].discountPrice).toBeNull();
  });

  it('creates a product without exposing or submitting slug and product code fields', async () => {
    render(page());
    await screen.findByText('1. Бүтээгдэхүүний мэдээлэл');

    expect(screen.queryByLabelText('Slug')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Product code')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Short description')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Full description')).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Бүтээгдэхүүний нэр'), {
      target: { value: 'Generated identifiers' },
    });
    fireEvent.change(screen.getByLabelText('Тайлбар'), {
      target: { value: 'One product description' },
    });
    fireEvent.change(screen.getByLabelText('Ангилал'), { target: { value: '1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Ноорог хадгалах' }));

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
    expect(screen.getByLabelText('Тайлбар')).toHaveValue('Existing details');
    fireEvent.change(screen.getByLabelText('Бүтээгдэхүүний нэр'), {
      target: { value: 'Renamed product' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Ноорог хадгалах' }));

    await waitFor(() => expect(api.updateProduct).toHaveBeenCalledTimes(1));
    const payload = vi.mocked(api.updateProduct).mock.calls[0][1];
    expect(payload.name).toBe('Renamed product');
    expect(payload).not.toHaveProperty('slug');
    expect(payload).not.toHaveProperty('productCode');
    expect(payload).not.toHaveProperty('shortDescription');
  });
});
