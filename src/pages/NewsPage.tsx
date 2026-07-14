import { HeroCarousel } from '../components/home/HeroCarousel'
import { Footer } from '../components/layout/Footer'
import { Header } from '../components/layout/Header'
import { MobileBottomNav } from '../components/layout/MobileBottomNav'
import { NewsGrid } from '../components/news/NewsGrid'

export function NewsPage() {
  return (
    <div id="top" className="min-h-screen bg-white">
      <Header />
      <main>
        <HeroCarousel />
        <NewsGrid />
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  )
}
