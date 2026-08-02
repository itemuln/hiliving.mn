import { Link } from 'react-router-dom';

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
          <a href="mailto:info@hilivingmgl.mn" className="hover:text-brand-700 hover:underline">
            info@hilivingmgl.mn
          </a>
        </p>
        <Link
          to="/contact"
          className="mt-3 inline-flex font-medium text-neutral-700 underline underline-offset-4 hover:text-brand-700"
        >
          Холбоо барих дэлгэрэнгүй
        </Link>
        <p className="mt-4 text-brand-700">Бүх эрх хуулиар баталгаажсан. ©2026</p>
      </div>
      <div className="md:text-right">
        <p>Даваа – Бямба 10:00 - 20:00</p>
        <p>Ням амарна.</p>
        <p>
          Утас:{' '}
          <a href="tel:+97677558888" className="hover:text-brand-700 hover:underline">
            7755-8888
          </a>
        </p>
      </div>
    </>
  );
}
