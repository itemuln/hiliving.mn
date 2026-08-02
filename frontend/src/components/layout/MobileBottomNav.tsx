import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import type { CatalogCategory } from '../../features/catalog/catalog.types';
import { useOptionalAuth } from '../../features/auth/useAuth';
import { useOptionalCart } from '../../features/cart/useCart';
import { AnimatedCartIcon } from '../cart/AnimatedCartIcon';

const baseNavItems = [
  { label: 'Эхлэл', icon: '/icons/home.svg', to: '/', section: 'home' },
  { label: 'Ангилал', icon: '/icons/grid.svg', to: '/categories', section: 'categories' },
  { label: 'Цэс', icon: '/icons/menu.svg', to: '', section: 'more' },
  { label: 'Сагс', icon: '/icons/cart.svg', to: '/cart', section: 'cart' },
] as const;

const moreLinks = [
  { label: 'Hiliving MGL', to: '/hiliving-mgl' },
  { label: 'Брэндүүд', to: '/brands' },
  { label: 'Мэдээлэл', to: '/news' },
  { label: 'Холбоо барих', to: '/contact' },
] as const;

type OpenSheet = 'categories' | 'more' | null;

export function MobileBottomNav() {
  const { pathname } = useLocation();
  const [openSheet, setOpenSheet] = useState<OpenSheet>(null);
  const [categories, setCategories] = useState<readonly CatalogCategory[]>();
  const [categoryLoadFailed, setCategoryLoadFailed] = useState(false);
  const categoryButtonRef = useRef<HTMLButtonElement>(null);
  const moreButtonRef = useRef<HTMLButtonElement>(null);
  const sheetDialogRef = useRef<HTMLDivElement>(null);
  const firstSheetLinkRef = useRef<HTMLAnchorElement>(null);
  const state = useOptionalAuth()?.state ?? { status: 'anonymous' as const, user: null };
  const cartCount = useOptionalCart()?.itemCount ?? 0;
  const categoriesOpen = openSheet === 'categories';
  const moreOpen = openSheet === 'more';
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
    if (!categoriesOpen || categories !== undefined || categoryLoadFailed) return;

    const controller = new AbortController();
    let active = true;
    void import('../../api/catalogApi').then(({ fetchCategories }) =>
      fetchCategories(controller.signal)
    ).then(
      (loadedCategories) => {
        if (active) setCategories(loadedCategories);
      },
      () => {
        if (active && !controller.signal.aborted) setCategoryLoadFailed(true);
      }
    );

    return () => {
      active = false;
      controller.abort();
    };
  }, [categories, categoriesOpen, categoryLoadFailed]);

  useEffect(() => {
    if (!openSheet) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    firstSheetLinkRef.current?.focus();

    const restoreTriggerFocus = () => {
      if (openSheet === 'categories') categoryButtonRef.current?.focus();
      else moreButtonRef.current?.focus();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setOpenSheet(null);
        restoreTriggerFocus();
        return;
      }

      if (event.key !== 'Tab') return;
      const focusable = sheetDialogRef.current?.querySelectorAll<HTMLElement>(
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
  }, [openSheet]);

  const closeSheet = (restoreFocus = false) => {
    const trigger = openSheet === 'categories' ? categoryButtonRef : moreButtonRef;
    setOpenSheet(null);
    if (restoreFocus) trigger.current?.focus();
  };

  const sheetLabel = categoriesOpen ? 'Ангилал сонгох' : 'Нэмэлт цэс';
  const sheetId = categoriesOpen ? 'mobile-category-menu' : 'mobile-more-menu';

  return (
    <>
      {openSheet ? (
        <div className="fixed inset-x-0 bottom-[calc(78px+env(safe-area-inset-bottom))] top-0 z-40 flex items-end md:hidden">
          <button
            type="button"
            aria-label={`${sheetLabel} хаах`}
            className="absolute inset-0 bg-neutral-900/25"
            onClick={() => closeSheet(true)}
          />
          <div
            id={sheetId}
            ref={sheetDialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={sheetLabel}
            className="relative max-h-[min(70vh,32rem)] w-full overflow-y-auto rounded-t-2xl bg-white px-5 pb-5 pt-3 shadow-[0_-12px_30px_rgba(0,0,0,0.12)]"
          >
            <div className="flex h-8 items-center justify-center">
              <div className="h-1 w-9 rounded-full bg-neutral-200" />
            </div>
            <div className="divide-y divide-neutral-100">
              {categoriesOpen ? (
                <>
                  <Link
                    ref={firstSheetLinkRef}
                    to="/categories"
                    aria-current={
                      pathname === '/categories' || pathname === '/categories/' ? 'page' : undefined
                    }
                    onClick={() => closeSheet()}
                    className="flex min-h-14 items-center px-1 py-3 text-sm font-medium text-neutral-700 transition hover:text-brand-500"
                  >
                    БҮГД
                  </Link>
                  {categories?.map((category) => {
                    const isActive = pathname === `/categories/${category.slug}`;
                    return (
                      <Link
                        key={category.slug}
                        to={`/categories/${category.slug}`}
                        aria-current={isActive ? 'page' : undefined}
                        onClick={() => closeSheet()}
                        className={`flex min-h-14 items-center px-1 py-3 text-sm font-medium transition ${
                          isActive ? 'text-brand-500' : 'text-neutral-700 hover:text-brand-500'
                        }`}
                      >
                        {category.name}
                      </Link>
                    );
                  })}
                  {categories === undefined && !categoryLoadFailed ? (
                    <p role="status" className="px-1 py-4 text-sm text-neutral-500">
                      Ангилал ачаалж байна…
                    </p>
                  ) : null}
                  {categoryLoadFailed ? (
                    <div className="flex min-h-14 items-center justify-between gap-3 px-1 py-3 text-sm text-neutral-500">
                      <span>Ангиллыг ачаалж чадсангүй.</span>
                      <button
                        type="button"
                        className="font-medium text-brand-500"
                        onClick={() => setCategoryLoadFailed(false)}
                      >
                        Дахин оролдох
                      </button>
                    </div>
                  ) : null}
                </>
              ) : (
                moreLinks.map(({ label, to }, index) => (
                  <Link
                    key={to}
                    ref={index === 0 ? firstSheetLinkRef : undefined}
                    to={to}
                    onClick={() => closeSheet()}
                    className="flex min-h-14 items-center px-1 py-3 text-sm font-medium text-neutral-700 transition hover:text-brand-500"
                  >
                    <span>{label}</span>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      ) : null}

      <nav
        aria-label="Гар утасны цэс"
        className="fixed inset-x-0 bottom-0 z-50 border-t border-neutral-200 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_22px_rgba(0,0,0,0.05)] backdrop-blur md:hidden"
      >
        <div className="grid h-[78px] grid-cols-5">
          {navItems.map(({ label, icon, to, section }) => {
            const routeIsActive =
              (section === 'home' && pathname === '/') ||
              (section === 'categories' && pathname.startsWith('/categories')) ||
              (section === 'more' && moreIsActive) ||
              (section === 'cart' && pathname.startsWith('/cart')) ||
              (section === 'account' &&
                (pathname.startsWith('/account') ||
                  pathname === '/login' ||
                  pathname === '/register'));
            const isActive =
              section === 'categories'
                ? categoriesOpen || (openSheet === null && routeIsActive)
                : section === 'more'
                  ? moreOpen || (openSheet === null && routeIsActive)
                : openSheet === null && routeIsActive;
            const itemClassName = `relative flex min-w-0 flex-col items-center justify-center gap-0.5 text-[11px] transition-all duration-300 ease-out ${
              isActive ? 'font-medium text-brand-500' : 'text-neutral-400 hover:text-brand-500'
            }`;
            const content = (
              <>
                <span className={isActive ? 'rounded-full bg-brand-50 p-2' : 'p-2'}>
                  {section === 'cart' ? (
                    <AnimatedCartIcon itemCount={cartCount} className="h-6 w-6" />
                  ) : (
                    <img src={icon} alt="" aria-hidden="true" className="h-6 w-6" />
                  )}
                </span>
                {section === 'cart' && cartCount > 0 ? (
                  <span className="absolute left-1/2 top-1.5 ml-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-500 px-1 text-[9px] text-white">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                ) : null}
                <span className="w-full truncate px-1 text-center">{label}</span>
              </>
            );

            if (section === 'categories') {
              return (
                <button
                  key={label}
                  ref={categoryButtonRef}
                  type="button"
                  aria-expanded={categoriesOpen}
                  aria-controls="mobile-category-menu"
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() =>
                    setOpenSheet((current) => (current === 'categories' ? null : 'categories'))
                  }
                  className={itemClassName}
                >
                  {content}
                </button>
              );
            }

            if (section === 'more') {
              return (
                <button
                  key={label}
                  ref={moreButtonRef}
                  type="button"
                  aria-expanded={moreOpen}
                  aria-controls="mobile-more-menu"
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => setOpenSheet((current) => (current === 'more' ? null : 'more'))}
                  className={itemClassName}
                >
                  {content}
                </button>
              );
            }

            return (
              <Link
                key={label}
                to={to}
                aria-current={isActive ? 'page' : undefined}
                className={itemClassName}
              >
                {content}
              </Link>
              );
            })}
        </div>
      </nav>
    </>
  );
}
