interface CarouselControlsProps {
  // carousel control previous and next to be implemented later on when there are multiple carousels
  readonly onPrevious: () => void 
  readonly onNext: () => void
  readonly variant?: 'overlay' | 'outside'
}

export function CarouselControls({ onPrevious, onNext, variant = 'overlay' }: CarouselControlsProps) {
  const base =
    'pointer-events-auto flex h-8 w-8 items-center justify-center rounded-full border transition-all duration-300 ease-out motion-reduce:transition-none md:h-10 md:w-10'
  const variantClass =
    variant === 'overlay'
      ? 'border-white/60 bg-white/90 text-neutral-500 shadow-sm hover:scale-105 hover:bg-white'
      : 'border-neutral-300 bg-white text-neutral-500 hover:border-brand-400 hover:text-brand-500'

  return (
    <>
      <button type="button" className={`${base} ${variantClass}`} onClick={onPrevious} aria-label="Өмнөх слайд">
        <img src="/icons/chevron-left.svg" alt="" aria-hidden="true" className="h-5 w-5 md:h-6 md:w-6" />
      </button>
      <button type="button" className={`${base} ${variantClass}`} onClick={onNext} aria-label="Дараагийн слайд">
        <img src="/icons/chevron-right.svg" alt="" aria-hidden="true" className="h-5 w-5 md:h-6 md:w-6" />
      </button>
    </>
  )
}
