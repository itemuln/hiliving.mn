import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { BrandsSection } from './BrandsSection';

vi.mock('../../features/catalog/useCatalog', () => ({
  useBrands: () => ({
    status: 'success',
    data: Array.from({ length: 7 }, (_, index) => ({
      id: index + 1,
      name: `Brand ${index + 1}`,
      slug: `brand-${index + 1}`,
      logoUrl: null,
      bannerImageUrl: null,
    })),
    retry: vi.fn(),
  }),
}));

describe('BrandsSection', () => {
  it('keeps every brand visible when the desktop grid wraps to another row', () => {
    render(
      <MemoryRouter>
        <BrandsSection />
      </MemoryRouter>
    );

    const links = screen.getAllByRole('link', { name: /Brand/ });
    expect(links).toHaveLength(7);
    links.forEach((link) => expect(link).not.toHaveClass('md:hidden'));
  });
});
