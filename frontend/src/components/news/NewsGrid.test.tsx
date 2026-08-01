import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getPublicNews } from '../../api/contentApi';
import { NewsGrid } from './NewsGrid';

vi.mock('../../api/contentApi', () => ({
  getPublicNews: vi.fn(),
}));

describe('NewsGrid', () => {
  beforeEach(() => {
    vi.mocked(getPublicNews).mockReset();
  });

  it('renders the information submenu and API-backed article list', async () => {
    vi.mocked(getPublicNews).mockResolvedValue([
      {
        id: 12,
        title: 'Шинэ мэдээллийн гарчиг',
        slug: 'shine-medeelel',
        category: 'INFORMATION',
        content: 'Нийтлэлийн агуулга',
        thumbnailUrl: '/news.jpg',
        published: true,
        publishedAt: '2026-07-31T00:00:00Z',
        sortOrder: 0,
        createdAt: '2026-07-31T00:00:00Z',
        updatedAt: '2026-07-31T00:00:00Z',
      },
      {
        id: 13,
        title: 'Шинэ мэдээний гарчиг',
        slug: 'shine-medee',
        category: 'NEWS',
        content: 'Мэдээний агуулга',
        thumbnailUrl: '/news.jpg',
        published: true,
        publishedAt: '2026-08-01T00:00:00Z',
        sortOrder: 0,
        createdAt: '2026-08-01T00:00:00Z',
        updatedAt: '2026-08-01T00:00:00Z',
      },
      {
        id: 14,
        title: 'Шинэ сургалтын гарчиг',
        slug: 'shine-surgalt',
        category: 'TRAINING',
        content: 'Сургалтын агуулга',
        thumbnailUrl: '/training.jpg',
        published: true,
        publishedAt: '2026-08-02T00:00:00Z',
        sortOrder: 0,
        createdAt: '2026-08-02T00:00:00Z',
        updatedAt: '2026-08-02T00:00:00Z',
      },
    ]);

    render(
      <MemoryRouter>
        <NewsGrid />
      </MemoryRouter>
    );

    expect(screen.getByRole('navigation', { name: 'Мэдээллийн дэд цэс' })).toHaveTextContent(
      'МэдээМэдээлэлСургалт'
    );
    expect(screen.getByRole('button', { name: 'Мэдээлэл' })).toHaveAttribute(
      'aria-current',
      'page'
    );
    expect(screen.getByRole('button', { name: 'Мэдээлэл' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(await screen.findByRole('link', { name: 'Шинэ мэдээллийн гарчиг' })).toHaveAttribute(
      'href',
      '/news/shine-medeelel'
    );
    expect(screen.queryByRole('link', { name: 'Шинэ мэдээний гарчиг' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Шинэ мэдээллийн гарчиг: Унших' })).toHaveAttribute(
      'href',
      '/news/shine-medeelel'
    );
    expect(screen.getByText('Мэдээлэл', { selector: 'span' })).toBeInTheDocument();
    expect(screen.getByText('2026-07-31')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Мэдээ' }));
    expect(await screen.findByRole('link', { name: 'Шинэ мэдээний гарчиг' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Шинэ мэдээллийн гарчиг' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Мэдээ' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: 'Мэдээ' })).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(screen.getByRole('button', { name: 'Сургалт' }));
    expect(await screen.findByRole('link', { name: 'Шинэ сургалтын гарчиг' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Сургалт' })).toHaveAttribute(
      'aria-current',
      'page'
    );
    expect(screen.getByRole('button', { name: 'Сургалт' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
  });

  it('shows an explicit error and retries the request', async () => {
    vi.mocked(getPublicNews)
      .mockRejectedValueOnce(new Error('unavailable'))
      .mockResolvedValueOnce([]);

    render(
      <MemoryRouter>
        <NewsGrid />
      </MemoryRouter>
    );

    expect(await screen.findByText('Мэдээллийг ачаалж чадсангүй.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Дахин оролдох' }));
    expect(await screen.findByText('Одоогоор нийтлэгдсэн мэдээлэл алга.')).toBeInTheDocument();
    expect(getPublicNews).toHaveBeenCalledTimes(2);
  });
});
