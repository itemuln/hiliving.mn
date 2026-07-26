import { apiRequest } from './accountApi';
import type { CartItem, CartQuote } from '../features/cart/cart.types';
import type { DeliveryMethod } from '../features/checkout/delivery';
import type {
  CheckoutResult,
  CustomerOrder,
  OrderSummary,
  Page,
  PaymentInstructions,
} from '../features/checkout/order.types';

export const quoteCart = (
  items: readonly CartItem[],
  deliveryMethod: DeliveryMethod = 'STANDARD_DELIVERY'
) =>
  apiRequest<CartQuote>('/api/v1/cart/quote', {
    method: 'POST',
    body: JSON.stringify({ items, deliveryMethod }),
  });

export interface PlaceOrderInput {
  readonly items: readonly CartItem[];
  readonly addressId: number | null;
  readonly deliveryMethod: DeliveryMethod;
  readonly customerNote?: string;
}

export const placeOrder = (input: PlaceOrderInput, idempotencyKey: string) =>
  apiRequest<CheckoutResult>('/api/v1/orders', {
    method: 'POST',
    headers: { 'Idempotency-Key': idempotencyKey },
    body: JSON.stringify({
      ...input,
      paymentMethod: 'QPAY',
    }),
  });

export const getOrder = (orderNumber: string) =>
  apiRequest<CustomerOrder>(`/api/v1/orders/${encodeURIComponent(orderNumber)}`);

export const listOrders = (page = 0, size = 20) =>
  apiRequest<Page<OrderSummary>>(`/api/v1/orders?page=${page}&size=${size}`);

export const getPayment = (orderNumber: string) =>
  apiRequest<PaymentInstructions>(`/api/v1/orders/${encodeURIComponent(orderNumber)}/payment`);

export const checkPayment = (orderNumber: string) =>
  apiRequest<PaymentInstructions>(
    `/api/v1/orders/${encodeURIComponent(orderNumber)}/payment/check`,
    { method: 'POST' }
  );
