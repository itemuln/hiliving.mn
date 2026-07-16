import type { PropsWithChildren } from 'react';
import { motion, useReducedMotion } from 'motion/react';

interface SectionRevealProps extends PropsWithChildren {
  readonly className?: string;
  readonly id?: string;
}

export function SectionReveal({ children, className = '', id }: Readonly<SectionRevealProps>) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.section
      id={id}
      className={className}
      initial={shouldReduceMotion ? false : { opacity: 0, y: 22 }}
      whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.14 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      {children}
    </motion.section>
  );
}
