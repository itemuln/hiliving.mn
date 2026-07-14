import { Link } from 'react-router-dom'
import type { NewsArticle } from '../../data/news'

type NewsCardProps = {
  readonly article: NewsArticle
  readonly imageLoading?: 'eager' | 'lazy'
  readonly className?: string
}

export function NewsCard({ article, imageLoading = 'lazy', className = '' }: NewsCardProps) {
  return (
    <article className={`group min-w-0 ${className}`}>
      <div className="aspect-[5/2] overflow-hidden rounded-[11px] bg-neutral-100 md:rounded-xl">
        <img
          src={article.image}
          alt={`${article.title} мэдээний зураг`}
          loading={imageLoading}
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.015] motion-reduce:transform-none"
        />
      </div>

      <div className="mt-5 px-2.5 md:px-6">
        <h2 className="text-[14px] font-normal leading-[1.15] text-neutral-800 md:text-[13px]">{article.title}</h2>
        <p className="mt-0.5 text-[14px] leading-[1.15] text-neutral-700 md:text-[13px]">{article.description}</p>
      </div>

      <div className="mt-3 flex justify-end pr-2 md:mt-3.5">
        <Link
          to={`/news/${article.slug}`}
          aria-label={`${article.title}: Унших`}
          className="rounded-sm text-[13px] font-medium text-brand-500 transition-colors duration-300 ease-out hover:text-brand-600 hover:underline focus-visible:bg-brand-50 md:text-xs"
        >
          Унших
        </Link>
      </div>
    </article>
  )
}
