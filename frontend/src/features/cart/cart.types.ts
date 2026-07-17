export interface CartItem {
  readonly productSlug: string;
  readonly quantity: number;
}

export interface CartLine {
  readonly productId: number;
  readonly productSlug: string;
  readonly productName: string;
  readonly sku: string;
  readonly primaryImageUrl: string | null;
  readonly requestedQuantity: number;
  readonly availableQuantity: number;
  readonly unitRegularPrice: number;
  readonly unitCatalogPrice: number;
  readonly unitEffectivePrice: number;
  readonly membershipDiscountPercentage: number;
  readonly discountAmount: number;
  readonly lineSubtotal: number;
  readonly membershipDiscountEligible: boolean;
  readonly inventoryStatus: 'IN_STOCK' | 'LOW_STOCK';
  readonly warnings: readonly string[];
}

export interface CartQuote {
  readonly items: readonly CartLine[];
  readonly regularSubtotal: number;
  readonly catalogDiscountTotal: number;
  readonly membershipDiscountTotal: number;
  readonly discountTotal: number;
  readonly effectiveSubtotal: number;
  readonly shippingAmount: number;
  readonly grandTotal: number;
  readonly currency: 'MNT';
  readonly valid: boolean;
}
