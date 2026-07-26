import { lazy, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { CategorySection } from '../components/home/CategorySection';
import { HeroCarousel } from '../components/home/HeroCarousel';
import { ProductSection } from '../components/home/ProductSection';
import { Footer } from '../components/layout/Footer';
import { Header } from '../components/layout/Header';
import { MobileBottomNav } from '../components/layout/MobileBottomNav';
import { DeferredContent } from '../components/ui/DeferredContent';

const PromotionalBanner = lazy(() =>
  import('../components/home/PromotionalBanner').then((module) => ({
    default: module.PromotionalBanner,
  }))
);
const NewsSection = lazy(() =>
  import('../components/home/NewsSection').then((module) => ({ default: module.NewsSection }))
);
const BrandsSection = lazy(() =>
  import('../components/home/BrandsSection').then((module) => ({ default: module.BrandsSection }))
);

export function HomePage() {
  const { hash } = useLocation();

  useEffect(() => {
    if (hash !== '#hiliving-mgl') return;
    document.getElementById('hiliving-mgl')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [hash]);

  return (
    <div id="top" className="min-h-screen bg-white">
      <Header />
      <main id="hiliving-mgl">
        <HeroCarousel />
        <CategorySection />
        <ProductSection />
        <DeferredContent fallbackClassName="min-h-[180px] bg-neutral-50 sm:min-h-[260px] md:min-h-[330px]">
          <PromotionalBanner />
        </DeferredContent>
        <DeferredContent fallbackClassName="min-h-[1105px] md:min-h-[558px]">
          <NewsSection />
        </DeferredContent>
        <DeferredContent fallbackClassName="min-h-[339px] md:min-h-[272px]">
          <BrandsSection />
        </DeferredContent>
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
}
