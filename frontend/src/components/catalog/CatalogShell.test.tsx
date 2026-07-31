import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Link, MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { CatalogShell } from './CatalogShell';

const heroMounts = vi.hoisted(() => vi.fn());

vi.mock('../home/HeroCarousel', async () => {
  const { useEffect } = await vi.importActual<typeof import('react')>('react');

  return {
    HeroCarousel: () => {
      useEffect(() => {
        heroMounts();
      }, []);

      return <div>Hero carousel</div>;
    },
  };
});

vi.mock('../layout/Header', () => ({ Header: () => <header>Header</header> }));
vi.mock('../layout/Footer', () => ({ Footer: () => <footer>Footer</footer> }));
vi.mock('../layout/MobileBottomNav', () => ({ MobileBottomNav: () => null }));

describe('CatalogShell', () => {
  it('keeps the hero mounted while navigating between catalog URLs', async () => {
    render(
      <MemoryRouter initialEntries={['/categories']}>
        <Routes>
          <Route element={<CatalogShell />}>
            <Route
              path="/categories/:categorySlug?"
              element={<Link to="/brands/example-brand">Open brand</Link>}
            />
            <Route path="/brands/:brandSlug?" element={<p>Brand products</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(heroMounts).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('link', { name: 'Open brand' }));

    await screen.findByText('Brand products');
    await waitFor(() => expect(heroMounts).toHaveBeenCalledTimes(1));
  });
});
