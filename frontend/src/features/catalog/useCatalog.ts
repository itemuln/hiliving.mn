import { useCallback } from 'react';
import {
  fetchBrands,
  fetchCategories,
  fetchProductBySlug,
  fetchProducts,
} from '../../api/catalogApi';
import type { ProductQuery } from './catalog.types';
import { useCatalogResource } from './useCatalogResource';

export function useCategories() {
  const load = useCallback((signal: AbortSignal) => fetchCategories(signal), []);
  return useCatalogResource(load);
}

export function useBrands() {
  const load = useCallback((signal: AbortSignal) => fetchBrands(signal), []);
  return useCatalogResource(load);
}

export function useProducts(query: ProductQuery) {
  const { page, size, category, brand, search, featured, sort } = query;
  const load = useCallback(
    (signal: AbortSignal) =>
      fetchProducts({ page, size, category, brand, search, featured, sort }, signal),
    [brand, category, featured, page, search, size, sort]
  );
  return useCatalogResource(load);
}

export function useProduct(slug: string) {
  const load = useCallback((signal: AbortSignal) => fetchProductBySlug(slug, signal), [slug]);
  return useCatalogResource(load);
}
