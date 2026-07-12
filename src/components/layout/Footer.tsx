import { Container } from './Container'

const socialLinks = [
  { label: 'YouTube', icon: '/icons/youtube.svg' },
  { label: 'Instagram', icon: '/icons/instagram.svg' },
  { label: 'Facebook', icon: '/icons/facebook.svg' },
]

export function Footer() {
  return (
    <footer className="mb-[74px] mt-16 bg-neutral-50 text-neutral-400 md:mb-0 md:mt-24">
      <div className="border-b border-neutral-200 bg-neutral-100/70 py-5">
        <Container className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <img src="/hiLivingLogo" alt="Hiliving Mongolia" className="h-auto w-[230px] opacity-90 md:w-[310px]" />
          <div className="flex gap-3">
            {socialLinks.map(({ label, icon }) => (
              <a key={label} href={`#${label.toLowerCase()}`} aria-label={label} className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500 text-white transition-all duration-300 ease-out hover:-translate-y-0.5 hover:bg-brand-600 motion-reduce:transform-none">
                <img src={icon} alt="" aria-hidden="true" className="h-5 w-5 invert" />
              </a>
            ))}
          </div>
        </Container>
      </div>
      <Container className="grid gap-7 py-7 text-sm leading-relaxed md:grid-cols-[1fr_auto] md:py-9">
        <div>
          <p>Хаяг: Монгол Улс, Улаанбаатар хот, Хан-Уул дүүрэг, 17 дугаар хороо,<br className="hidden md:block" /> Зайсангийн гүүрний урд, “Hiliving Mongolia” төв оффис, 17012</p>
          <p>И-мэйл: info@hilivingmgl.mn</p>
          <p className="mt-4 text-brand-500">Бүх эрх хуулиар баталгаажсан. ©2026</p>
        </div>
        <div className="md:text-right">
          <p>Даваа – Бямба 10:00 - 20:00</p>
          <p>Ням амарна.</p>
          <p>Утас: 7755-8888</p>
        </div>
      </Container>
    </footer>
  )
}
