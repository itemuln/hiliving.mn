import { fireEvent, render, screen } from '@testing-library/react';
import { Link, MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ScrollToTop } from './ScrollToTop';

const scrollIntoView = vi.fn();

function NavigationHarness() {
  return (
    <>
      <ScrollToTop />
      <div
        id="catalog-products"
        ref={(node) => {
          if (node) node.scrollIntoView = scrollIntoView;
        }}
      />
      <Link to="/brands/example-brand">Open brand</Link>
      <Link to="/products/example-product">Open product</Link>
    </>
  );
}

describe('ScrollToTop', () => {
  beforeEach(() => {
    vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
    scrollIntoView.mockReset();
  });

  it('scrolls to the catalog content when moving between category and brand URLs', () => {
    render(
      <MemoryRouter initialEntries={['/categories']}>
        <NavigationHarness />
      </MemoryRouter>
    );

    vi.mocked(window.scrollTo).mockClear();
    fireEvent.click(screen.getByRole('link', { name: 'Open brand' }));

    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
    expect(window.scrollTo).not.toHaveBeenCalled();
  });

  it('scrolls to the page top when leaving the catalog', () => {
    render(
      <MemoryRouter initialEntries={['/categories']}>
        <NavigationHarness />
      </MemoryRouter>
    );

    vi.mocked(window.scrollTo).mockClear();
    fireEvent.click(screen.getByRole('link', { name: 'Open product' }));

    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
    expect(scrollIntoView).not.toHaveBeenCalled();
  });
});
