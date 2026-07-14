import { Container } from './Container'
import { SubFooter } from './SubFooter'

const socialLinks = [
  { label: 'YouTube', icon: '/icons/youtube.svg' },
  { label: 'Instagram', icon: '/icons/instagram.svg' },
  { label: 'Facebook', icon: '/icons/facebook.svg' },
]

export function Footer() {
  return (
    <footer id="contact" className="mb-[74px] mt-16 bg-neutral-50 text-neutral-400 md:mb-0 md:mt-24">
      <div className="border-b border-neutral-200 bg-neutral-100/70 py-5">
        <Container className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <img src="/hiLivingLogo.svg" alt="Hiliving Mongolia" loading="lazy" decoding="async" className="h-auto w-[230px] opacity-90 md:w-[310px]" />
          <div className="flex gap-3">
            {socialLinks.map(({ label, icon }) => (
              <a key={label} href={`#${label.toLowerCase()}`} aria-label={label} className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500 text-white transition-all duration-300 ease-out hover:-translate-y-0.5 hover:bg-brand-600 motion-reduce:transform-none">
                {/* to be done */}
                <img src={icon} alt="" aria-hidden="true" loading="lazy" decoding="async" className="h-5 w-5 invert" />
              </a>
            ))}
          </div>
        </Container>
      </div>
      <Container className="grid gap-7 py-7 text-sm leading-relaxed md:grid-cols-[1fr_auto] md:py-9">
            <SubFooter/>
      </Container>
    </footer>
  )
}
