import { useEffect, useState } from 'react';
import { getPublicNews } from '../../api/contentApi';
import type { News } from '../../features/admin/admin.types';
import { Container } from '../layout/Container';
import { NewsCard } from './NewsCard';

const informationSections = ['Мэдээ', 'Мэдээлэл', 'Сургалт'] as const;

export function NewsGrid() {
  const [items, setItems] = useState<News[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [requestVersion, setRequestVersion] = useState(0);

  useEffect(() => {
    let isCurrent = true;

    setItems(null);
    setLoadFailed(false);
    void getPublicNews()
      .then((news) => {
        if (isCurrent) setItems(news);
      })
      .catch(() => {
        if (isCurrent) setLoadFailed(true);
      });

    return () => {
      isCurrent = false;
    };
  }, [requestVersion]);

  return (
    <section
      aria-labelledby="news-page-title"
      className="pb-16 pt-8 md:pb-20 md:pt-12 lg:pb-24 lg:pt-14"
    >
      <Container>
        <div className="grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-12 xl:grid-cols-[260px_minmax(0,1fr)] xl:gap-16">
          <aside>
            <h1
              id="news-page-title"
              className="text-xl font-bold uppercase tracking-[0.02em] text-brand-500 md:text-2xl"
            >
              Мэдээлэл
            </h1>
            <nav
              aria-label="Мэдээллийн дэд цэс"
              className="mt-5 grid grid-cols-3 border-y border-neutral-100 lg:mt-7 lg:block lg:border-0"
            >
              {informationSections.map((section) => {
                const isActive = section === 'Мэдээлэл';
                return (
                  <span
                    key={section}
                    aria-current={isActive ? 'page' : undefined}
                    className={`flex min-h-12 items-center justify-center px-3 py-3 text-center text-xs uppercase tracking-wide lg:justify-start lg:px-6 lg:text-left lg:text-sm ${
                      isActive
                        ? 'bg-brand-500 font-medium text-white'
                        : 'text-neutral-400'
                    }`}
                  >
                    {section}
                  </span>
                );
              })}
            </nav>
          </aside>

          <div aria-live="polite" aria-busy={items === null && !loadFailed}>
            {items === null && !loadFailed ? (
              <div className="space-y-5" aria-label="Мэдээлэл ачаалж байна">
                {[0, 1, 2, 3].map((item) => (
                  <div key={item} className="flex animate-pulse gap-4 sm:gap-6">
                    <div className="h-24 w-28 shrink-0 rounded-lg bg-neutral-100 sm:h-32 sm:w-44" />
                    <div className="flex-1 py-1">
                      <div className="h-4 w-full rounded bg-neutral-100" />
                      <div className="mt-3 h-4 w-2/3 rounded bg-neutral-100" />
                      <div className="mt-5 h-3 w-24 rounded bg-neutral-100" />
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            {loadFailed ? (
              <div className="rounded-xl border border-brand-100 bg-brand-50/40 px-5 py-12 text-center">
                <p className="text-sm text-neutral-600">Мэдээллийг ачаалж чадсангүй.</p>
                <button
                  type="button"
                  onClick={() => setRequestVersion((version) => version + 1)}
                  className="mt-4 rounded-md bg-brand-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-600"
                >
                  Дахин оролдох
                </button>
              </div>
            ) : null}

            {items?.length === 0 ? (
              <p className="py-16 text-center text-neutral-500">
                Одоогоор нийтлэгдсэн мэдээлэл алга.
              </p>
            ) : null}

            {items?.length ? (
              <div className="divide-y divide-neutral-100">
                {items.map((article, index) => (
                  <NewsCard
                    key={article.id}
                    article={{
                      slug: article.slug,
                      title: article.title,
                      image: article.thumbnailUrl ?? '/news-team.svg',
                      category: article.category,
                      publishedAt: article.publishedAt,
                    }}
                    imageLoading={index < 3 ? 'eager' : 'lazy'}
                  />
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </Container>
    </section>
  );
}
