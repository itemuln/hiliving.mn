import type {
  ApiResponse,
  PagedResponseDto,
  ProductDetailDto,
  ProductSummaryDto,
} from '../api/catalogApi.types';

export const productSummaryDto: ProductSummaryDto = {
  id: 1,
  name: 'Plant-Based Household Cleaner',
  slug: 'plant-based-household-cleaner',
  shortDescription: 'A concentrated cleaner for everyday household surfaces.',
  price: 65000,
  discountPrice: 50000,
  category: { id: 2, name: 'Cleaning', slug: 'cleaning' },
  brand: { id: 2, name: 'Tez Blanc', slug: 'tez-blanc' },
  featured: true,
  primaryImageUrl: '/product-cleaner.svg',
  createdAt: '2026-07-15T10:05:26Z',
  updatedAt: '2026-07-15T10:05:26Z',
};

export const productDetailDto: ProductDetailDto = {
  ...productSummaryDto,
  description: 'Local development sample used to verify catalog reads and filtering.',
  sku: 'PLANT-001',
  effectiveCustomerPrice: 45000,
  membershipDiscountPercentage: 10,
  membershipSavings: 5000,
  membershipDiscountEligible: true,
  availableQuantity: 8,
  inventoryStatus: 'IN_STOCK',
  published: true,
  primaryImageUrl: '/product-cleaner.svg',
  images: [
    {
      id: 1,
      imageUrl: '/product-cleaner.svg',
      altText: 'Plant-based household cleaner',
      displayOrder: 0,
      primaryImage: true,
    },
  ],
  relatedProducts: [],
};

export function productPageEnvelope(
  items: readonly ProductSummaryDto[]
): ApiResponse<PagedResponseDto<ProductSummaryDto>> {
  return {
    data: {
      items,
      page: 0,
      size: 10,
      totalElements: items.length,
      totalPages: items.length > 0 ? 1 : 0,
      first: true,
      last: true,
    },
  };
}

export function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
