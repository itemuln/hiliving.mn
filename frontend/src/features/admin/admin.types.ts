import type { AuthenticatedUser } from '../auth/auth.types';

export interface DashboardCounts {
  totalProducts: number;
  activeProducts: number;
  draftProducts: number;
  archivedProducts: number;
  categories: number;
  brands: number;
  users: number;
  activeBanners: number;
  publishedNews: number;
}
export interface Category {
  id: number;
  name: string;
  slug: string;
  parentId: number | null;
  parentName: string | null;
  description: string | null;
  sortOrder: number;
  active: boolean;
  childCount: number;
  productCount: number;
}
export type CategoryInput = Omit<Category, 'id' | 'parentName' | 'childCount' | 'productCount'>;
export interface Brand {
  id: number;
  name: string;
  slug: string;
  logoUrl: string | null;
  description: string | null;
  sortOrder: number;
  active: boolean;
  productCount: number;
}
export type BrandInput = Omit<Brand, 'id' | 'sortOrder' | 'productCount'>;
export interface Reference {
  id: number;
  name: string;
  slug: string;
}
export interface ProductImage {
  id: number | null;
  imageUrl: string;
  altText: string | null;
  displayOrder: number;
  primaryImage: boolean;
}
export type ProductLifecycle = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
export type InventoryState = 'OUT_OF_STOCK' | 'LOW_STOCK' | 'IN_STOCK';
export interface Product {
  id: number;
  name: string;
  slug: string;
  productCode: string;
  shortDescription: string | null;
  description: string | null;
  basePrice: number;
  discountPrice: number | null;
  category: Reference;
  brand: Reference | null;
  lifecycle: ProductLifecycle;
  stockQuantity: number;
  lowStockThreshold: number;
  inventoryState: InventoryState;
  featured: boolean;
  newProduct: boolean;
  active: boolean;
  membershipDiscountEligible: boolean;
  images: ProductImage[];
  createdAt: string;
  updatedAt: string;
}
export interface ProductInput {
  name: string;
  description: string;
  basePrice: number;
  discountPrice: number | null;
  categoryId: number;
  brandId: number | null;
  lifecycle: ProductLifecycle;
  stockQuantity: number;
  lowStockThreshold: number;
  featured: boolean;
  newProduct: boolean;
  active: boolean;
  membershipDiscountEligible: boolean;
  images: Array<Omit<ProductImage, 'id' | 'displayOrder'> & { sortOrder: number }>;
}
export interface Page<T> {
  items: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}
export interface Banner {
  id: number;
  title: string;
  subtitle: string | null;
  imageUrl: string;
  mobileImageUrl: string | null;
  linkUrl: string | null;
  linkLabel: string | null;
  sortOrder: number;
  active: boolean;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
  updatedAt: string;
}
export type BannerInput = Omit<
  Banner,
  'id' | 'linkUrl' | 'linkLabel' | 'startsAt' | 'endsAt' | 'createdAt' | 'updatedAt'
>;
export interface News {
  id: number;
  title: string;
  slug: string;
  summary: string;
  content: string;
  thumbnailUrl: string | null;
  published: boolean;
  publishedAt: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}
export type NewsInput = Omit<News, 'id' | 'sortOrder' | 'createdAt' | 'updatedAt'>;
export type AdminUser = AuthenticatedUser;
export type MediaPurpose = 'PRODUCT' | 'BRAND' | 'BANNER' | 'NEWS';
export interface MediaUpload {
  id: number;
  storageKey: string;
  url: string;
  originalFilename: string;
  contentType: 'image/jpeg' | 'image/png';
  sizeBytes: number;
  width: number;
  height: number;
}
