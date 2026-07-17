import { afterEach, describe, expect, it, vi } from 'vitest';
import { getOrder, placeOrder, quoteCart } from './commerceApi';

const order = {
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
  address: {
    label: 'Home',
    cityOrProvince: 'Ulaanbaatar',
    districtOrSoum: 'Sukhbaatar',
    khorooOrBag: null,
    addressLine: 'Peace Avenue',
    additionalDetails: null,
    recipientName: 'Buyer',
    recipientPhone: '+97699110000',
  },
};

afterEach(() => {
  vi.unstubAllGlobals();
  document.cookie = 'XSRF-TOKEN=; Max-Age=0; path=/';
});

describe('commerceApi', () => {
  it('sends only product identity and quantity when requesting an authoritative quote', async () => {
    document.cookie = 'XSRF-TOKEN=token; path=/';
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ data: { items: [], grandTotal: 0 } }), { status: 200 })
      );
    vi.stubGlobal('fetch', fetchMock);
    await quoteCart([{ productSlug: 'test-product', quantity: 2 }]);
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.credentials).toBe('include');
    expect(init.headers).toMatchObject({ 'X-XSRF-TOKEN': 'token' });
    expect(JSON.parse(String(init.body))).toEqual({
      items: [{ productSlug: 'test-product', quantity: 2 }],
    });
  });

  it('places an order with a stable idempotency header and no client-authoritative money or status', async () => {
    document.cookie = 'XSRF-TOKEN=token; path=/';
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ data: order }), { status: 201 }));
    vi.stubGlobal('fetch', fetchMock);
    const result = await placeOrder(
      { items: [{ productSlug: 'test-product', quantity: 1 }], addressId: 7 },
      '123e4567-e89b-42d3-a456-426614174000'
    );
    expect(result.paymentStatus).toBe('UNPAID');
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.headers).toMatchObject({
      'Idempotency-Key': '123e4567-e89b-42d3-a456-426614174000',
    });
    const body = JSON.parse(String(init.body));
    expect(body).toEqual({
      items: [{ productSlug: 'test-product', quantity: 1 }],
      addressId: 7,
      deliveryMethod: 'STANDARD_DELIVERY',
      paymentMethod: 'CASH_ON_DELIVERY',
    });
    expect(body.grandTotal).toBeUndefined();
    expect(body.paymentStatus).toBeUndefined();
    expect(body.orderStatus).toBeUndefined();
  });

  it('loads an authenticated order by its public order number', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ data: order }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    expect((await getOrder(order.orderNumber)).orderNumber).toBe(order.orderNumber);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining(`/api/v1/orders/${order.orderNumber}`),
      expect.objectContaining({ credentials: 'include' })
    );
  });
});
