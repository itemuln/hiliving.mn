import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CartContext, type CartContextValue } from '../../features/cart/CartContext';
import { jsonResponse, productPageEnvelope, productSummaryDto } from '../../test/catalogFixtures';
import { ProductSection } from './ProductSection';

const addItem = vi.fn();
const cart: CartContextValue = {
  items: [],
  itemCount: 0,
  quote: null,
  quoteStatus: 'idle',
  quoteError: null,
  addItem,
  removeItem: vi.fn(),
  setQuantity: vi.fn(),
  clearCart: vi.fn(),
  refreshQuote: vi.fn().mockResolvedValue(null),
};

afterEach(() => {
  vi.unstubAllGlobals();
  addItem.mockClear();
});

function renderSection() {
  return render(
    <MemoryRouter>
      <CartContext.Provider value={cart}>
        <ProductSection />
      </CartContext.Provider>
    </MemoryRouter>
  );
}

describe('ProductSection', () => {
  it('shows a stable loading skeleton while the product request is pending', () => {
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise(() => undefined)));

    renderSection();

    expect(screen.getByRole('status', { name: 'Бүтээгдэхүүн ачаалж байна' })).toBeInTheDocument();
  });

  it('renders products returned by the catalog API', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse(productPageEnvelope([productSummaryDto])))
    );

    renderSection();

    expect(await screen.findAllByText('Plant-Based Household Cleaner')).toHaveLength(2);
    expect(
      screen.getAllByRole('link', { name: /Plant-Based Household Cleaner/ })[0]
    ).toHaveAttribute('href', '/products/plant-based-household-cleaner');
    fireEvent.click(
      screen.getAllByRole('button', {
        name: 'Plant-Based Household Cleaner бүтээгдэхүүнийг сагсанд нэмэх',
      })[0]
    );
    expect(addItem).toHaveBeenCalledWith('plant-based-household-cleaner');
  });

  it('renders an explicit empty state for an empty successful page', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(productPageEnvelope([]))));

    renderSection();

    expect(
      await screen.findByText('Онцлох бүтээгдэхүүн одоогоор байхгүй байна')
    ).toBeInTheDocument();
  });

  it('shows a safe unavailable state and retries without exposing internal errors', async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('SQL host backend.internal refused connection'))
      .mockResolvedValueOnce(jsonResponse(productPageEnvelope([productSummaryDto])));
    vi.stubGlobal('fetch', fetchMock);

    renderSection();

    expect(await screen.findByText('Мэдээлэл ачаалж чадсангүй')).toBeInTheDocument();
    expect(screen.queryByText(/SQL host/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Дахин оролдох' }));
    expect(await screen.findAllByText('Plant-Based Household Cleaner')).toHaveLength(2);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
