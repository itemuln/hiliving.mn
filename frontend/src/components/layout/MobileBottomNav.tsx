import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatedCartIcon } from '../cart/AnimatedCartIcon';
import { useOptionalAuth } from '../../features/auth/useAuth';
import { useOptionalCart } from '../../features/cart/useCart';

const baseNavItems = [
  { label: 'Эхлэл', icon: '/icons/home.svg', to: '/', section: 'home' },
  { label: 'Ангилал', icon: '/icons/grid.svg', to: '/categories/', section: 'categories' },
  { label: 'Сагс', icon: '/icons/cart.svg', to: '/cart', section: 'cart' },
];

const moreLinks = [
  { label: 'Hiliving MGL', to: '/hiliving-mgl' },
  { label: 'Брэндүүд', to: '/brands' },
  { label: 'Мэдээлэл', to: '/news' },
  { label: 'Холбоо барих', to: '/contact' },
] as const;

export function MobileBottomNav() {
  const { pathname } = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreButtonRef = useRef<HTMLButtonElement>(null);
  const moreDialogRef = useRef<HTMLDivElement>(null);
  const firstMoreLinkRef = useRef<HTMLAnchorElement>(null);
  const state = useOptionalAuth()?.state ?? { status: 'anonymous' as const, user: null };
  const cartCount = useOptionalCart()?.itemCount ?? 0;
  const moreIsActive =
    pathname.startsWith('/brands') ||
    pathname.startsWith('/news') ||
    pathname === '/contact' ||
    pathname.startsWith('/hiliving-mgl');
  const navItems = [
    ...baseNavItems,
    {
      label: state.status === 'authenticated' ? 'Бүртгэл' : 'Нэвтрэх',
      icon: '/icons/user.svg',
      to: state.status === 'authenticated' ? '/account' : '/login',
      section: 'account',
    },
  ];

  useEffect(() => {
    if (!moreOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    firstMoreLinkRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setMoreOpen(false);
        moreButtonRef.current?.focus();
        return;
      }

      if (event.key !== 'Tab') return;
      const focusable = moreDialogRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled])'
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [moreOpen]);

  const closeMoreMenu = (restoreFocus = false) => {
    setMoreOpen(false);
    if (restoreFocus) moreButtonRef.current?.focus();
  };

  return (
    <>
      {moreOpen ? (
        <div className="fixed inset-x-0 bottom-[calc(70px+env(safe-area-inset-bottom))] top-0 z-40 flex items-end md:hidden">
          <button
            type="button"
            aria-label="Цэс хаах"
            className="absolute inset-0 bg-neutral-900/25"
            onClick={() => closeMoreMenu(true)}
          />
          <div
            id="mobile-more-menu"
            ref={moreDialogRef}
            role="dialog"
            aria-modal="true"
            aria-label="Нэмэлт цэс"
            className="relative w-full rounded-t-2xl bg-white px-5 pb-5 pt-3 shadow-[0_-12px_30px_rgba(0,0,0,0.12)]"
          >
            <div className="flex h-8 items-center justify-center">
              <div className="h-1 w-9 rounded-full bg-neutral-200" />
            </div>
            <div className="divide-y divide-neutral-100">
              {moreLinks.map(({ label, to }, index) => (
                <Link
                  key={to}
                  ref={index === 0 ? firstMoreLinkRef : undefined}
                  to={to}
                  onClick={() => closeMoreMenu()}
                  className="flex min-h-14 items-center px-1 py-3 text-sm font-medium text-neutral-700 transition hover:text-brand-500"
                >
                  <span>{label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <nav
        aria-label="Гар утасны цэс"
        className="fixed inset-x-0 bottom-0 z-50 border-t border-neutral-200 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_22px_rgba(0,0,0,0.05)] backdrop-blur md:hidden"
      >
        <div className="grid h-[70px] grid-cols-5">
          {navItems.map(({ label, icon, to, section }) => {
            const isActive =
              !moreOpen &&
              ((section === 'home' && pathname === '/') ||
                (section === 'categories' && pathname.startsWith('/categories')) ||
                (section === 'cart' && pathname.startsWith('/cart')) ||
                (section === 'account' &&
                  (pathname.startsWith('/account') ||
                    pathname === '/login' ||
                    pathname === '/register')));

            return (
              <Link
                key={label}
                to={to}
                aria-current={isActive ? 'page' : undefined}
                className={`relative flex min-w-0 flex-col items-center justify-center gap-1 text-[10px] transition-all duration-300 ease-out ${
                  isActive ? 'font-medium text-brand-500' : 'text-neutral-400 hover:text-brand-500'
                }`}
              >
                <span className={isActive ? 'rounded-full bg-brand-50 p-1.5' : 'p-1.5'}>
                  {section === 'cart' ? (
                    <AnimatedCartIcon itemCount={cartCount} />
                  ) : (
                    <img src={icon} alt="" aria-hidden="true" className="h-5 w-5" />
                  )}
                </span>
                {section === 'cart' && cartCount > 0 ? (
                  <span className="absolute left-1/2 top-1 ml-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-500 px-1 text-[9px] text-white">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                ) : null}
                <span className="w-full truncate px-1 text-center">{label}</span>
              </Link>
            );
          })}
          <button
            ref={moreButtonRef}
            type="button"
            aria-expanded={moreOpen}
            aria-controls="mobile-more-menu"
            aria-current={moreIsActive ? 'page' : undefined}
            onClick={() => setMoreOpen((open) => !open)}
            className={`flex min-w-0 flex-col items-center justify-center gap-1 text-[10px] transition-all duration-300 ease-out ${
              moreOpen || moreIsActive
                ? 'font-medium text-brand-500'
                : 'text-neutral-400 hover:text-brand-500'
            }`}
          >
            <span className={moreOpen || moreIsActive ? 'rounded-full bg-brand-50 p-1.5' : 'p-1.5'}>
              <img src="/icons/menu.svg" alt="" aria-hidden="true" className="h-5 w-5" />
            </span>
            <span className="w-full truncate px-1 text-center">Цэс</span>
          </button>
        </div>
      </nav>
    </>
  );
}
