import { apiRequest } from './accountApi';
import type { CartItem, CartQuote } from '../features/cart/cart.types';
import type { CustomerOrder } from '../features/checkout/order.types';

export const quoteCart = (items: readonly CartItem[]) =>
  apiRequest<CartQuote>('/api/v1/cart/quote', {
    method: 'POST',
    body: JSON.stringify({ items }),
  });

export interface PlaceOrderInput {
  readonly items: readonly CartItem[];
  readonly addressId: number;
  readonly customerNote?: string;
}

export const placeOrder = (input: PlaceOrderInput, idempotencyKey: string) =>
  apiRequest<CustomerOrder>('/api/v1/orders', {
    method: 'POST',
    headers: { 'Idempotency-Key': idempotencyKey },
    body: JSON.stringify({
      ...input,
      deliveryMethod: 'STANDARD_DELIVERY',
      paymentMethod: 'CASH_ON_DELIVERY',
    }),
  });

export const getOrder = (orderNumber: string) =>
  apiRequest<CustomerOrder>(`/api/v1/orders/${encodeURIComponent(orderNumber)}`);
