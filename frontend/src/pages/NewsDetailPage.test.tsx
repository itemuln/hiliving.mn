import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getPublicNewsArticle } from '../api/contentApi';
import { NewsDetailPage } from './NewsDetailPage';

vi.mock('../api/contentApi', () => ({ getPublicNewsArticle: vi.fn() }));

describe('NewsDetailPage', () => {
  beforeEach(() => {
    vi.mocked(getPublicNewsArticle).mockResolvedValue({
      id: 1,
      title: 'Rich news',
      slug: 'rich-news',
      category: 'NEWS',
      content: '<p>Formatted <strong>news content</strong></p>',
      thumbnailUrl: null,
      published: true,
      publishedAt: '2026-08-01T00:00:00Z',
      sortOrder: 0,
      createdAt: '2026-08-01T00:00:00Z',
      updatedAt: '2026-08-01T00:00:00Z',
    });
  });

  it('renders server-sanitized rich article HTML', async () => {
    render(
      <MemoryRouter initialEntries={['/news/rich-news']}>
        <Routes>
          <Route path="/news/:newsSlug" element={<NewsDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByRole('heading', { name: 'Rich news' })).toHaveClass(
      "font-['Roboto']",
      'text-[20px]',
      'font-normal'
    );
    expect(screen.getByText('news content')).toHaveProperty('tagName', 'STRONG');
  });
});
