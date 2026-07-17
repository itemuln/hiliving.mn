import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AccountApiError } from '../api/accountApi';
import { CartContext, type CartContextValue } from '../features/cart/CartContext';
import type { CartQuote } from '../features/cart/cart.types';
import { CartPage } from './CartPage';

const quote: CartQuote = {
  items: [
    {
      productId: 1,
      productSlug: 'test-product',
      productName: 'Test product',
      sku: 'TEST-1',
      primaryImageUrl: null,
      requestedQuantity: 2,
      availableQuantity: 3,
      unitRegularPrice: 10000,
      unitCatalogPrice: 9000,
      unitEffectivePrice: 8100,
      membershipDiscountPercentage: 10,
      discountAmount: 1900,
      lineSubtotal: 16200,
      membershipDiscountEligible: true,
      inventoryStatus: 'LOW_STOCK',
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

function cartValue(overrides: Partial<CartContextValue> = {}): CartContextValue {
  return {
    items: [{ productSlug: 'test-product', quantity: 2 }],
    itemCount: 2,
    quote,
    quoteStatus: 'ready',
    quoteError: null,
    addItem: vi.fn(),
    removeItem: vi.fn(),
    setQuantity: vi.fn(),
    clearCart: vi.fn(),
    refreshQuote: vi.fn().mockResolvedValue(quote),
    ...overrides,
  };
}

function renderCart(value: CartContextValue) {
  render(
    <CartContext.Provider value={value}>
      <MemoryRouter initialEntries={['/cart']}>
        <CartPage />
      </MemoryRouter>
    </CartContext.Provider>
  );
}

describe('CartPage', () => {
  it('renders authoritative membership totals and exposes keyboard-operable quantity and removal controls', () => {
    const value = cartValue();
    renderCart(value);

    expect(screen.getByText('Гишүүнчлэл −10%')).toBeInTheDocument();
    expect(screen.getByText('Гишүүнчлэлийн хөнгөлөлт')).toBeInTheDocument();
    expect(screen.getByText('21,200₮')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Test product тоо нэмэх' }));
    expect(value.setQuantity).toHaveBeenCalledWith('test-product', 3, 3);
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Test product тоо ширхэг' }), {
      target: { value: '1' },
    });
    expect(value.setQuantity).toHaveBeenCalledWith('test-product', 1, 3);
    fireEvent.click(screen.getByRole('button', { name: 'Test product сагснаас хасах' }));
    expect(value.removeItem).toHaveBeenCalledWith('test-product');
  });

  it('shows an actionable stock-change error, retries, and lets the stale line be removed', () => {
    const value = cartValue({
      quote: null,
      quoteStatus: 'error',
      quoteError: new AccountApiError(409, 'QUANTITY_EXCEEDS_STOCK'),
    });
    renderCart(value);

    expect(screen.getByRole('alert')).toHaveTextContent('үлдэгдлээс их');
    fireEvent.click(screen.getByRole('button', { name: 'Дахин шалгах' }));
    expect(value.refreshQuote).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: 'test-product хасах' }));
    expect(value.removeItem).toHaveBeenCalledWith('test-product');
  });
});
