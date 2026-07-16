import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getPublicNewsArticle } from '../api/contentApi';
import type { News } from '../features/admin/admin.types';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { MobileBottomNav } from '../components/layout/MobileBottomNav';
import { Container } from '../components/layout/Container';
export function NewsDetailPage() {
  const { newsSlug } = useParams();
  const [article, setArticle] = useState<News | null | undefined>();
  useEffect(() => {
    if (newsSlug)
      void getPublicNewsArticle(newsSlug)
        .then(setArticle)
        .catch(() => setArticle(null));
  }, [newsSlug]);
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="py-12 md:py-20">
        <Container>
          {article === undefined ? (
            <div className="h-80 animate-pulse rounded-2xl bg-neutral-100" />
          ) : article === null ? (
            <div className="py-24 text-center">
              <h1 className="text-2xl font-bold">Мэдээ олдсонгүй</h1>
            </div>
          ) : (
            <article className="mx-auto max-w-3xl">
              {article.thumbnailUrl && (
                <img
                  src={article.thumbnailUrl}
                  alt=""
                  className="mb-8 aspect-[2/1] w-full rounded-2xl object-cover"
                />
              )}
              <p className="text-sm text-brand-500">
                {article.publishedAt
                  ? new Date(article.publishedAt).toLocaleDateString('mn-MN')
                  : ''}
              </p>
              <h1 className="mt-3 text-3xl font-black text-neutral-900 md:text-5xl">
                {article.title}
              </h1>
              <p className="mt-5 text-lg text-neutral-500">{article.summary}</p>
              <div className="mt-10 whitespace-pre-wrap leading-8 text-neutral-700">
                {article.content}
              </div>
            </article>
          )}
        </Container>
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
}
