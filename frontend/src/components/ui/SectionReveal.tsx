import { useEffect, useRef, useState, type PropsWithChildren } from 'react';

interface SectionRevealProps extends PropsWithChildren {
  readonly className?: string;
  readonly id?: string;
}

export function SectionReveal({ children, className = '', id }: Readonly<SectionRevealProps>) {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(
    () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
  );

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || isVisible) return;

    if (!('IntersectionObserver' in window)) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setIsVisible(true);
        observer.disconnect();
      },
      { threshold: 0.14 }
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, [isVisible]);

  return (
    <section
      ref={sectionRef}
      id={id}
      className={`section-reveal ${isVisible ? 'section-reveal--visible' : ''} ${className}`}
    >
      {children}
    </section>
  );
}
