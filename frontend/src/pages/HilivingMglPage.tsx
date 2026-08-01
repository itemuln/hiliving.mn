import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { getPublicContentPages } from '../api/contentApi';
import { Container } from '../components/layout/Container';
import { Footer } from '../components/layout/Footer';
import { Header } from '../components/layout/Header';
import { MobileBottomNav } from '../components/layout/MobileBottomNav';
import type { ContentPage } from '../features/admin/admin.types';

export function HilivingMglPage() {
  const { sectionSlug } = useParams();
  const [pages, setPages] = useState<ContentPage[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [requestVersion, setRequestVersion] = useState(0);

  useEffect(() => {
    let active = true;
    setPages(null);
    setLoadFailed(false);
    void getPublicContentPages().then(
      (contentPages) => {
        if (active) setPages(contentPages);
      },
      () => {
        if (active) setLoadFailed(true);
      }
    );
    return () => {
      active = false;
    };
  }, [requestVersion]);

  const activePage = pages?.find((page) => page.slug === sectionSlug);

  if (pages?.length && !sectionSlug) {
    return <Navigate to={`/hiliving-mgl/${pages[0].slug}`} replace />;
  }

  return (
    <div className="min-h-screen bg-white pb-20 md:pb-0">
      <Header />
      <main className="pb-16 pt-8 md:pb-24 md:pt-12">
        <Container>
          <div className="grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-12 xl:grid-cols-[260px_minmax(0,1fr)] xl:gap-16">
            <aside>
              <h1 className="text-xl font-bold uppercase tracking-[0.02em] text-brand-500 md:text-2xl">
                Hiliving MGL
              </h1>
              {pages?.length ? (
                <nav
                  aria-label="Hiliving MGL дэд цэс"
                  className="mt-5 grid grid-cols-2 border-y border-neutral-100 sm:grid-cols-4 lg:mt-7 lg:block lg:border-0"
                >
                  {pages.map((page) => {
                    const selected = page.slug === activePage?.slug;
                    return (
                      <Link
                        key={page.id}
                        to={`/hiliving-mgl/${page.slug}`}
                        aria-current={selected ? 'page' : undefined}
                        className={`flex min-h-12 items-center justify-center px-3 py-3 text-center text-[11px] uppercase tracking-wide transition lg:justify-start lg:px-6 lg:text-left lg:text-sm ${
                          selected
                            ? 'bg-brand-500 font-medium text-white'
                            : 'text-neutral-400 hover:bg-brand-50 hover:text-brand-500'
                        }`}
                      >
                        {page.navigationLabel}
                      </Link>
                    );
                  })}
                </nav>
              ) : null}
            </aside>

            <section aria-live="polite" aria-busy={pages === null && !loadFailed}>
              {pages === null && !loadFailed ? (
                <div aria-label="Хуудас ачаалж байна" className="animate-pulse space-y-5">
                  <div className="h-8 w-48 rounded bg-neutral-100" />
                  <div className="h-72 rounded-xl bg-neutral-100" />
                </div>
              ) : null}

              {loadFailed ? (
                <div role="alert" className="border-y border-neutral-200 py-16 text-center">
                  <h2 className="text-xl font-semibold text-neutral-900">
                    Хуудсыг ачаалж чадсангүй
                  </h2>
                  <button
                    type="button"
                    onClick={() => setRequestVersion((version) => version + 1)}
                    className="mt-5 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-600"
                  >
                    Дахин оролдох
                  </button>
                </div>
              ) : null}

              {pages?.length === 0 ? (
                <div className="border-y border-neutral-200 py-16">
                  <h2 className="text-xl font-semibold text-neutral-900">
                    Одоогоор нийтэлсэн мэдээлэл алга
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-neutral-500">
                    Hiliving MGL-ийн мэдээлэл бэлтгэгдэж байна.
                  </p>
                </div>
              ) : null}

              {pages?.length && sectionSlug && !activePage ? (
                <div className="border-y border-neutral-200 py-16">
                  <h2 className="text-xl font-semibold text-neutral-900">Хуудас олдсонгүй</h2>
                  <Link
                    to={`/hiliving-mgl/${pages[0].slug}`}
                    className="mt-4 inline-flex text-sm font-medium text-brand-600 underline underline-offset-4"
                  >
                    Hiliving MGL мэдээлэл рүү буцах
                  </Link>
                </div>
              ) : null}

              {activePage ? (
                <article>
                  <h2 className="border-b border-neutral-200 pb-6 text-2xl font-semibold tracking-tight text-neutral-900 md:text-3xl">
                    {activePage.title}
                  </h2>
                  <div
                    className="content-page-html mt-8"
                    dangerouslySetInnerHTML={{ __html: activePage.contentHtml }}
                  />
                </article>
              ) : null}
            </section>
          </div>
        </Container>
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
}
