import { BrandsSection } from '../components/home/BrandsSection'
import { CategorySection } from '../components/home/CategorySection'
import { HeroCarousel } from '../components/home/HeroCarousel'
import { NewsSection } from '../components/home/NewsSection'
import { ProductSection } from '../components/home/ProductSection'
import { PromotionalBanner } from '../components/home/PromotionalBanner'
import { Footer } from '../components/layout/Footer'
import { Header } from '../components/layout/Header'
import { MobileBottomNav } from '../components/layout/MobileBottomNav'

export function HomePage() {
  return (
    <div id="top" className="min-h-screen bg-white">
      <Header />
      <main>
        <HeroCarousel />
        <CategorySection />
        <ProductSection />
        <PromotionalBanner />
        <NewsSection />
        <BrandsSection />
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  )
}
