import { useState, type ReactNode } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import {
  BarChart3,
  Boxes,
  Building2,
  FileText,
  House,
  Image,
  LayoutDashboard,
  Menu,
  Newspaper,
  PackagePlus,
  ShoppingBag,
  Tags,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../../auth/useAuth';

const links = [
  { to: '/admin', label: 'Хяналтын самбар', icon: LayoutDashboard, end: true },
  {
    label: 'Бүтээгдэхүүн',
    icon: ShoppingBag,
    children: [
      { to: '/admin/products/new', label: 'Бүтээгдэхүүн нэмэх', icon: PackagePlus, end: true },
      { to: '/admin/products', label: 'Бүх бүтээгдэхүүн', icon: Boxes, end: true },
    ],
  },
  { to: '/admin/orders', label: 'Захиалга', icon: BarChart3 },
  { to: '/admin/news', label: 'Мэдээ', icon: Newspaper },
  { to: '/admin/users', label: 'Хэрэглэгч', icon: Users },
  { to: '/admin/banners', label: 'Баннер', icon: Image },
  { to: '/admin/categories', label: 'Ангилал', icon: Tags },
  { to: '/admin/brands', label: 'Брэнд', icon: Building2 },
  { label: 'Хуудас', icon: FileText, disabled: true },
];

const pathLabels: Record<string, string> = {
  products: 'Бүтээгдэхүүн',
  new: 'Нэмэх',
  edit: 'Засах',
  orders: 'Захиалга',
  news: 'Мэдээ',
  users: 'Хэрэглэгч',
  banners: 'Баннер',
  categories: 'Ангилал',
  brands: 'Брэнд',
};

export function AdminShell({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const { state, logout } = useAuth();
  const location = useLocation();
  const sidebar = (
    <div className="flex h-full flex-col bg-gradient-to-b from-[#17202b] to-[#101720] text-slate-200">
      <div className="flex h-20 items-center justify-between border-b border-white/10 px-6">
        <div>
          <div className="text-xl font-black tracking-tight text-white">HiLiving</div>
          <div className="text-[10px] font-bold uppercase tracking-[.24em] text-brand-400">
            Удирдлагын хэсэг
          </div>
        </div>
        <button
          onClick={() => setOpen(false)}
          className="rounded-lg p-2 lg:hidden"
          aria-label="Цэс хаах"
        >
          <X size={20} />
        </button>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-4" aria-label="Удирдлагын цэс">
        {links.map((item, index) => {
          const Icon = item.icon;
          if (item.children)
            return (
              <div key={item.label} className="pb-2">
                <div className="flex items-center gap-3 px-3 py-2 text-xs font-bold uppercase tracking-widest text-slate-500">
                  <Icon size={16} />
                  {item.label}
                </div>
                {item.children.map((child) => {
                  const ChildIcon = child.icon;
                  return (
                    <NavLink
                      key={child.to}
                      to={child.to}
                      end={child.end}
                      onClick={() => setOpen(false)}
                      className={({ isActive }) =>
                        `ml-3 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                          isActive
                            ? 'bg-brand-500 text-white'
                            : 'text-slate-300 hover:bg-white/5 hover:text-white'
                        }`
                      }
                    >
                      <ChildIcon size={17} />
                      {child.label}
                    </NavLink>
                  );
                })}
              </div>
            );
          if (item.disabled)
            return (
              <div
                key={`${item.label}-${index}`}
                className="flex cursor-not-allowed items-center justify-between rounded-xl px-3 py-2.5 text-sm text-slate-600"
                aria-disabled="true"
              >
                <span className="flex items-center gap-3">
                  <Icon size={18} />
                  {item.label}
                </span>
                <span className="text-[9px] uppercase">Удахгүй</span>
              </div>
            );
          return (
            <NavLink
              key={item.to}
              end={item.end}
              to={item.to!}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                  isActive
                    ? 'bg-brand-500 text-white'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <Icon size={18} />
              {item.label}
            </NavLink>
          );
        })}
      </nav>
      <Link
        to="/"
        onClick={() => setOpen(false)}
        className="mx-4 mb-4 flex items-center gap-3 rounded-xl border border-white/10 px-3 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/5 hover:text-white"
      >
        <House size={18} />
        Нүүр хуудас руу буцах
      </Link>
      <div className="border-t border-white/10 p-4 text-xs text-slate-500">
        Аюулгүй удирдлагын орчин
      </div>
    </div>
  );
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 lg:block">{sidebar}</aside>
      {open && (
        <>
          <button
            className="fixed inset-0 z-40 bg-slate-950/60 lg:hidden"
            onClick={() => setOpen(false)}
            aria-label="Цэсний дэвсгэр хаах"
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-[min(82vw,19rem)] lg:hidden">
            {sidebar}
          </aside>
        </>
      )}
      <div className="min-w-0 lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur-xl sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              className="rounded-xl border border-slate-200 p-2 lg:hidden"
              onClick={() => setOpen(true)}
              aria-label="Цэс нээх"
            >
              <Menu size={20} />
            </button>
            <div className="min-w-0">
              <p className="truncate text-xs text-slate-400">
                Удирдлага /{' '}
                {location.pathname
                  .split('/')
                  .filter(Boolean)
                  .slice(1)
                  .map(
                    (segment) => pathLabels[segment] ?? (Number(segment) ? `#${segment}` : segment)
                  )
                  .join(' / ') || 'Хяналтын самбар'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <div className="text-sm font-semibold">
                {state.status === 'authenticated'
                  ? `${state.user.firstName} ${state.user.lastName}`
                  : 'Админ'}
              </div>
              <div className="text-xs text-slate-400">Администратор</div>
            </div>
            <button
              onClick={() => void logout()}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold hover:bg-slate-50"
            >
              Гарах
            </button>
          </div>
        </header>
        <main className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                {title}
              </h1>
              {description && (
                <p className="mt-1 max-w-2xl text-sm text-slate-500">{description}</p>
              )}
            </div>
            {actions}
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
