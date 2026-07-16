export interface ApiResponse<T> {
  readonly data: T;
}

export interface ApiFieldErrorDto {
  readonly field: string;
  readonly message: string;
}

export interface ApiErrorDto {
  readonly code: string;
  readonly message: string;
  readonly path: string;
  readonly timestamp: string;
  readonly fieldErrors: readonly ApiFieldErrorDto[];
}

export interface ApiErrorResponseDto {
  readonly error: ApiErrorDto;
}

export interface CategoryDto {
  readonly id: number;
  readonly name: string;
  readonly slug: string;
  readonly parentSlug: string | null;
  readonly displayOrder: number;
}

export interface BrandDto {
  readonly id: number;
  readonly name: string;
  readonly slug: string;
  readonly logoUrl: string | null;
}

export interface CatalogReferenceDto {
  readonly id: number;
  readonly name: string;
  readonly slug: string;
}

export interface ProductSummaryDto {
  readonly id: number;
  readonly name: string;
  readonly slug: string;
  readonly shortDescription: string | null;
  readonly price: number;
  readonly discountPrice: number | null;
  readonly category: CatalogReferenceDto;
  readonly brand: CatalogReferenceDto | null;
  readonly featured: boolean;
  readonly primaryImageUrl: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface ProductImageDto {
  readonly id: number;
  readonly imageUrl: string;
  readonly altText: string | null;
  readonly displayOrder: number;
  readonly primaryImage: boolean;
}

export interface ProductDetailDto extends Omit<ProductSummaryDto, 'primaryImageUrl'> {
  readonly description: string | null;
  readonly images: readonly ProductImageDto[];
}

export interface PagedResponseDto<T> {
  readonly items: readonly T[];
  readonly page: number;
  readonly size: number;
  readonly totalElements: number;
  readonly totalPages: number;
  readonly first: boolean;
  readonly last: boolean;
}
