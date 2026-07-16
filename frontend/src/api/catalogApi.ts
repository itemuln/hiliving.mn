import { environment } from '../config/environment'
import type {
  CatalogBrand,
  CatalogCategory,
  CatalogPage,
  CatalogProduct,
  CatalogProductDetail,
  CatalogProductImage,
  ProductQuery,
} from '../features/catalog/catalog.types'
import type {
  ApiErrorResponseDto,
  ApiResponse,
  BrandDto,
  CategoryDto,
  PagedResponseDto,
  ProductDetailDto,
  ProductSummaryDto,
} from './catalogApi.types'

export type CatalogApiErrorKind = 'aborted' | 'invalid-response' | 'not-found' | 'unavailable' | 'validation' | 'server'

const categoryIcons: Readonly<Record<string, string>> = {
  health: '/health.png',
  skincare: '/skincare.png',
  electronics: '/air.png',
  household: '/tovel.png',
  kitchen: '/pan.png',
  daily: '/brush.png',
  clothes: '/shoe.png',
  food: '/ingredient.png',
  others: '/book.png',
}

export class CatalogApiError extends Error {
  readonly kind: CatalogApiErrorKind
  readonly status: number | null
  readonly code: string | null

  constructor(kind: CatalogApiErrorKind, options: { status?: number; code?: string; cause?: unknown } = {}) {
    super(safeErrorMessage(kind))
    this.name = 'CatalogApiError'
    this.kind = kind
    this.status = options.status ?? null
    this.code = options.code ?? null
  }
}

function safeErrorMessage(kind: CatalogApiErrorKind) {
  if (kind === 'not-found') return 'The requested catalog item was not found.'
  if (kind === 'validation') return 'The catalog request was not valid.'
  if (kind === 'unavailable') return 'The catalog service is currently unavailable.'
  if (kind === 'aborted') return 'The catalog request was cancelled.'
  return 'Catalog data could not be loaded.'
}

function apiUrl(path: string) {
  return `${environment.apiBaseUrl}${path}`
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

async function parseError(response: Response) {
  try {
    const payload: unknown = await response.json()
    if (isRecord(payload) && isRecord(payload.error) && typeof payload.error.code === 'string') {
      return (payload as unknown as ApiErrorResponseDto).error.code
    }
  } catch {
    // The status code remains authoritative when an error body is absent or malformed.
  }
  return null
}

async function request<T>(path: string, signal?: AbortSignal): Promise<T> {
  let response: Response
  try {
    response = await fetch(apiUrl(path), {
      headers: { Accept: 'application/json' },
      signal,
    })
  } catch (error) {
    if (signal?.aborted || (error instanceof DOMException && error.name === 'AbortError')) {
      throw new CatalogApiError('aborted', { cause: error })
    }
    throw new CatalogApiError('unavailable', { cause: error })
  }

  if (!response.ok) {
    const code = await parseError(response)
    if (response.status === 404) throw new CatalogApiError('not-found', { status: 404, code: code ?? undefined })
    if (response.status === 400) throw new CatalogApiError('validation', { status: 400, code: code ?? undefined })
    throw new CatalogApiError('server', { status: response.status, code: code ?? undefined })
  }

  try {
    const payload: unknown = await response.json()
    if (!isRecord(payload) || !('data' in payload)) throw new Error('Missing data envelope')
    return (payload as unknown as ApiResponse<T>).data
  } catch (error) {
    throw new CatalogApiError('invalid-response', { status: response.status, cause: error })
  }
}

function mapCategory(category: CategoryDto): CatalogCategory {
  return {
    ...category,
    iconUrl: categoryIcons[category.slug] ?? '/icons/grid.svg',
  }
}

function mapBrand(brand: BrandDto): CatalogBrand {
  return { ...brand }
}

function mapProduct(product: ProductSummaryDto): CatalogProduct {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    shortDescription: product.shortDescription,
    listPrice: product.price,
    currentPrice: product.discountPrice ?? product.price,
    imageUrl: product.primaryImageUrl ?? '/product-cleaner.svg',
    category: product.category,
    brand: product.brand,
    featured: product.featured,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  }
}

function mapProductImage(image: ProductDetailDto['images'][number]): CatalogProductImage {
  return { ...image }
}

function mapProductDetail(product: ProductDetailDto): CatalogProductDetail {
  const images = product.images.map(mapProductImage)
  const primaryImage = images.find((image) => image.primaryImage) ?? images[0]
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    shortDescription: product.shortDescription,
    description: product.description,
    listPrice: product.price,
    currentPrice: product.discountPrice ?? product.price,
    imageUrl: primaryImage?.imageUrl ?? '/product-cleaner.svg',
    category: product.category,
    brand: product.brand,
    featured: product.featured,
    images,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  }
}

export function serializeProductQuery(query: ProductQuery) {
  const parameters = new URLSearchParams()
  if (query.page !== undefined) parameters.set('page', String(query.page))
  if (query.size !== undefined) parameters.set('size', String(query.size))
  if (query.category?.trim()) parameters.set('category', query.category.trim())
  if (query.brand?.trim()) parameters.set('brand', query.brand.trim())
  if (query.search?.trim()) parameters.set('search', query.search.trim())
  if (query.featured !== undefined) parameters.set('featured', String(query.featured))
  if (query.sort) parameters.set('sort', query.sort)
  return parameters.toString()
}

export async function fetchCategories(signal?: AbortSignal) {
  const categories = await request<readonly CategoryDto[]>('/api/v1/categories', signal)
  return categories.map(mapCategory)
}

export async function fetchBrands(signal?: AbortSignal) {
  const brands = await request<readonly BrandDto[]>('/api/v1/brands', signal)
  return brands.map(mapBrand)
}

export async function fetchProducts(query: ProductQuery = {}, signal?: AbortSignal): Promise<CatalogPage<CatalogProduct>> {
  const parameters = serializeProductQuery(query)
  const page = await request<PagedResponseDto<ProductSummaryDto>>(
    `/api/v1/products${parameters ? `?${parameters}` : ''}`,
    signal,
  )
  return { ...page, items: page.items.map(mapProduct) }
}

export async function fetchProductBySlug(slug: string, signal?: AbortSignal) {
  const product = await request<ProductDetailDto>(`/api/v1/products/${encodeURIComponent(slug)}`, signal)
  return mapProductDetail(product)
}
