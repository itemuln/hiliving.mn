import type { NewsItem } from '../../data/homeData'

interface NewsCardProps {
  item: NewsItem
}

export function NewsCard({ item }: NewsCardProps) {
  return (
    <article className="group min-w-0">
      <a href={`#news-${item.id}`} className="block overflow-hidden rounded-xl bg-neutral-100">
        <img src={item.image} alt={item.title} loading="lazy" decoding="async" className="aspect-[2.15/1] w-full object-cover transition-all duration-300 ease-out group-hover:scale-[1.025] motion-reduce:transform-none" />
      </a>
      <h3 className="mt-4 text-sm font-medium leading-snug text-neutral-700 md:text-base">
        <a href={`#news-${item.id}`} className="transition-colors duration-300 ease-out hover:text-brand-500">{item.title}</a>
      </h3>
      <p className="mt-1.5 text-xs leading-relaxed text-neutral-500 md:text-sm">{item.description}</p>
      <a href={`#news-${item.id}`} className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-brand-500 transition-all duration-300 ease-out hover:gap-2 hover:text-brand-600 md:text-sm">
        Унших <img src="/icons/arrow-right.svg" alt="" aria-hidden="true" className="h-3.5 w-3.5" />
      </a>
    </article>
  )
}
