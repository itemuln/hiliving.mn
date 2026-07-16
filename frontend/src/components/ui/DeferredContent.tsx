import { Suspense, useEffect, useRef, useState, type PropsWithChildren } from 'react';

interface DeferredContentProps extends PropsWithChildren {
  readonly fallbackClassName: string;
  readonly rootMargin?: string;
}

export function DeferredContent({
  children,
  fallbackClassName,
  rootMargin = '500px 0px',
}: Readonly<DeferredContentProps>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (!('IntersectionObserver' in window)) {
      setShouldRender(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setShouldRender(true);
        observer.disconnect();
      },
      { rootMargin }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, [rootMargin]);

  const fallback = <div aria-hidden="true" className={fallbackClassName} />;

  return (
    <div ref={containerRef}>
      {shouldRender ? <Suspense fallback={fallback}>{children}</Suspense> : fallback}
    </div>
  );
}
