import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getPublicBanners } from '../../api/contentApi';
import { PromotionalBanner } from './PromotionalBanner';

vi.mock('../../api/contentApi', () => ({
  getPublicBanners: vi.fn(),
}));

vi.mock('embla-carousel-react', () => ({
  default: () => [vi.fn(), null],
}));

describe('PromotionalBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getPublicBanners).mockResolvedValue([
      {
        id: 2,
        title: 'Lower banner',
        subtitle: null,
        imageUrl: '/media/banners/lower-desktop.jpg',
        mobileImageUrl: '/media/banners/lower-mobile.jpg',
        linkUrl: null,
        linkLabel: null,
        placement: 'PROMOTIONAL',
        sortOrder: 0,
        active: true,
        startsAt: null,
        endsAt: null,
        createdAt: '2026-08-01T00:00:00Z',
        updatedAt: '2026-08-01T00:00:00Z',
      },
    ]);
  });

  it('loads only managed lower banners and uses the mobile image when available', async () => {
    render(<PromotionalBanner />);

    const image = await screen.findByRole('img', { name: 'Lower banner' });
    expect(getPublicBanners).toHaveBeenCalledWith('PROMOTIONAL');
    expect(image).toHaveAttribute('src', '/media/banners/lower-desktop.jpg');
    expect(image).toHaveClass('sm:aspect-[24/5]');
    const section = screen.getByRole('region', { name: 'Нэмэлт урамшуулал' });
    expect(section).not.toHaveClass('py-3');
    expect(section.firstElementChild).not.toHaveClass('px-4', 'sm:px-6', 'lg:px-10');
    expect(image.closest('picture')?.querySelector('source')).toHaveAttribute(
      'srcset',
      '/media/banners/lower-mobile.jpg'
    );
  });
});
