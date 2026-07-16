import { useEffect, useState } from 'react'
import { getPublicNews } from '../../api/contentApi'
import type { News } from '../../features/admin/admin.types'
import { Container } from '../layout/Container'
import { NewsCard } from '../layout/ScrollToTop'
import { SectionReveal } from '../ui/SectionReveal'
import { SectionTitle } from '../ui/SectionTitle'

export function NewsSection() {
  const [items, setItems] = useState<News[]>([])
  useEffect(() => { void getPublicNews().then((news) => setItems(news.slice(0, 3))).catch(() => setItems([])) }, [])
  return (
    <SectionReveal id="мэдээлэл" className="py-14 md:py-20">
      <Container>
        <SectionTitle accent="Мэдээллийн" suffix="булан" />
        <div className="mt-9 grid gap-10 md:mt-12 md:grid-cols-3 md:gap-8">
          {items.map((item) => <NewsCard key={item.id} item={{ id: String(item.id), title: item.title, description: item.summary, image: item.thumbnailUrl ?? '/news-team.svg', slug: item.slug }} />)}
        </div>
      </Container>
    </SectionReveal>
  )
}
