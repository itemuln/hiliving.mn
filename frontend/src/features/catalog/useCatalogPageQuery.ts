import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { ProductSort } from './catalog.types';

const productSorts: readonly ProductSort[] = ['newest', 'price_asc', 'price_desc', 'name_asc'];

export function useCatalogPageQuery() {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawPage = Number(searchParams.get('page') ?? '1');
  const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;
  const search = (searchParams.get('search') ?? '').slice(0, 100);
  const rawSort = searchParams.get('sort');
  const sort = productSorts.includes(rawSort as ProductSort) ? (rawSort as ProductSort) : 'newest';

  const update = useCallback(
    (name: string, value: string | null, resetPage = true) => {
      const next = new URLSearchParams(searchParams);
      if (value) next.set(name, value);
      else next.delete(name);
      if (resetPage) next.delete('page');
      setSearchParams(next);
    },
    [searchParams, setSearchParams]
  );

  const setPage = useCallback(
    (nextPage: number) => {
      update('page', nextPage > 1 ? String(nextPage) : null, false);
    },
    [update]
  );

  return {
    page,
    search,
    sort,
    setPage,
    setSearch: (value: string) => update('search', value || null),
    setSort: (value: ProductSort) => update('sort', value === 'newest' ? null : value),
  };
}
