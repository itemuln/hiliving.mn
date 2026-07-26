import { memo, useCallback, useEffect, useRef, useState } from 'react';
import Autoplay from 'embla-carousel-autoplay';
import useEmblaCarousel from 'embla-carousel-react';
import { motion, useReducedMotion } from 'motion/react';
import { getPublicBanners } from '../../api/contentApi';
import type { Banner } from '../../features/admin/admin.types';
import { CarouselControls } from '../ui/CarouselControls';

const heroEntranceState = { opacity: 0.84, scale: 1.006 };
const heroRestingState = { opacity: 1, scale: 1 };
const heroEntranceTransition = { duration: 0.35, ease: 'easeOut' as const };
const heroSessionStorageKey = 'hiliving.hero.v1';

type HeroBanner = Pick<Banner, 'id' | 'title' | 'imageUrl' | 'mobileImageUrl'>;

interface HeroSession {
  banners: HeroBanner[];
  selectedBannerId: number | null;
  hasAnimated: boolean;
}

const emptyHeroSession = (): HeroSession => ({
  banners: [],
  selectedBannerId: null,
  hasAnimated: false,
});

const isHeroBanner = (value: unknown): value is HeroBanner => {
  if (!value || typeof value !== 'object') return false;
  const banner = value as Record<string, unknown>;
  return (
    typeof banner.id === 'number' &&
    typeof banner.title === 'string' &&
    typeof banner.imageUrl === 'string' &&
    (banner.mobileImageUrl === null || typeof banner.mobileImageUrl === 'string')
  );
};

const readHeroSession = (): HeroSession => {
  try {
    const parsed = JSON.parse(sessionStorage.getItem(heroSessionStorageKey) ?? 'null') as unknown;
    if (!parsed || typeof parsed !== 'object') return emptyHeroSession();
    const session = parsed as Record<string, unknown>;
    if (!Array.isArray(session.banners) || !session.banners.every(isHeroBanner)) {
      return emptyHeroSession();
    }
    return {
      banners: session.banners,
      selectedBannerId:
        typeof session.selectedBannerId === 'number' ? session.selectedBannerId : null,
      hasAnimated: session.hasAnimated === true,
    };
  } catch {
    return emptyHeroSession();
  }
};

const updateHeroSession = (update: Partial<HeroSession>) => {
  try {
    sessionStorage.setItem(
      heroSessionStorageKey,
      JSON.stringify({ ...readHeroSession(), ...update })
    );
  } catch {
    // The API remains authoritative when browser storage is unavailable.
  }
};

function HeroCarouselComponent() {
  const [initialSession] = useState(readHeroSession);
  const [banners, setBanners] = useState<HeroBanner[]>(initialSession.banners);
  const initialSelectedIndex = Math.max(
    0,
    initialSession.banners.findIndex((banner) => banner.id === initialSession.selectedBannerId)
  );
  const autoplay = useRef(
    Autoplay({ delay: 5000, stopOnInteraction: false, stopOnMouseEnter: true })
  );
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, startIndex: initialSelectedIndex }, [
    autoplay.current,
  ]);
  const [selectedIndex, setSelectedIndex] = useState(initialSelectedIndex);
  const [isPlaying, setIsPlaying] = useState(true);
  const shouldReduceMotion = useReducedMotion();
  const shouldAnimateEntrance = !initialSession.hasAnimated;

  useEffect(() => {
    void getPublicBanners()
      .then((freshBanners) => {
        setBanners(freshBanners);
        updateHeroSession({ banners: freshBanners });
      })
      .catch(() => undefined);
  }, []);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    const nextIndex = emblaApi.selectedScrollSnap();
    setSelectedIndex(nextIndex);
    updateHeroSession({ selectedBannerId: banners[nextIndex]?.id ?? null });
  }, [banners, emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi, onSelect]);

  useEffect(() => {
    if (shouldReduceMotion) {
      autoplay.current.stop();
      setIsPlaying(false);
    }
  }, [shouldReduceMotion]);

  useEffect(() => {
    if (banners.length > 0 && shouldAnimateEntrance) {
      updateHeroSession({ hasAnimated: true });
    }
  }, [banners.length, shouldAnimateEntrance]);

  const toggleAutoplay = () => {
    if (isPlaying) {
      autoplay.current.stop();
    } else {
      autoplay.current.play();
    }
    setIsPlaying((current) => !current);
  };

  return (
    <section aria-label="Онцлох урамшуулал" className="relative overflow-hidden bg-neutral-100">
      <div ref={emblaRef} className="overflow-hidden">
        <div className="flex touch-pan-y">
          {banners.map((banner, index) => (
            <div key={banner.id} className="min-w-0 flex-[0_0_100%]">
              <motion.div
                initial={
                  index === selectedIndex && shouldAnimateEntrance && !shouldReduceMotion
                    ? heroEntranceState
                    : false
                }
                animate={heroRestingState}
                transition={heroEntranceTransition}
              >
                <picture>
                  {banner.mobileImageUrl && (
                    <source media="(max-width: 639px)" srcSet={banner.mobileImageUrl} />
                  )}
                  <img
                    src={banner.imageUrl}
                    alt={banner.title}
                    loading={index === selectedIndex ? 'eager' : 'lazy'}
                    fetchPriority={index === selectedIndex ? 'high' : 'auto'}
                    decoding="async"
                    className="h-[170px] w-full object-fill sm:h-[260px] md:h-[340px] md:object-cover lg:h-[390px]"
                  />
                </picture>
              </motion.div>
            </div>
          ))}
        </div>
      </div>

      <div className="pointer-events-none absolute inset-y-0 left-0 right-2 flex items-center justify-between md:left-6 md:right-6">
        <CarouselControls
          onPrevious={() => emblaApi?.scrollPrev()}
          onNext={() => emblaApi?.scrollNext()}
        />
      </div>

      <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-black/35 py-1 pl-3 pr-1.5 text-xs text-white backdrop-blur-sm md:bottom-5">
        <span>
          {banners.length ? selectedIndex + 1 : 0} / {banners.length}
        </span>
        <button
          type="button"
          onClick={toggleAutoplay}
          className="flex h-6 w-6 items-center justify-center rounded-full transition-all duration-300 ease-out hover:bg-white/20"
          aria-label={
            isPlaying ? 'Автомат сэлгэлтийг түр зогсоох' : 'Автомат сэлгэлтийг үргэлжлүүлэх'
          }
        >
          <img
            src={isPlaying ? '/icons/pause.svg' : '/icons/play.svg'}
            alt=""
            aria-hidden="true"
            className="h-3.5 w-3.5 invert"
          />
        </button>
      </div>
    </section>
  );
}

export const HeroCarousel = memo(HeroCarouselComponent);
