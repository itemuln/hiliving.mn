import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getPublicBanners } from '../../api/contentApi'
import { HeroCarousel } from './HeroCarousel'

vi.mock('../../api/contentApi', () => ({
  getPublicBanners: vi.fn(),
}))

vi.mock('embla-carousel-react', () => ({
  default: () => [vi.fn(), null],
}))

vi.mock('embla-carousel-autoplay', () => ({
  default: () => ({ play: vi.fn(), stop: vi.fn() }),
}))

describe('HeroCarousel', () => {
  beforeEach(() => {
    vi.mocked(getPublicBanners).mockResolvedValue([
      {
        id: 1,
        title: 'Summer banner',
        subtitle: null,
        imageUrl: '/media/banners/desktop.jpg',
        mobileImageUrl: '/media/banners/mobile.png',
        linkUrl: null,
        linkLabel: null,
        sortOrder: 0,
        startsAt: null,
        endsAt: null,
        active: true,
        createdAt: '2026-07-16T00:00:00Z',
        updatedAt: '2026-07-16T00:00:00Z',
      },
    ])
  })

  it('uses the mobile image below the small-screen breakpoint', async () => {
    render(<HeroCarousel />)

    const image = await screen.findByRole('img', { name: 'Summer banner' })
    expect(image).toHaveAttribute('src', '/media/banners/desktop.jpg')

    await waitFor(() => {
      const mobileSource = image.closest('picture')?.querySelector('source')
      expect(mobileSource).toHaveAttribute('media', '(max-width: 639px)')
      expect(mobileSource).toHaveAttribute('srcset', '/media/banners/mobile.png')
    })
  })
})
