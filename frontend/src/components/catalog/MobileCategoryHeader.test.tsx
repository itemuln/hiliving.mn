import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import type { CatalogCategory } from '../../features/catalog/catalog.types';
import { MobileCategoryHeader } from './MobileCategoryHeader';

const categories: readonly CatalogCategory[] = [
  {
    id: 1,
    name: 'Health',
    slug: 'health',
    parentSlug: null,
    displayOrder: 0,
    iconUrl: '/icons/health.svg',
  },
  {
    id: 2,
    name: 'Household',
    slug: 'household',
    parentSlug: null,
    displayOrder: 1,
    iconUrl: '/icons/household.svg',
  },
];

function LocationProbe() {
  return <output aria-label="Current path">{useLocation().pathname}</output>;
}

describe('MobileCategoryHeader', () => {
  it('uses the active category icon as the category-menu button', () => {
    render(
      <MemoryRouter initialEntries={['/categories/health']}>
        <MobileCategoryHeader
          categories={categories}
          activeCategory={categories[0]}
          isAll={false}
        />
        <LocationProbe />
      </MemoryRouter>
    );

    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();

    const trigger = screen.getByRole('button', { name: 'Ангилал солих' });
    fireEvent.click(trigger);

    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('navigation', { name: 'Ангилал сонгох' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Health' })).toHaveAttribute('aria-current', 'page');

    fireEvent.click(screen.getByRole('link', { name: 'Household' }));

    expect(screen.getByRole('status', { name: 'Current path' })).toHaveTextContent(
      '/categories/household'
    );
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('closes the category menu with Escape and restores trigger focus', () => {
    render(
      <MemoryRouter initialEntries={['/categories']}>
        <MobileCategoryHeader categories={categories} isAll />
      </MemoryRouter>
    );

    const trigger = screen.getByRole('button', { name: 'Ангилал солих' });
    fireEvent.click(trigger);
    fireEvent.keyDown(trigger, { key: 'Escape' });

    expect(screen.queryByRole('navigation', { name: 'Ангилал сонгох' })).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
});
