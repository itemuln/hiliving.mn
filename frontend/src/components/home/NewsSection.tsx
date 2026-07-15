import { newsItems } from '../../data/homeData'
import { Container } from '../layout/Container'
import { NewsCard } from '../layout/ScrollToTop'
import { SectionReveal } from '../ui/SectionReveal'
import { SectionTitle } from '../ui/SectionTitle'

export function NewsSection() {
  return (
    <SectionReveal id="мэдээлэл" className="py-14 md:py-20">
      <Container>
        <SectionTitle accent="Мэдээллийн" suffix="булан" />
        <div className="mt-9 grid gap-10 md:mt-12 md:grid-cols-3 md:gap-8">
          {newsItems.map((item) => <NewsCard key={item.id} item={item} />)}
        </div>
      </Container>
    </SectionReveal>
  )
}
