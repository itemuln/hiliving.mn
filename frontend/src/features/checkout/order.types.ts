import type { DeliveryMethod } from './delivery';

export interface OrderItem {
  readonly productSlug: string;
  readonly sku: string;
  readonly productName: string;
  readonly primaryImageUrl: string | null;
  readonly unitRegularPrice: number;
  readonly unitEffectivePrice: number;
  readonly discountPerUnit: number;
  readonly quantity: number;
  readonly lineTotal: number;
}

export interface OrderAddress {
  readonly label: string;
  readonly cityOrProvince: string;
  readonly districtOrSoum: string;
  readonly khorooOrBag: string | null;
  readonly addressLine: string;
  readonly additionalDetails: string | null;
  readonly recipientName: string;
  readonly recipientPhone: string;
}

export interface CustomerOrder {
  readonly orderNumber: string;
  readonly placedAt: string;
  readonly orderStatus: string;
  readonly paymentStatus: string;
  readonly paymentMethod: string;
  readonly deliveryMethod: DeliveryMethod;
  readonly currency: 'MNT';
  readonly regularSubtotal: number;
  readonly discountTotal: number;
  readonly effectiveSubtotal: number;
  readonly shippingTotal: number;
  readonly grandTotal: number;
  readonly customerNote: string | null;
  readonly items: readonly OrderItem[];
  readonly address: OrderAddress;
}

export interface OrderSummary {
  readonly orderNumber: string;
  readonly placedAt: string;
  readonly orderStatus: string;
  readonly paymentStatus: string;
  readonly paymentMethod: string;
  readonly grandTotal: number;
  readonly currency: 'MNT';
  readonly itemCount: number;
}

export interface Page<T> {
  readonly items: readonly T[];
  readonly page: number;
  readonly size: number;
  readonly totalElements: number;
  readonly totalPages: number;
  readonly first: boolean;
  readonly last: boolean;
}

export interface PaymentDeeplink {
  readonly name: string;
  readonly description: string | null;
  readonly logoUrl: string | null;
  readonly link: string;
}

export interface PaymentInstructions {
  readonly provider: 'QPAY';
  readonly status: string;
  readonly amount: number;
  readonly currency: 'MNT';
  readonly qrText: string | null;
  readonly qrImageDataUrl: string | null;
  readonly shortUrl: string | null;
  readonly expiresAt: string;
  readonly paidAt: string | null;
  readonly deeplinks: readonly PaymentDeeplink[];
}

export interface CheckoutResult {
  readonly order: CustomerOrder;
  readonly payment: PaymentInstructions;
}
