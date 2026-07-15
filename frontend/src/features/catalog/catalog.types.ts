export type ProductSort = 'newest' | 'price_asc' | 'price_desc' | 'name_asc'

export interface CatalogCategory {
  readonly id: number
  readonly name: string
  readonly slug: string
  readonly parentSlug: string | null
  readonly displayOrder: number
  readonly iconUrl: string
}

export interface CatalogBrand {
  readonly id: number
  readonly name: string
  readonly slug: string
  readonly logoUrl: string | null
}

export interface CatalogReference {
  readonly id: number
  readonly name: string
  readonly slug: string
}

export interface CatalogProduct {
  readonly id: number
  readonly slug: string
  readonly name: string
  readonly shortDescription: string | null
  readonly listPrice: number
  readonly currentPrice: number
  readonly imageUrl: string
  readonly category: CatalogReference
  readonly brand: CatalogReference | null
  readonly featured: boolean
  readonly createdAt: string
  readonly updatedAt: string
}

export interface CatalogProductImage {
  readonly id: number
  readonly imageUrl: string
  readonly altText: string | null
  readonly displayOrder: number
  readonly primaryImage: boolean
}

export interface CatalogProductDetail extends CatalogProduct {
  readonly description: string | null
  readonly images: readonly CatalogProductImage[]
}

export interface CatalogPage<T> {
  readonly items: readonly T[]
  readonly page: number
  readonly size: number
  readonly totalElements: number
  readonly totalPages: number
  readonly first: boolean
  readonly last: boolean
}

export interface ProductQuery {
  readonly page?: number
  readonly size?: number
  readonly category?: string
  readonly brand?: string
  readonly search?: string
  readonly featured?: boolean
  readonly sort?: ProductSort
}
