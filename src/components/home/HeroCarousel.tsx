import { useCallback, useEffect, useRef, useState } from 'react'
import Autoplay from 'embla-carousel-autoplay'
import useEmblaCarousel from 'embla-carousel-react'
import { motion, useReducedMotion } from 'motion/react'
import { heroBanners } from '../../data/homeData'
import { CarouselControls } from '../ui/CarouselControls'

export function HeroCarousel() {
  const autoplay = useRef(Autoplay({ delay: 5000, stopOnInteraction: false, stopOnMouseEnter: true }))
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [autoplay.current])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const shouldReduceMotion = useReducedMotion()

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

  useEffect(() => {
    if (shouldReduceMotion) {
      autoplay.current.stop()
      setIsPlaying(false)
    }
  }, [shouldReduceMotion])

  const toggleAutoplay = () => {
    if (isPlaying) {
      autoplay.current.stop()
    } else {
      autoplay.current.play()
    }
    setIsPlaying((current) => !current)
  }

  return (
    <section aria-label="Онцлох урамшуулал" className="relative overflow-hidden bg-neutral-100">
      <div ref={emblaRef} className="overflow-hidden">
        <div className="flex touch-pan-y">
          {heroBanners.map((banner, index) => (
            <div key={banner.id} className="min-w-0 flex-[0_0_100%]">
              <motion.div
                animate={selectedIndex === index && !shouldReduceMotion ? { opacity: [0.84, 1], scale: [1.006, 1] } : { opacity: 1, scale: 1 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
              >
                <img src={banner.image} alt={banner.alt} className="h-[170px] w-full object-fill sm:h-[260px] md:h-[340px] md:object-cover lg:h-[390px]" />
              </motion.div>
            </div>
          ))}
        </div>
      </div>

      <div className="pointer-events-none absolute inset-y-0 left-0 right-2 flex items-center justify-between md:left-6 md:right-6">
        <CarouselControls onPrevious={() => emblaApi?.scrollPrev()} onNext={() => emblaApi?.scrollNext()} />
      </div>

      <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-black/35 py-1 pl-3 pr-1.5 text-xs text-white backdrop-blur-sm md:bottom-5">
        <span>{selectedIndex + 1} / {heroBanners.length}</span>
        <button type="button" onClick={toggleAutoplay} className="flex h-6 w-6 items-center justify-center rounded-full transition-all duration-300 ease-out hover:bg-white/20" aria-label={isPlaying ? 'Автомат сэлгэлтийг түр зогсоох' : 'Автомат сэлгэлтийг үргэлжлүүлэх'}>
          <img src={isPlaying ? '/icons/pause.svg' : '/icons/play.svg'} alt="" aria-hidden="true" className="h-3.5 w-3.5 invert" />
        </button>
      </div>
    </section>
  )
}
