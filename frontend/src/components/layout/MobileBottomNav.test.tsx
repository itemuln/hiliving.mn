import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { MobileBottomNav } from './MobileBottomNav';

describe('MobileBottomNav', () => {
  it('keeps categories focused and exposes secondary destinations through the menu', () => {
    render(
      <MemoryRouter initialEntries={['/contact']}>
        <MobileBottomNav />
      </MemoryRouter>
    );

    expect(screen.getByRole('link', { name: 'Ангилал' })).toHaveAttribute('href', '/categories/');
    const menuButton = screen.getByRole('button', { name: 'Цэс' });
    expect(menuButton).toHaveAttribute('aria-current', 'page');

    fireEvent.click(menuButton);

    const menu = screen.getByRole('dialog', { name: 'Нэмэлт цэс' });
    expect(within(menu).getByRole('link', { name: /Hiliving MGL/ })).toHaveAttribute(
      'href',
      '/#hiliving-mgl'
    );
    expect(within(menu).getByRole('link', { name: /Брэндүүд/ })).toHaveAttribute('href', '/brands');
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
      <MemoryRouter initialEntries={['/#hiliving-mgl']}>
        <MobileBottomNav />
      </MemoryRouter>
    );

    expect(screen.getByRole('button', { name: 'Цэс' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Эхлэл' })).not.toHaveAttribute('aria-current', 'page');
  });

  it('shows only the menu as active while the sheet is open', () => {
    render(
      <MemoryRouter initialEntries={['/categories']}>
        <MobileBottomNav />
      </MemoryRouter>
    );

    expect(screen.getByRole('link', { name: 'Ангилал' })).toHaveAttribute('aria-current', 'page');
    fireEvent.click(screen.getByRole('button', { name: 'Цэс' }));

    expect(screen.getByRole('link', { name: 'Ангилал' })).not.toHaveAttribute('aria-current');
    expect(screen.getByRole('button', { name: 'Цэс' })).toHaveClass('text-brand-500');
  });
});
