import { Link } from 'react-router';

export function SubFooter() {
  return (
    <>
      <div>
        <p>
          Хаяг: Монгол Улс, Улаанбаатар хот, Хан-Уул дүүрэг, 17 дугаар хороо,
          <br className="hidden md:block" /> Зайсангийн гүүрний урд, “Hiliving Mongolia” төв оффис,
          17012
        </p>
        <p>
          И-мэйл:{' '}
          <a href="mailto:info@hilivingmgl.mn" className="hover:text-brand-500 hover:underline">
            info@hilivingmgl.mn
          </a>
        </p>
        <Link
          to="/contact"
          className="mt-3 inline-flex font-medium text-neutral-500 underline underline-offset-4 hover:text-brand-500"
        >
          Холбоо барих дэлгэрэнгүй
        </Link>
        <p className="mt-4 text-brand-500">Бүх эрх хуулиар баталгаажсан. ©2026</p>
      </div>
      <div className="md:text-right">
        <p>Даваа – Бямба 10:00 - 20:00</p>
        <p>Ням амарна.</p>
        <p>
          Утас:{' '}
          <a href="tel:+97677558888" className="hover:text-brand-500 hover:underline">
            7755-8888
          </a>
        </p>
      </div>
    </>
  );
}
