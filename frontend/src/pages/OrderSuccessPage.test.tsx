import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { OrderSuccessPage } from './OrderSuccessPage';

const order = {
  orderNumber: 'HL-20260717-ABCDEF123456',
  placedAt: '2026-07-17T10:00:00Z',
  orderStatus: 'PENDING_CONFIRMATION',
  paymentStatus: 'UNPAID',
  paymentMethod: 'CASH_ON_DELIVERY',
  deliveryMethod: 'STANDARD_DELIVERY',
  currency: 'MNT',
  regularSubtotal: 20000,
  discountTotal: 3800,
  effectiveSubtotal: 16200,
  shippingTotal: 5000,
  grandTotal: 21200,
  customerNote: 'Call on arrival',
  items: [
    {
      productSlug: 'test-product',
      sku: 'TEST-1',
      productName: 'Test product',
      primaryImageUrl: null,
      unitRegularPrice: 10000,
      unitEffectivePrice: 8100,
      discountPerUnit: 1900,
      quantity: 2,
      lineTotal: 16200,
    },
  ],
  address: {
    label: 'Home',
    cityOrProvince: 'Ulaanbaatar',
    districtOrSoum: 'Sukhbaatar',
    khorooOrBag: null,
    addressLine: 'Peace Avenue',
    additionalDetails: null,
    recipientName: 'Test Person',
    recipientPhone: '+97699110000',
  },
};

function renderPage() {
  render(
    <MemoryRouter initialEntries={[`/checkout/success/${order.orderNumber}`]}>
      <Routes>
        <Route path="/checkout/success/:orderNumber" element={<OrderSuccessPage />} />
      </Routes>
    </MemoryRouter>
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('OrderSuccessPage', () => {
  it('loads and renders the owned order snapshot and unpaid state', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: order }), { status: 200 }))
    );
    renderPage();

    expect(await screen.findByText(order.orderNumber)).toBeInTheDocument();
    expect(screen.getByText('PENDING_CONFIRMATION')).toBeInTheDocument();
    expect(screen.getByText('UNPAID')).toBeInTheDocument();
    expect(screen.getByText('Test product')).toBeInTheDocument();
    expect(screen.getByText(/Test Person/)).toBeInTheDocument();
    expect(screen.getByText('21,200₮')).toBeInTheDocument();
  });

  it('shows a safe not-found state when the order is unavailable to the customer', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify({ error: { code: 'ORDER_NOT_FOUND' } }), { status: 404 })
        )
    );
    renderPage();

    expect(await screen.findByRole('alert')).toHaveTextContent('Захиалгын мэдээлэл олдсонгүй');
    expect(screen.queryByText('ORDER_NOT_FOUND')).not.toBeInTheDocument();
  });
});
