import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { jsonResponse } from '../test/catalogFixtures';
import { productDetailDto } from '../test/catalogFixtures';
import { CartContext, type CartContextValue } from '../features/cart/CartContext';
import { ProductDetailPage } from './ProductDetailPage';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('ProductDetailPage', () => {
  function renderPage(cartOverrides: Partial<CartContextValue> = {}) {
    const cart: CartContextValue = {
      items: [],
      itemCount: 0,
      quote: null,
      quoteStatus: 'idle',
      quoteError: null,
      addItem: vi.fn(),
      removeItem: vi.fn(),
      setQuantity: vi.fn(),
      clearCart: vi.fn(),
      refreshQuote: vi.fn().mockResolvedValue(null),
      ...cartOverrides,
    };
    render(
      <MemoryRouter initialEntries={['/products/plant-based-household-cleaner']}>
        <CartContext.Provider value={cart}>
          <Routes>
            <Route path="/products/:productSlug" element={<ProductDetailPage />} />
          </Routes>
        </CartContext.Provider>
      </MemoryRouter>
    );
    return cart;
  }

  it('renders a safe product-not-found state for backend 404 responses', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse(
          {
            error: {
              code: 'RESOURCE_NOT_FOUND',
              message: 'Internal persistence details must not be shown',
              path: '/api/v1/products/missing-product',
              timestamp: '2026-07-15T10:00:00Z',
              fieldErrors: [],
            },
          },
          404
        )
      )
    );

    renderPage();

    expect(
      await screen.findByRole('heading', { name: 'Бүтээгдэхүүн олдсонгүй' })
    ).toBeInTheDocument();
    expect(screen.queryByText(/persistence details/)).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Каталог руу буцах' })).toHaveAttribute(
      'href',
      '/categories'
    );
  });

  it('renders authoritative pricing, switches images, bounds quantity, and adds to cart', async () => {
    const detail = {
      ...productDetailDto,
      images: [
        ...productDetailDto.images,
        {
          id: 2,
          imageUrl: '/product-second.png',
          altText: 'Second view',
          displayOrder: 1,
          primaryImage: false,
        },
      ],
      availableQuantity: 2,
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ data: detail })));
    const addItem = vi.fn();
    renderPage({ addItem });

    expect(await screen.findByRole('heading', { name: detail.name })).toBeInTheDocument();
    expect(screen.getByText('45,000₮')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: `${detail.name} зураг 2` }));
    expect(screen.getByAltText(detail.name)).toHaveAttribute('src', '/product-second.png');
    fireEvent.click(screen.getByRole('button', { name: 'Тоо ширхэг нэмэх' }));
    expect(screen.getByRole('spinbutton', { name: 'Тоо ширхэг' })).toHaveValue(2);
    expect(screen.getByRole('button', { name: 'Тоо ширхэг нэмэх' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Сагсанд нэмэх' }));
    expect(addItem).toHaveBeenCalledWith(detail.slug, 2, 2);
  });
});
