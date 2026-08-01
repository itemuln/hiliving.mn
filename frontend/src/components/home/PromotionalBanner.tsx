import { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { getPublicBanners } from '../../api/contentApi';
import type { Banner } from '../../features/admin/admin.types';
import { CatalogErrorState } from '../catalog/CatalogErrorState';
import { CarouselControls } from '../ui/CarouselControls';

export function PromotionalBanner() {
  const [banners, setBanners] = useState<Banner[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const load = useCallback(() => {
    setFailed(false);
    void getPublicBanners('PROMOTIONAL').then(setBanners, () => {
      setBanners(null);
      setFailed(true);
    });
  }, []);

  useEffect(load, [load]);

  const onSelect = useCallback(() => {
    if (emblaApi) setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi, onSelect]);

  if (failed) {
    return (
      <div className="mx-auto w-full max-w-[1440px] px-4 py-3 sm:px-6 lg:px-10">
        <CatalogErrorState compact onRetry={load} />
      </div>
    );
  }
  if (banners === null) {
    return (
      <div
        className="mx-auto h-[170px] w-full max-w-[1440px] animate-pulse bg-neutral-100 sm:aspect-[24/5] sm:h-auto"
        aria-label="Доод баннер ачаалж байна"
      />
    );
  }
  if (banners.length === 0) return null;

  return (
    <section aria-label="Нэмэлт урамшуулал">
      <div className="relative mx-auto w-full max-w-[1440px] overflow-hidden">
        <div ref={emblaRef} className="overflow-hidden">
          <div className="flex touch-pan-y">
            {banners.map((banner) => (
              <div key={banner.id} className="min-w-0 flex-[0_0_100%]">
                <picture>
                  {banner.mobileImageUrl ? (
                    <source media="(max-width: 639px)" srcSet={banner.mobileImageUrl} />
                  ) : null}
                  <img
                    src={banner.imageUrl}
                    alt={banner.title}
                    loading="lazy"
                    decoding="async"
                    className="h-[170px] w-full object-cover sm:h-auto sm:aspect-[24/5]"
                  />
                </picture>
              </div>
            ))}
          </div>
        </div>
        <div className="pointer-events-none absolute inset-y-0 left-4 right-4 flex items-center justify-between">
          <CarouselControls
            onPrevious={() => emblaApi?.scrollPrev()}
            onNext={() => emblaApi?.scrollNext()}
          />
        </div>
        <div className="absolute bottom-6 right-8 rounded-full bg-black/35 px-3 py-1 text-xs text-white backdrop-blur-sm sm:bottom-7">
          {selectedIndex + 1} / {banners.length}
        </div>
      </div>
    </section>
  );
}
