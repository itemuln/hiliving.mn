import { Clock3, Mail, MapPin, Phone } from 'lucide-react';
import { Container } from '../components/layout/Container';
import { Footer } from '../components/layout/Footer';
import { Header } from '../components/layout/Header';
import { MobileBottomNav } from '../components/layout/MobileBottomNav';

const officeAddress =
  'Монгол Улс, Улаанбаатар хот, Хан-Уул дүүрэг, 17 дугаар хороо, Зайсангийн гүүрний урд, “Hiliving Mongolia” төв оффис, 17012';
const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  officeAddress
)}`;

export function ContactPage() {
  return (
    <div className="min-h-screen bg-white pb-20 md:pb-0">
      <Header />
      <main>
        <section className="border-b border-neutral-200 py-12 sm:py-16">
          <Container>
            <div className="max-w-2xl">
              <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">
                Холбоо барих
              </h1>
              <p className="mt-4 text-base leading-7 text-neutral-600">
                Бүтээгдэхүүн, захиалга болон хамтын ажиллагааны талаар бидэнтэй утас эсвэл и-мэйлээр
                холбогдоно уу.
              </p>
            </div>
          </Container>
        </section>

        <section className="py-12 sm:py-16">
          <Container>
            <div className="mx-auto grid max-w-5xl gap-10 md:grid-cols-2 md:gap-0">
              <div className="md:pr-12">
                <div className="divide-y divide-neutral-200 border-y border-neutral-200">
                  <a
                    href="tel:+97677558888"
                    aria-label="7755-8888"
                    className="flex items-center gap-4 py-5 text-neutral-700 transition hover:text-brand-500"
                  >
                    <Phone aria-hidden="true" className="h-5 w-5 shrink-0 text-brand-500" />
                    <span>
                      <span className="block text-xs text-neutral-500">Утас</span>
                      <span className="mt-1 block font-medium">7755-8888</span>
                    </span>
                  </a>
                  <a
                    href="mailto:info@hilivingmgl.mn"
                    aria-label="info@hilivingmgl.mn"
                    className="flex items-center gap-4 py-5 text-neutral-700 transition hover:text-brand-500"
                  >
                    <Mail aria-hidden="true" className="h-5 w-5 shrink-0 text-brand-500" />
                    <span>
                      <span className="block text-xs text-neutral-500">И-мэйл</span>
                      <span className="mt-1 block break-all font-medium">info@hilivingmgl.mn</span>
                    </span>
                  </a>
                </div>
              </div>

              <section className="border-t border-neutral-200 pt-10 md:border-l md:border-t-0 md:pl-12 md:pt-0">
                <h2 className="text-xl font-semibold text-neutral-900">Төв оффис</h2>
                <div className="mt-5 space-y-8">
                  <div className="flex gap-4">
                    <MapPin aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-brand-500" />
                    <div>
                      <h3 className="font-medium text-neutral-800">Хаяг</h3>
                      <p className="mt-2 text-sm leading-7 text-neutral-600">{officeAddress}</p>
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-flex text-sm font-medium text-brand-600 underline underline-offset-4 hover:text-brand-500"
                      >
                        Газрын зураг дээр харах
                      </a>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <Clock3 aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-brand-500" />
                    <div>
                      <h3 className="font-medium text-neutral-800">Ажиллах цаг</h3>
                      <p className="mt-2 text-sm leading-7 text-neutral-600">
                        Даваа – Бямба: 10:00 – 20:00
                        <br />
                        Ням: Амарна
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </Container>
        </section>
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
}
