import type { AuthenticatedUser } from '../auth/auth.types';
import type { PagedResult } from '../../api/api.types';
import type { CustomerOrder, OrderSummary } from '../checkout/order.types';
import type { Banner, ContentPage, News } from '../content/content.types';

export type { Banner, ContentPage, News } from '../content/content.types';

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
  bannerImageUrl: string | null;
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
  displayScale: number;
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
export type BannerInput = Omit<
  Banner,
  'id' | 'linkUrl' | 'linkLabel' | 'startsAt' | 'endsAt' | 'createdAt' | 'updatedAt'
>;
export type NewsInput = Omit<News, 'id' | 'slug' | 'sortOrder' | 'createdAt' | 'updatedAt'>;
export type ContentPageInput = Pick<ContentPage, 'title' | 'contentHtml' | 'published'>;
export type AdminUser = AuthenticatedUser;
export interface AdminUserSummary extends AuthenticatedUser {
  orderCount: number;
  totalPaid: number;
}
export interface AdminUserOrderOverview {
  cancelledCount: number;
  shippedCount: number;
  orders: PagedResult<OrderSummary>;
}
export type MediaPurpose = 'PRODUCT' | 'BRAND' | 'BANNER' | 'NEWS' | 'PAGE';
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

export interface AdminOrderSummary {
  orderNumber: string;
  placedAt: string;
  customerName: string;
  customerEmail: string;
  orderStatus: string;
  paymentStatus: string;
  paymentMethod: string;
  grandTotal: number;
  currency: 'MNT';
}

export interface AdminOrderDetail {
  customerName: string;
  customerEmail: string;
  order: CustomerOrder;
}
