import { newsArticles } from '../../data/news'
import { Container } from '../layout/Container'
import { NewsCard } from './NewsCard'

export function NewsGrid() {
  return (
    <section aria-labelledby="news-page-title" className="pb-20 pt-8 md:pb-24 md:pt-14 lg:pb-28 lg:pt-16">
      <Container className="px-[30px] sm:px-8 lg:px-10">
        <h1 id="news-page-title" className="sr-only">
          Мэдээлэл
        </h1>
        <div className="mx-auto grid max-w-[1160px] grid-cols-1 gap-y-7 md:grid-cols-2 md:gap-x-8 md:gap-y-14 lg:grid-cols-3 lg:gap-x-10 lg:gap-y-16">
          {newsArticles.map((article, index) => (
            <NewsCard
              key={article.id}
              article={article}
              imageLoading={index < 3 ? 'eager' : 'lazy'}
              className={index >= 4 ? 'hidden md:block' : ''}
            />
          ))}
        </div>
      </Container>
    </section>
  )
}
