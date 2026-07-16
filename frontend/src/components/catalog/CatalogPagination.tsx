import { Link, useLocation, useSearchParams } from 'react-router-dom';

interface CatalogPaginationProps {
  readonly currentPage: number;
  readonly totalPages: number;
}

type PageItem = number | string;

function getPageItems(currentPage: number, totalPages: number): PageItem[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const visiblePages = Array.from(
    new Set([1, currentPage - 1, currentPage, currentPage + 1, totalPages])
  )
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((first, second) => first - second);
  const pageItems: PageItem[] = [];

  visiblePages.forEach((page, index) => {
    const previousPage = visiblePages[index - 1];
    if (previousPage && page - previousPage > 1) {
      pageItems.push(`ellipsis-${previousPage}-${page}`);
    }
    pageItems.push(page);
  });

  return pageItems;
}

const linkClassName =
  'flex h-9 min-w-9 items-center justify-center border px-2 text-xs transition-colors duration-200';

export function CatalogPagination({ currentPage, totalPages }: CatalogPaginationProps) {
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();

  if (totalPages <= 1) return null;

  const getPageHref = (page: number) => {
    const nextSearchParams = new URLSearchParams(searchParams);
    if (page === 1) {
      nextSearchParams.delete('page');
    } else {
      nextSearchParams.set('page', String(page));
    }
    const query = nextSearchParams.toString();
    return query ? `${pathname}?${query}` : pathname;
  };

  const scrollToCatalog = () => {
    document.getElementById('catalog-products')?.scrollIntoView({ block: 'start' });
  };

  return (
    <nav
      aria-label="Бүтээгдэхүүний хуудас"
      className="mt-12 flex items-center justify-center gap-1.5 md:mt-14"
    >
      {currentPage > 1 ? (
        <Link
          to={getPageHref(currentPage - 1)}
          onClick={scrollToCatalog}
          rel="prev"
          aria-label="Өмнөх хуудас"
          className={`${linkClassName} border-neutral-200 text-neutral-500 hover:border-brand-400 hover:text-brand-500`}
        >
          ‹
        </Link>
      ) : (
        <button
          type="button"
          disabled
          aria-label="Өмнөх хуудас"
          className={`${linkClassName} cursor-not-allowed border-neutral-100 text-neutral-300`}
        >
          ‹
        </button>
      )}

      {getPageItems(currentPage, totalPages).map((item) =>
        typeof item === 'number' ? (
          <Link
            key={item}
            to={getPageHref(item)}
            onClick={scrollToCatalog}
            aria-current={item === currentPage ? 'page' : undefined}
            aria-label={`${item}-р хуудас`}
            className={`${linkClassName} ${
              item === currentPage
                ? 'border-brand-500 bg-brand-500 font-medium text-white'
                : 'border-neutral-200 text-neutral-500 hover:border-brand-400 hover:text-brand-500'
            }`}
          >
            {item}
          </Link>
        ) : (
          <span
            key={item}
            aria-hidden="true"
            className="flex h-9 min-w-5 items-center justify-center text-neutral-300"
          >
            …
          </span>
        )
      )}

      {currentPage < totalPages ? (
        <Link
          to={getPageHref(currentPage + 1)}
          onClick={scrollToCatalog}
          rel="next"
          aria-label="Дараах хуудас"
          className={`${linkClassName} border-neutral-200 text-neutral-500 hover:border-brand-400 hover:text-brand-500`}
        >
          ›
        </Link>
      ) : (
        <button
          type="button"
          disabled
          aria-label="Дараах хуудас"
          className={`${linkClassName} cursor-not-allowed border-neutral-100 text-neutral-300`}
        >
          ›
        </button>
      )}
    </nav>
  );
}
