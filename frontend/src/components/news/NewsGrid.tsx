import { useEffect, useState } from 'react';
import { getPublicNews } from '../../api/contentApi';
import type { News } from '../../features/admin/admin.types';
import { Container } from '../layout/Container';
import { NewsCard } from './NewsCard';

export function NewsGrid() {
  const [items, setItems] = useState<News[] | null>(null);
  useEffect(() => {
    void getPublicNews()
      .then(setItems)
      .catch(() => setItems([]));
  }, []);
  return (
    <section
      aria-labelledby="news-page-title"
      className="pb-20 pt-8 md:pb-24 md:pt-14 lg:pb-28 lg:pt-16"
    >
      <Container className="px-[30px] sm:px-8 lg:px-10">
        <h1 id="news-page-title" className="sr-only">
          Мэдээлэл
        </h1>
        <div className="mx-auto grid max-w-[1160px] grid-cols-1 gap-y-7 md:grid-cols-2 md:gap-x-8 md:gap-y-14 lg:grid-cols-3 lg:gap-x-10 lg:gap-y-16">
          {(items ?? []).map((article, index) => (
            <NewsCard
              key={article.id}
              article={{
                id: String(article.id),
                slug: article.slug,
                title: article.title,
                description: article.summary,
                image: article.thumbnailUrl ?? '/news-team.svg',
              }}
              imageLoading={index < 3 ? 'eager' : 'lazy'}
              className={index >= 4 ? 'hidden md:block' : ''}
            />
          ))}
          {items?.length === 0 && (
            <p className="col-span-full py-16 text-center text-neutral-500">
              Одоогоор нийтлэгдсэн мэдээ алга.
            </p>
          )}
        </div>
      </Container>
    </section>
  );
}
