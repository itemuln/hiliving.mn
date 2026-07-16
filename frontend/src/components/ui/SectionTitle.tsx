interface SectionTitleProps {
  readonly accent: string;
  readonly suffix?: string;
}

export function SectionTitle({ accent, suffix }: SectionTitleProps) {
  return (
    <h2 className="text-center text-[22px] font-light tracking-tight text-neutral-400 md:text-[28px]">
      <span className="text-brand-500">{accent}</span>
      {suffix ? ` ${suffix}` : ''}
    </h2>
  );
}
