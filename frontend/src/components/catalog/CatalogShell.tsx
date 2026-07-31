import { Suspense } from 'react';
import { Outlet } from 'react-router';
import { HeroCarousel } from '../home/HeroCarousel';
import { Footer } from '../layout/Footer';
import { Header } from '../layout/Header';
import { MobileBottomNav } from '../layout/MobileBottomNav';

export function CatalogShell() {
  return (
    <div id="top" className="min-h-screen bg-white">
      <Header />
      <main>
        <HeroCarousel />
        <div id="catalog-products">
          <Suspense
            fallback={
              <div
                className="min-h-[640px] animate-pulse bg-neutral-50"
                aria-label="Каталог уншиж байна"
              />
            }
          >
            <Outlet />
          </Suspense>
        </div>
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
}
