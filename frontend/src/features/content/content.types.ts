import type { NewsCategory } from '../news/newsCategories';

export type BannerPlacement = 'HERO' | 'PROMOTIONAL';

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
