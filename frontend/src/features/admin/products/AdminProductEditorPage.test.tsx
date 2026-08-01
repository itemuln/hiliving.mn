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
    return <textarea value={value} onChange={(event) => onChange(event.target.value)} />;
  },
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
    const productInformation = await screen.findByText('1. Бүтээгдэхүүний мэдээлэл');
    expect(productInformation.closest('section')).toHaveTextContent('Бүтээгдэхүүний зураг');
    expect(screen.queryByText('4. Бүтээгдэхүүний зураг')).not.toBeInTheDocument();
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

  it('persists the chosen image scale and order', async () => {
    vi.mocked(api.getProduct).mockResolvedValue({
      ...existingProduct,
      images: [
        {
          id: 1,
          imageUrl: '/media/products/front.png',
          altText: 'Front',
          displayOrder: 0,
          primaryImage: true,
          displayScale: 100,
        },
        {
          id: 2,
          imageUrl: '/media/products/detail.png',
          altText: 'Detail',
          displayOrder: 1,
          primaryImage: false,
          displayScale: 90,
        },
      ],
    });
    render(page('/admin/products/42/edit'));

    const frontPreview = await screen.findByAltText('Бүтээгдэхүүний зураг 1 харагдац');
    fireEvent.change(
      screen.getByRole('slider', { name: 'Бүтээгдэхүүний зураг 1 харагдах хэмжээ' }),
      { target: { value: '125' } }
    );
    expect(frontPreview).toHaveStyle({ transform: 'scale(1.25)' });

    fireEvent.click(screen.getByRole('button', { name: '1-р зургийг хойш зөөх' }));
    fireEvent.click(screen.getByRole('button', { name: 'Ноорог хадгалах' }));

    await waitFor(() => expect(api.updateProduct).toHaveBeenCalledTimes(1));
    expect(vi.mocked(api.updateProduct).mock.calls[0][1].images).toEqual([
      expect.objectContaining({
        imageUrl: '/media/products/detail.png',
        sortOrder: 0,
        displayScale: 90,
      }),
      expect.objectContaining({
        imageUrl: '/media/products/front.png',
        sortOrder: 1,
        primaryImage: true,
        displayScale: 125,
      }),
    ]);
  });

  it('normalizes product number inputs without breaking decimal prices', async () => {
    render(page());
    await screen.findByText('1. Бүтээгдэхүүний мэдээлэл');
    const basePrice = screen.getByRole('spinbutton', { name: 'Үндсэн үнэ' });

    fireEvent.change(basePrice, { target: { value: '023' } });
    expect(basePrice).toHaveValue(23);

    fireEvent.change(basePrice, { target: { value: '0.25' } });
    expect(basePrice).toHaveValue(0.25);
  });

  it('uses one optional sale-price field and treats an empty value as no sale', async () => {
    render(page());
    await screen.findByText('1. Бүтээгдэхүүний мэдээлэл');

    expect(screen.getByRole('spinbutton', { name: 'Хямдарсан үнэ' })).toHaveValue(null);
    expect(screen.getByText('Хоосон орхивол бүтээгдэхүүн хямдралгүй байна.')).toBeInTheDocument();
    expect(screen.queryByText('Хөнгөлөлт оруулах хэлбэр')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('checkbox', { name: 'Энэ бүтээгдэхүүн хөнгөлөлттэй' })
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('spinbutton', { name: 'Үлдэгдэл тоо' })).not.toBeInTheDocument();
    expect(screen.queryByRole('spinbutton', { name: 'Нөөц багассаны босго' })).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Ангилал'), { target: { value: '1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Ноорог хадгалах' }));

    await waitFor(() => expect(api.createProduct).toHaveBeenCalledTimes(1));
    expect(vi.mocked(api.createProduct).mock.calls[0][0].discountPrice).toBeNull();
  });

  it('submits a directly entered sale price', async () => {
    render(page());
    await screen.findByText('1. Бүтээгдэхүүний мэдээлэл');

    fireEvent.change(screen.getByRole('spinbutton', { name: 'Үндсэн үнэ' }), {
      target: { value: '200' },
    });
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Хямдарсан үнэ' }), {
      target: { value: '150' },
    });

    fireEvent.change(screen.getByLabelText('Ангилал'), { target: { value: '1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Ноорог хадгалах' }));

    await waitFor(() => expect(api.createProduct).toHaveBeenCalledTimes(1));
    expect(vi.mocked(api.createProduct).mock.calls[0][0].discountPrice).toBe(150);
  });

  it('rejects a sale price that is not lower than the base price', async () => {
    render(page());
    await screen.findByText('1. Бүтээгдэхүүний мэдээлэл');

    fireEvent.change(screen.getByRole('spinbutton', { name: 'Үндсэн үнэ' }), {
      target: { value: '100' },
    });
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Хямдарсан үнэ' }), {
      target: { value: '100' },
    });
    fireEvent.change(screen.getByLabelText('Ангилал'), { target: { value: '1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Ноорог хадгалах' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Хямдарсан үнэ үндсэн үнээс бага байх ёстой.'
    );
    expect(api.createProduct).not.toHaveBeenCalled();
  });

  it('loads an existing sale price and removes the sale when cleared', async () => {
    vi.mocked(api.getProduct).mockResolvedValue({
      ...existingProduct,
      discountPrice: 80,
    });
    render(page('/admin/products/42/edit'));

    expect(await screen.findByDisplayValue('Existing product')).toBeInTheDocument();
    const salePrice = screen.getByRole('spinbutton', { name: 'Хямдарсан үнэ' });
    expect(salePrice).toHaveValue(80);
    fireEvent.change(salePrice, { target: { value: '' } });
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
