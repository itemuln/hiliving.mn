import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { BrandProductsPage } from '../../pages/BrandProductsPage';
import { CatalogToolbar } from './CatalogToolbar';
import { Sidebar } from './Sidebar';

vi.mock('../../features/catalog/useCatalog', () => ({
  useBrands: () => ({
    status: 'success',
    data: [
      {
        id: 1,
        name: 'Sample',
        slug: 'sample',
        logoUrl: null,
        bannerImageUrl: '/media/brands/sample-banner.jpg',
      },
    ],
    retry: vi.fn(),
  }),
  useProducts: () => ({
    status: 'success',
    data: {
      items: [],
      page: 0,
      size: 16,
      totalElements: 0,
      totalPages: 0,
      first: true,
      last: true,
    },
    retry: vi.fn(),
  }),
}));

vi.mock('../../features/catalog/useCatalogPageQuery', () => ({
  useCatalogPageQuery: () => ({
    page: 1,
    search: '',
    sort: 'newest',
    setPage: vi.fn(),
    setSearch: vi.fn(),
    setSort: vi.fn(),
  }),
}));

describe('brand catalog presentation', () => {
  it('removes taxonomy icons from brand navigation', () => {
    render(
      <MemoryRouter>
        <Sidebar
          items={[
            { slug: 'all', name: 'БҮГД' },
            { slug: 'sample', name: 'Sample' },
          ]}
          activeSlug="all"
          basePath="/brands"
          variant="brand"
        />
      </MemoryRouter>
    );

    expect(
      screen.getByRole('navigation', { name: 'Брэнд сонгох' }).querySelector('img')
    ).toBeNull();
  });

  it('keeps brand search and sorting in the inline mobile layout', () => {
    render(
      <CatalogToolbar
        search=""
        sort="newest"
        onSearch={vi.fn()}
        onSort={vi.fn()}
        mobileLayout="inline"
      />
    );

    const search = screen.getByRole('search');
    const toolbar = search.parentElement;
    expect(toolbar).toHaveClass('flex-row', 'items-center');
    expect(toolbar).toContainElement(screen.getByLabelText('Бүтээгдэхүүн эрэмбэлэх'));
  });

  it('renders the managed banner for the selected brand', () => {
    render(
      <MemoryRouter initialEntries={['/brands/sample']}>
        <Routes>
          <Route path="/brands/:brandSlug" element={<BrandProductsPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByRole('img', { name: 'Sample брэндийн баннер' })).toHaveAttribute(
      'src',
      '/media/brands/sample-banner.jpg'
    );
  });
});
