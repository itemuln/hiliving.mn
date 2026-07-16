import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  CatalogApiError,
  fetchCategories,
  fetchProductBySlug,
  fetchProducts,
  serializeProductQuery,
} from './catalogApi';
import {
  jsonResponse,
  productDetailDto,
  productPageEnvelope,
  productSummaryDto,
} from '../test/catalogFixtures';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('catalog API adapter', () => {
  it('serializes every supported product filter with controlled names', () => {
    expect(
      serializeProductQuery({
        page: 1,
        size: 16,
        category: 'cleaning',
        brand: 'tez-blanc',
        search: ' surface cleaner ',
        featured: true,
        sort: 'price_asc',
      })
    ).toBe(
      'page=1&size=16&category=cleaning&brand=tez-blanc&search=surface+cleaner&featured=true&sort=price_asc'
    );
  });

  it('loads and maps a paginated product response into the frontend model', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse(productPageEnvelope([productSummaryDto])));
    vi.stubGlobal('fetch', fetchMock);

    const result = await fetchProducts({ category: 'cleaning', sort: 'price_desc' });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/products?category=cleaning&sort=price_desc',
      expect.objectContaining({ headers: { Accept: 'application/json' } })
    );
    expect(result.items[0]).toMatchObject({
      slug: 'plant-based-household-cleaner',
      listPrice: 65000,
      currentPrice: 50000,
      imageUrl: '/product-cleaner.svg',
    });
  });

  it('maps categories to presentation-safe icon metadata', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse({
          data: [
            {
              id: 2,
              name: 'Cleaning',
              slug: 'cleaning',
              parentSlug: 'household',
              displayOrder: 20,
            },
          ],
        })
      )
    );

    await expect(fetchCategories()).resolves.toEqual([
      expect.objectContaining({ slug: 'cleaning', iconUrl: '/brush.png' }),
    ]);
  });

  it('normalizes backend 404 and server responses without exposing response messages', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse(
          { error: { code: 'RESOURCE_NOT_FOUND', message: 'database row missing' } },
          404
        )
      )
      .mockResolvedValueOnce(
        jsonResponse({ error: { code: 'INTERNAL_ERROR', message: 'SQL connection details' } }, 500)
      );
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchProductBySlug('missing-product')).rejects.toMatchObject({
      kind: 'not-found',
      status: 404,
      code: 'RESOURCE_NOT_FOUND',
      message: 'The requested catalog item was not found.',
    } satisfies Partial<CatalogApiError>);
    await expect(fetchProducts()).rejects.toMatchObject({
      kind: 'server',
      status: 500,
      message: 'Catalog data could not be loaded.',
    } satisfies Partial<CatalogApiError>);
  });

  it('rejects malformed successful envelopes as safe adapter errors', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse({ unexpected: productDetailDto }))
    );

    await expect(fetchProductBySlug('plant-based-household-cleaner')).rejects.toMatchObject({
      kind: 'invalid-response',
      message: 'Catalog data could not be loaded.',
    } satisfies Partial<CatalogApiError>);
  });
});
