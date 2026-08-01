import { apiRequest } from './accountApi';
import type { Banner, BannerPlacement, ContentPage, News } from '../features/admin/admin.types';
export const getPublicBanners = (placement: BannerPlacement) =>
  apiRequest<Banner[]>(`/api/v1/banners?placement=${placement}`);
export const getPublicNews = () => apiRequest<News[]>('/api/v1/news');
export const getPublicNewsArticle = (slug: string) =>
  apiRequest<News>(`/api/v1/news/${encodeURIComponent(slug)}`);
export const getPublicContentPages = () => apiRequest<ContentPage[]>('/api/v1/pages/hiliving-mgl');
