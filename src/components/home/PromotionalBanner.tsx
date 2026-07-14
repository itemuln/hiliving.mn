import { useCallback, useEffect, useState } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { promotionalBanners } from '../../data/homeData'
import { CarouselControls } from '../ui/CarouselControls'

export function PromotionalBanner() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true })
  const [selectedIndex, setSelectedIndex] = useState(0)

  const onSelect = useCallback(() => {
    if (emblaApi) setSelectedIndex(emblaApi.selectedScrollSnap())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    onSelect()
    emblaApi.on('select', onSelect)
    return () => {
      emblaApi.off('select', onSelect)
    }
  }, [emblaApi, onSelect])

  return (
    <section aria-label="Нэмэлт урамшуулал" className="relative overflow-hidden">
      <div ref={emblaRef} className="overflow-hidden">
        <div className="flex touch-pan-y">
          {promotionalBanners.map((banner) => (
            <div key={banner.id} className="min-w-0 flex-[0_0_100%]">
              <img src={banner.image} alt={banner.alt} loading="lazy" decoding="async" className="h-[180px] w-full object-fill sm:h-[260px] md:h-[330px] md:object-cover" />
            </div>
          ))}
        </div>
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-1 right-2 flex items-center justify-between md:left-7 md:right-7">
        <CarouselControls onPrevious={() => emblaApi?.scrollPrev()} onNext={() => emblaApi?.scrollNext()} />
      </div>
      <div className="absolute bottom-3 right-4 rounded-full bg-black/35 px-3 py-1 text-xs text-white backdrop-blur-sm md:bottom-5 md:right-8">
        {selectedIndex + 1} / {promotionalBanners.length}
      </div>
    </section>
  )
}
