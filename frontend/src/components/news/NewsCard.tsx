import { Link } from 'react-router-dom';
import {
  NEWS_CATEGORY_LABELS,
  type NewsCategory,
} from '../../features/news/newsCategories';

type NewsArticle = {
  readonly slug: string;
  readonly title: string;
  readonly image: string;
  readonly category: NewsCategory;
  readonly publishedAt: string | null;
};

type NewsCardProps = {
  readonly article: NewsArticle;
  readonly imageLoading?: 'eager' | 'lazy';
  readonly className?: string;
};

export function NewsCard({ article, imageLoading = 'lazy', className = '' }: NewsCardProps) {
  return (
    <article
      className={`group flex min-w-0 gap-4 py-5 first:pt-0 sm:gap-6 sm:py-6 ${className}`}
    >
      <Link
        to={`/news/${article.slug}`}
        tabIndex={-1}
        aria-hidden="true"
        className="h-24 w-28 shrink-0 overflow-hidden rounded-lg bg-neutral-100 sm:h-32 sm:w-44"
      >
        <img
          src={article.image}
          alt=""
          loading={imageLoading}
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.02] motion-reduce:transform-none"
        />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col py-0.5 sm:py-1">
        <h2>
          <Link
            to={`/news/${article.slug}`}
            className="font-serif text-[15px] font-bold leading-[1.2] text-neutral-900 transition-colors hover:text-brand-500 sm:text-[19px] lg:text-[22px]"
          >
            {article.title}
          </Link>
        </h2>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-x-5 gap-y-2">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[11px] text-neutral-400 sm:text-xs">
            <span>{NEWS_CATEGORY_LABELS[article.category]}</span>
            {article.publishedAt ? (
              <time dateTime={article.publishedAt}>{article.publishedAt.slice(0, 10)}</time>
            ) : null}
          </div>
          <Link
            to={`/news/${article.slug}`}
            aria-label={`${article.title}: Унших`}
            className="ml-auto text-xs font-medium text-brand-500 transition-colors hover:text-brand-600 hover:underline sm:text-sm"
          >
            Унших
          </Link>
        </div>
      </div>
    </article>
  );
}
