import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { jsonResponse, productPageEnvelope, productSummaryDto } from '../../test/catalogFixtures';
import { ProductSection } from './ProductSection';

afterEach(() => {
  vi.unstubAllGlobals();
});

function renderSection() {
  return render(
    <MemoryRouter>
      <ProductSection />
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
