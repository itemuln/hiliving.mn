import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthContext, type AuthContextValue } from '../auth/AuthContext';
import { CartProvider } from './CartProvider';
import { useCart } from './useCart';

const anonymousAuth: AuthContextValue = {
  state: { status: 'anonymous', user: null },
  hydrationError: false,
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  refresh: vi.fn(),
  replaceUser: vi.fn(),
};

const quote = {
  items: [
    {
      productId: 1,
      productSlug: 'test-product',
      productName: 'Test product',
      sku: 'TEST-1',
      primaryImageUrl: null,
      requestedQuantity: 2,
      availableQuantity: 5,
      unitRegularPrice: 10000,
      unitCatalogPrice: 9000,
      unitEffectivePrice: 8100,
      membershipDiscountPercentage: 10,
      discountAmount: 1900,
      lineSubtotal: 16200,
      membershipDiscountEligible: true,
      inventoryStatus: 'IN_STOCK',
      warnings: [],
    },
  ],
  regularSubtotal: 20000,
  catalogDiscountTotal: 2000,
  membershipDiscountTotal: 1800,
  discountTotal: 3800,
  effectiveSubtotal: 16200,
  shippingAmount: 5000,
  grandTotal: 21200,
  currency: 'MNT',
  valid: true,
};

function Consumer() {
  const cart = useCart();
  return (
    <div>
      <span data-testid="count">{cart.itemCount}</span>
      <span data-testid="total">{cart.quote?.grandTotal ?? 0}</span>
      <button onClick={() => cart.addItem('test-product')}>add</button>
      <button onClick={() => cart.removeItem('test-product')}>remove</button>
    </div>
  );
}

function renderCart() {
  return render(
    <AuthContext.Provider value={anonymousAuth}>
      <CartProvider>
        <Consumer />
      </CartProvider>
    </AuthContext.Provider>
  );
}

beforeEach(() => {
  localStorage.clear();
  document.cookie = 'XSRF-TOKEN=test-token; path=/';
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: quote }), { status: 200 }))
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('CartProvider', () => {
  it('recovers from malformed storage and merges duplicate stored products', async () => {
    localStorage.setItem(
      'hiliving.cart.v1',
      JSON.stringify({
        version: 1,
        items: [
          { productSlug: 'test-product', quantity: 1 },
          { productSlug: 'bad slug', quantity: 3 },
          { productSlug: 'test-product', quantity: 2 },
          { productSlug: 'another', quantity: -1 },
        ],
      })
    );
    renderCart();
    expect(screen.getByTestId('count')).toHaveTextContent('3');
    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem('hiliving.cart.v1') ?? '{}');
      expect(stored.items).toEqual([{ productSlug: 'test-product', quantity: 3 }]);
    });
  });

  it('merges repeated additions, persists minimal data, removes items, and renders a backend quote', async () => {
    renderCart();
    fireEvent.click(screen.getByRole('button', { name: 'add' }));
    fireEvent.click(screen.getByRole('button', { name: 'add' }));
    expect(screen.getByTestId('count')).toHaveTextContent('2');
    await waitFor(() => expect(screen.getByTestId('total')).toHaveTextContent('21200'));
    const stored = JSON.parse(localStorage.getItem('hiliving.cart.v1') ?? '{}');
    expect(stored).toEqual({ version: 1, items: [{ productSlug: 'test-product', quantity: 2 }] });
    expect(stored.items[0].unitEffectivePrice).toBeUndefined();
    fireEvent.click(screen.getByRole('button', { name: 'remove' }));
    expect(screen.getByTestId('count')).toHaveTextContent('0');
  });
});
