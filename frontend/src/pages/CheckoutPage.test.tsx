import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AuthContext, type AuthContextValue } from '../features/auth/AuthContext';
import { CartContext, type CartContextValue } from '../features/cart/CartContext';
import { authenticatedUser } from '../test/accountFixtures';
import { CheckoutPage } from './CheckoutPage';

const quote = {
  items: [
    {
      productId: 1,
      productSlug: 'test-product',
      productName: 'Test product',
      sku: 'TEST-1',
      primaryImageUrl: null,
      requestedQuantity: 1,
      availableQuantity: 2,
      unitRegularPrice: 10000,
      unitCatalogPrice: 9000,
      unitEffectivePrice: 9000,
      membershipDiscountPercentage: 0,
      discountAmount: 1000,
      lineSubtotal: 9000,
      membershipDiscountEligible: true,
      inventoryStatus: 'IN_STOCK' as const,
      warnings: [],
    },
  ],
  regularSubtotal: 10000,
  catalogDiscountTotal: 1000,
  membershipDiscountTotal: 0,
  discountTotal: 1000,
  effectiveSubtotal: 9000,
  shippingAmount: 5000,
  grandTotal: 14000,
  currency: 'MNT' as const,
  valid: true,
};

const address = {
  id: 7,
  label: 'Home',
  cityOrProvince: 'Ulaanbaatar',
  districtOrSoum: 'Sukhbaatar',
  khorooOrBag: null,
  addressLine: 'Peace Avenue',
  additionalDetails: null,
  recipientName: 'Test Person',
  recipientPhone: '+97699110000',
  defaultAddress: true,
  createdAt: '2026-07-17T10:00:00Z',
  updatedAt: '2026-07-17T10:00:00Z',
};

const auth: AuthContextValue = {
  state: { status: 'authenticated', user: authenticatedUser },
  hydrationError: false,
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  refresh: vi.fn(),
  replaceUser: vi.fn(),
};

function renderCheckout(clearCart = vi.fn()) {
  const cart: CartContextValue = {
    items: [{ productSlug: 'test-product', quantity: 1 }],
    itemCount: 1,
    quote,
    quoteStatus: 'ready',
    quoteError: null,
    addItem: vi.fn(),
    removeItem: vi.fn(),
    setQuantity: vi.fn(),
    clearCart,
    refreshQuote: vi.fn().mockResolvedValue(quote),
  };
  render(
    <AuthContext.Provider value={auth}>
      <CartContext.Provider value={cart}>
        <MemoryRouter initialEntries={['/checkout']}>
          <Routes>
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/checkout/success/:orderNumber" element={<span>success route</span>} />
          </Routes>
        </MemoryRouter>
      </CartContext.Provider>
    </AuthContext.Provider>
  );
  return clearCart;
}

function orderResponse() {
  return {
    orderNumber: 'HL-20260717-ABCDEF123456',
    placedAt: '2026-07-17T10:00:00Z',
    orderStatus: 'PENDING_CONFIRMATION',
    paymentStatus: 'UNPAID',
    paymentMethod: 'CASH_ON_DELIVERY',
    deliveryMethod: 'STANDARD_DELIVERY',
    currency: 'MNT',
    regularSubtotal: 10000,
    discountTotal: 1000,
    effectiveSubtotal: 9000,
    shippingTotal: 5000,
    grandTotal: 14000,
    customerNote: null,
    items: [],
    address,
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
  document.cookie = 'XSRF-TOKEN=; Max-Age=0; path=/';
});

describe('CheckoutPage', () => {
  it('selects the default address, prevents double submission, clears after success, and navigates', async () => {
    document.cookie = 'XSRF-TOKEN=token; path=/';
    const fetchMock = vi.fn().mockImplementation((url: string, init?: RequestInit) => {
      if (url.includes('/account/addresses'))
        return Promise.resolve(new Response(JSON.stringify({ data: [address] }), { status: 200 }));
      if (url.endsWith('/api/v1/orders') && init?.method === 'POST')
        return Promise.resolve(
          new Response(JSON.stringify({ data: orderResponse() }), { status: 201 })
        );
      throw new Error(`Unexpected request: ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);
    const clearCart = renderCheckout();

    expect(await screen.findByRole('radio', { name: /Home/ })).toBeChecked();
    fireEvent.click(screen.getByRole('checkbox', { name: /мэдээлэл болон хүргэлтийн хаяг зөв/ }));
    const placeButton = screen.getByRole('button', { name: 'Захиалга хийх' });
    fireEvent.click(placeButton);
    fireEvent.click(placeButton);
    expect(await screen.findByText('success route')).toBeInTheDocument();
    expect(clearCart).toHaveBeenCalledTimes(1);
    expect(
      fetchMock.mock.calls.filter(
        ([url, init]) =>
          String(url).endsWith('/api/v1/orders') && (init as RequestInit)?.method === 'POST'
      )
    ).toHaveLength(1);
  });

  it('keeps the cart when order placement fails', async () => {
    document.cookie = 'XSRF-TOKEN=token; path=/';
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string) => {
        if (url.includes('/account/addresses'))
          return Promise.resolve(
            new Response(JSON.stringify({ data: [address] }), { status: 200 })
          );
        return Promise.resolve(
          new Response(JSON.stringify({ error: { code: 'QUANTITY_EXCEEDS_STOCK' } }), {
            status: 409,
          })
        );
      })
    );
    const clearCart = renderCheckout();
    await screen.findByRole('radio', { name: /Home/ });
    fireEvent.click(screen.getByRole('checkbox', { name: /мэдээлэл болон хүргэлтийн хаяг зөв/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Захиалга хийх' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('үлдэгдлээс их');
    expect(clearCart).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Захиалга хийх' })).toBeEnabled()
    );
  });
});
