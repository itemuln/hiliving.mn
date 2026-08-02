import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchCategories } from '../../api/catalogApi';
import { MobileBottomNav } from './MobileBottomNav';

vi.mock('../../api/catalogApi', () => ({ fetchCategories: vi.fn() }));

describe('MobileBottomNav', () => {
  beforeEach(() => {
    vi.mocked(fetchCategories).mockResolvedValue([
      {
        id: 1,
        name: 'Арьс арчилгаа',
        slug: 'skin-care',
        parentSlug: null,
        displayOrder: 1,
        iconUrl: '/icons/grid.svg',
      },
    ]);
  });

  it('opens a focused category sheet from the larger category button', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <MobileBottomNav />
      </MemoryRouter>
    );

    const mobileNav = screen.getByRole('navigation', { name: 'Гар утасны цэс' });
    expect(mobileNav.firstElementChild).toHaveClass('h-[78px]');
    expect(
      Array.from(mobileNav.firstElementChild?.children ?? []).map((item) => item.textContent)
    ).toEqual(['Эхлэл', 'Ангилал', 'Цэс', 'Сагс', 'Нэвтрэх']);
    const categoryButton = screen.getByRole('button', { name: 'Ангилал' });
    expect(categoryButton).toHaveClass('text-[11px]');
    expect(categoryButton.querySelector('img')).toHaveClass('h-6', 'w-6');

    fireEvent.click(categoryButton);

    const categorySheet = screen.getByRole('dialog', { name: 'Ангилал сонгох' });
    expect(within(categorySheet).getByRole('link', { name: 'БҮГД' })).toHaveAttribute(
      'href',
      '/categories'
    );
    expect(
      await within(categorySheet).findByRole('link', { name: 'Арьс арчилгаа' })
    ).toHaveAttribute('href', '/categories/skin-care');
    expect(fetchCategories).toHaveBeenCalledTimes(1);
    expect(within(categorySheet).getByRole('link', { name: 'БҮГД' })).toHaveFocus();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog', { name: 'Ангилал сонгох' })).not.toBeInTheDocument();
    expect(categoryButton).toHaveFocus();
  });

  it('exposes secondary destinations through the menu sheet', () => {
    render(
      <MemoryRouter initialEntries={['/contact']}>
        <MobileBottomNav />
      </MemoryRouter>
    );

    const menuButton = screen.getByRole('button', { name: 'Цэс' });
    expect(menuButton).toHaveAttribute('aria-current', 'page');
    fireEvent.click(menuButton);

    const menu = screen.getByRole('dialog', { name: 'Нэмэлт цэс' });
    expect(within(menu).getByRole('link', { name: /Hiliving MGL/ })).toHaveAttribute(
      'href',
      '/hiliving-mgl'
    );
    expect(within(menu).getByRole('link', { name: /Брэндүүд/ })).toHaveAttribute(
      'href',
      '/brands'
    );
    expect(within(menu).getByRole('link', { name: /Мэдээлэл/ })).toHaveAttribute('href', '/news');
    expect(within(menu).getByRole('link', { name: /Холбоо барих/ })).toHaveAttribute(
      'href',
      '/contact'
    );

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog', { name: 'Нэмэлт цэс' })).not.toBeInTheDocument();
    expect(menuButton).toHaveFocus();
  });

  it('treats the Hiliving section as a secondary destination instead of Home', () => {
    render(
      <MemoryRouter initialEntries={['/hiliving-mgl/membership']}>
        <MobileBottomNav />
      </MemoryRouter>
    );

    expect(screen.getByRole('button', { name: 'Цэс' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Эхлэл' })).not.toHaveAttribute(
      'aria-current',
      'page'
    );
  });

  it('shows only the opened sheet trigger as active', () => {
    render(
      <MemoryRouter initialEntries={['/categories']}>
        <MobileBottomNav />
      </MemoryRouter>
    );

    const categoryButton = screen.getByRole('button', { name: 'Ангилал' });
    const menuButton = screen.getByRole('button', { name: 'Цэс' });
    expect(categoryButton).toHaveAttribute('aria-current', 'page');

    fireEvent.click(menuButton);

    expect(categoryButton).not.toHaveAttribute('aria-current');
    expect(menuButton).toHaveClass('text-brand-500');
    expect(menuButton).toHaveAttribute('aria-current', 'page');
  });
});
