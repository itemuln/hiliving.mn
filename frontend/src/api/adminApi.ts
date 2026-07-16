import { apiRequest, apiUpload, type UploadOptions } from './accountApi';
import type {
  AdminUser,
  Banner,
  BannerInput,
  Brand,
  BrandInput,
  Category,
  CategoryInput,
  DashboardCounts,
  MediaPurpose,
  MediaUpload,
  News,
  NewsInput,
  Page,
  Product,
  ProductInput,
} from '../features/admin/admin.types';
import type { Address } from '../features/account/account.types';

const json = (method: string, body: unknown): RequestInit => ({
  method,
  body: JSON.stringify(body),
});
const query = (values: Record<string, unknown>) => {
  const q = new URLSearchParams();
  Object.entries(values).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') q.set(k, String(v));
  });
  const value = q.toString();
  return value ? `?${value}` : '';
};
export const getDashboard = () => apiRequest<DashboardCounts>('/api/v1/admin/dashboard');
export const listCategories = (search = '') =>
  apiRequest<Category[]>(`/api/v1/admin/categories${query({ search })}`);
export const createCategory = (input: CategoryInput) =>
  apiRequest<Category>('/api/v1/admin/categories', json('POST', input));
export const updateCategory = (id: number, input: CategoryInput) =>
  apiRequest<Category>(`/api/v1/admin/categories/${id}`, json('PATCH', input));
export const deleteCategory = (id: number) =>
  apiRequest<void>(`/api/v1/admin/categories/${id}`, { method: 'DELETE' });
export const listBrands = (search = '') =>
  apiRequest<Brand[]>(`/api/v1/admin/brands${query({ search })}`);
export const createBrand = (input: BrandInput) =>
  apiRequest<Brand>('/api/v1/admin/brands', json('POST', input));
export const updateBrand = (id: number, input: BrandInput) =>
  apiRequest<Brand>(`/api/v1/admin/brands/${id}`, json('PATCH', input));
export const deleteBrand = (id: number) =>
  apiRequest<void>(`/api/v1/admin/brands/${id}`, { method: 'DELETE' });
export const listProducts = (filters: Record<string, unknown>) =>
  apiRequest<Page<Product>>(`/api/v1/admin/products${query(filters)}`);
export const getProduct = (id: number) => apiRequest<Product>(`/api/v1/admin/products/${id}`);
export const createProduct = (input: ProductInput) =>
  apiRequest<Product>('/api/v1/admin/products', json('POST', input));
export const updateProduct = (id: number, input: ProductInput) =>
  apiRequest<Product>(`/api/v1/admin/products/${id}`, json('PATCH', input));
export const archiveProduct = (id: number) =>
  apiRequest<Product>(`/api/v1/admin/products/${id}/archive`, { method: 'POST' });
export const restoreProduct = (id: number) =>
  apiRequest<Product>(`/api/v1/admin/products/${id}/restore`, { method: 'POST' });
export const listUsers = (filters: Record<string, unknown>) =>
  apiRequest<Page<AdminUser>>(`/api/v1/admin/users${query(filters)}`);
export const getUser = (id: number) => apiRequest<AdminUser>(`/api/v1/admin/users/${id}`);
export const getUserAddresses = (id: number) =>
  apiRequest<Address[]>(`/api/v1/admin/users/${id}/addresses`);
export const updateUserMembership = (id: number, membershipCode: string) =>
  apiRequest<AdminUser>(`/api/v1/admin/users/${id}/membership`, json('PATCH', { membershipCode }));
export const updateUserDiscount = (id: number, discountOverridePercentage: number | null) =>
  apiRequest<AdminUser>(
    `/api/v1/admin/users/${id}/discount`,
    json('PATCH', { discountOverridePercentage })
  );
export const updateUserStatus = (id: number, status: string) =>
  apiRequest<AdminUser>(`/api/v1/admin/users/${id}/status`, json('PATCH', { status }));
export const listBanners = () => apiRequest<Banner[]>('/api/v1/admin/banners');
export const createBanner = (input: BannerInput) =>
  apiRequest<Banner>('/api/v1/admin/banners', json('POST', input));
export const updateBanner = (id: number, input: BannerInput) =>
  apiRequest<Banner>(`/api/v1/admin/banners/${id}`, json('PATCH', input));
export const deleteBanner = (id: number) =>
  apiRequest<void>(`/api/v1/admin/banners/${id}`, { method: 'DELETE' });
export const listNews = (search = '') =>
  apiRequest<News[]>(`/api/v1/admin/news${query({ search })}`);
export const getNews = (id: number) => apiRequest<News>(`/api/v1/admin/news/${id}`);
export const createNews = (input: NewsInput) =>
  apiRequest<News>('/api/v1/admin/news', json('POST', input));
export const updateNews = (id: number, input: NewsInput) =>
  apiRequest<News>(`/api/v1/admin/news/${id}`, json('PATCH', input));
export const deleteNews = (id: number) =>
  apiRequest<void>(`/api/v1/admin/news/${id}`, { method: 'DELETE' });
export const uploadMediaImage = (
  file: File,
  purpose: MediaPurpose,
  options: UploadOptions = {}
) => {
  const body = new FormData();
  body.append('file', file);
  body.append('purpose', purpose);
  return apiUpload<MediaUpload>('/api/v1/admin/media/images', body, options);
};
