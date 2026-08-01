import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getPublicNews } from '../../api/contentApi';
import { NewsSection } from './NewsSection';

vi.mock('../../api/contentApi', () => ({
  getPublicNews: vi.fn(),
}));

describe('NewsSection', () => {
  beforeEach(() => {
    vi.mocked(getPublicNews).mockResolvedValue([
      {
        id: 1,
        title: 'Шинэ мэдээ',
        slug: 'shine-medee',
        category: 'NEWS',
        content: 'Дэлгэрэнгүй агуулга',
        thumbnailUrl: '/news.jpg',
        published: true,
        publishedAt: '2026-08-01T00:00:00Z',
        sortOrder: 0,
        createdAt: '2026-08-01T00:00:00Z',
        updatedAt: '2026-08-01T00:00:00Z',
      },
    ]);
  });

  it('shows the title followed by a right-aligned read action', async () => {
    render(<NewsSection />);

    await screen.findByText('Шинэ мэдээ');
    expect(screen.getByRole('link', { name: /Унших/ }).parentElement).toHaveClass('justify-end');
  });
});
