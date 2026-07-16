import { apiRequest } from './accountApi'
import type { Banner,News } from '../features/admin/admin.types'
export const getPublicBanners=()=>apiRequest<Banner[]>('/api/v1/banners')
export const getPublicNews=()=>apiRequest<News[]>('/api/v1/news')
export const getPublicNewsArticle=(slug:string)=>apiRequest<News>(`/api/v1/news/${encodeURIComponent(slug)}`)
