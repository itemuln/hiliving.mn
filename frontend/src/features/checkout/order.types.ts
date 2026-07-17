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
  readonly deliveryMethod: string;
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
