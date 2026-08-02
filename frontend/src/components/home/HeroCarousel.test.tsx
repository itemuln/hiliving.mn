import type { ReactNode } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getPublicBanners } from '../../api/contentApi';
import { HeroCarousel } from './HeroCarousel';

vi.mock('../../api/contentApi', () => ({
  getPublicBanners: vi.fn(),
}));

vi.mock('embla-carousel-react', () => ({
  default: () => [vi.fn(), null],
}));

vi.mock('embla-carousel-autoplay', () => ({
  default: () => ({ play: vi.fn(), stop: vi.fn() }),
}));

vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, initial }: { children: ReactNode; initial: unknown }) => (
      <div data-entrance={initial === false ? 'settled' : 'animated'}>{children}</div>
    ),
  },
  useReducedMotion: () => false,
}));

describe('HeroCarousel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    vi.mocked(getPublicBanners).mockResolvedValue([
      {
        id: 1,
        title: 'Summer banner',
        subtitle: null,
        imageUrl: '/media/banners/desktop.jpg',
        mobileImageUrl: '/media/banners/mobile.png',
        linkUrl: null,
        linkLabel: null,
        placement: 'HERO',
        sortOrder: 0,
        startsAt: null,
        endsAt: null,
        active: true,
        createdAt: '2026-07-16T00:00:00Z',
        updatedAt: '2026-07-16T00:00:00Z',
      },
    ]);
  });

  it('uses the mobile image below the small-screen breakpoint', async () => {
    render(<HeroCarousel />);

    const image = await screen.findByRole('img', { name: 'Summer banner' });
    expect(getPublicBanners).toHaveBeenCalledWith('HERO');
    expect(image).toHaveAttribute('src', '/media/banners/desktop.jpg');
    expect(image).toHaveAttribute('loading', 'eager');
    expect(image).toHaveAttribute('fetchpriority', 'high');
    expect(image).toHaveAttribute('width', '2400');
    expect(image).toHaveAttribute('height', '990');
    expect(image.parentElement?.parentElement).toHaveAttribute('data-entrance', 'animated');
    const section = screen.getByRole('region', { name: 'Онцлох урамшуулал' });
    expect(section.firstElementChild).toHaveClass('h-[170px]', 'sm:aspect-[24/5]');
    expect(section).not.toHaveClass('bg-neutral-100', 'py-3');
    expect(section.firstElementChild).not.toHaveClass('px-4', 'sm:px-6', 'lg:px-10');

    await waitFor(() => {
      const mobileSource = image.closest('picture')?.querySelector('source');
      expect(mobileSource).toHaveAttribute('media', '(max-width: 639px)');
      expect(mobileSource).toHaveAttribute('srcset', '/media/banners/mobile.png');
    });
  });

  it('restores the visible hero without replaying its entrance after a remount', async () => {
    const firstRender = render(<HeroCarousel />);
    await screen.findByRole('img', { name: 'Summer banner' });
    firstRender.unmount();
    vi.mocked(getPublicBanners).mockRejectedValueOnce(new Error('temporarily unavailable'));

    render(<HeroCarousel />);

    const restoredImage = screen.getByRole('img', { name: 'Summer banner' });
    expect(restoredImage).toHaveAttribute('src', '/media/banners/desktop.jpg');
    expect(restoredImage.parentElement?.parentElement).toHaveAttribute('data-entrance', 'settled');
    await waitFor(() => expect(getPublicBanners).toHaveBeenCalledTimes(2));
  });
});
