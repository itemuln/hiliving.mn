import type { AuthenticatedUser } from '../auth/auth.types';
import type { CustomerOrder } from '../checkout/order.types';
import type { OrderSummary } from '../checkout/order.types';
import type { NewsCategory } from '../news/newsCategories';

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
  placement: BannerPlacement;
  sortOrder: number;
  active: boolean;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
  updatedAt: string;
}
export type BannerPlacement = 'HERO' | 'PROMOTIONAL';
export type BannerInput = Omit<
  Banner,
  'id' | 'linkUrl' | 'linkLabel' | 'startsAt' | 'endsAt' | 'createdAt' | 'updatedAt'
>;
export interface News {
  id: number;
  title: string;
  slug: string;
  category: NewsCategory;
  content: string;
  thumbnailUrl: string | null;
  published: boolean;
  publishedAt: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}
export type NewsInput = Omit<News, 'id' | 'slug' | 'sortOrder' | 'createdAt' | 'updatedAt'>;
export interface ContentPage {
  id: number;
  slug: string;
  navigationLabel: string;
  title: string;
  contentHtml: string;
  published: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}
export type ContentPageInput = Pick<ContentPage, 'title' | 'contentHtml' | 'published'>;
export type AdminUser = AuthenticatedUser;
export interface AdminUserSummary extends AuthenticatedUser {
  orderCount: number;
  totalPaid: number;
}
export interface AdminUserOrderOverview {
  cancelledCount: number;
  shippedCount: number;
  orders: Page<OrderSummary>;
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
