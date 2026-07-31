import { useEffect, useRef } from 'react';

interface AnimatedCartIconProps {
  readonly itemCount: number;
  readonly className?: string;
}

export function AnimatedCartIcon({ itemCount, className = 'h-5 w-5' }: AnimatedCartIconProps) {
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const previousCountRef = useRef(itemCount);

  useEffect(() => {
    const previousCount = previousCountRef.current;
    previousCountRef.current = itemCount;
    if (itemCount <= previousCount) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

    wrapperRef.current?.animate(
      [
        { transform: 'translateY(0) scale(1)' },
        { transform: 'translateY(-3px) scale(1.12)' },
        { transform: 'translateY(0) scale(1)' },
      ],
      { duration: 320, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }
    );
  }, [itemCount]);

  return (
    <span ref={wrapperRef} className="block will-change-transform">
      <img src="/icons/cart.svg" alt="" aria-hidden="true" className={className} />
    </span>
  );
}
