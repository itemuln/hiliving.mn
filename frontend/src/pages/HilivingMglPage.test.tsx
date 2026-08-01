import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getPublicContentPages } from '../api/contentApi';
import { HilivingMglPage } from './HilivingMglPage';

vi.mock('../api/contentApi', () => ({ getPublicContentPages: vi.fn() }));

const pages = [
  {
    id: 1,
    slug: 'company-history',
    navigationLabel: 'КОМПАНИЙН ТҮҮХ',
    title: 'Компанийн түүх',
    contentHtml: '<p>Бидний <strong>түүхэн замнал</strong>.</p>',
    published: true,
    sortOrder: 10,
    createdAt: '2026-08-01T00:00:00Z',
    updatedAt: '2026-08-01T00:00:00Z',
  },
  {
    id: 2,
    slug: 'membership',
    navigationLabel: 'ГИШҮҮНЧЛЭЛ',
    title: 'Гишүүнчлэл',
    contentHtml: '<p>Гишүүнчлэлийн агуулга</p>',
    published: true,
    sortOrder: 20,
    createdAt: '2026-08-01T00:00:00Z',
    updatedAt: '2026-08-01T00:00:00Z',
  },
];

describe('HilivingMglPage', () => {
  beforeEach(() => {
    vi.mocked(getPublicContentPages).mockResolvedValue(pages);
  });

  it('renders the published rich HTML and responsive section navigation', async () => {
    render(
      <MemoryRouter initialEntries={['/hiliving-mgl/company-history']}>
        <Routes>
          <Route path="/hiliving-mgl/:sectionSlug?" element={<HilivingMglPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByRole('heading', { name: 'Компанийн түүх' })).toBeInTheDocument();
    expect(screen.getByText('түүхэн замнал')).toHaveProperty('tagName', 'STRONG');
    expect(screen.getByRole('link', { name: 'КОМПАНИЙН ТҮҮХ' })).toHaveAttribute(
      'aria-current',
      'page'
    );
    expect(screen.getByRole('link', { name: 'ГИШҮҮНЧЛЭЛ' })).toHaveAttribute(
      'href',
      '/hiliving-mgl/membership'
    );
  });

  it('shows a retryable error when the public page request fails', async () => {
    vi.mocked(getPublicContentPages).mockRejectedValueOnce(new Error('unavailable'));
    render(
      <MemoryRouter initialEntries={['/hiliving-mgl']}>
        <Routes>
          <Route path="/hiliving-mgl/:sectionSlug?" element={<HilivingMglPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'Хуудсыг ачаалж чадсангүй' })).toBeInTheDocument()
    );
    expect(screen.getByRole('button', { name: 'Дахин оролдох' })).toBeInTheDocument();
  });
});
