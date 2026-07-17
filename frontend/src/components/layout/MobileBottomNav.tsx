import { Link, useLocation } from 'react-router-dom';
import { useOptionalAuth } from '../../features/auth/useAuth';
import { useOptionalCart } from '../../features/cart/useCart';

const baseNavItems = [
  { label: 'Эхлэл', icon: '/icons/home.svg', to: '/', section: 'home' },
  { label: 'Ангилал', icon: '/icons/grid.svg', to: '/categories/', section: 'categories' },
  { label: 'Сагс', icon: '/icons/cart.svg', to: '/cart', section: 'cart' },
];

export function MobileBottomNav() {
  const { pathname } = useLocation();
  const state = useOptionalAuth()?.state ?? { status: 'anonymous' as const, user: null };
  const cartCount = useOptionalCart()?.itemCount ?? 0;
  const navItems = [
    ...baseNavItems,
    {
      label: state.status === 'authenticated' ? 'Бүртгэл' : 'Нэвтрэх',
      icon: '/icons/user.svg',
      to: state.status === 'authenticated' ? '/account' : '/login',
      section: 'account',
    },
  ];

  return (
    <nav
      aria-label="Гар утасны цэс"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-neutral-200 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_22px_rgba(0,0,0,0.05)] backdrop-blur md:hidden"
    >
      <div className="grid h-[70px] grid-cols-4">
        {navItems.map(({ label, icon, to, section }) => {
          const isActive =
            (section === 'home' &&
              (pathname === '/' ||
                pathname.startsWith('/brands') ||
                pathname.startsWith('/news'))) ||
            (section === 'categories' && pathname.startsWith('/categories')) ||
            (section === 'cart' && pathname.startsWith('/cart')) ||
            (section === 'account' &&
              (pathname.startsWith('/account') ||
                pathname === '/login' ||
                pathname === '/register'));

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
                <img src={icon} alt="" aria-hidden="true" className="h-5 w-5" />
              </span>
              {section === 'cart' && cartCount > 0 ? (
                <span className="absolute left-1/2 top-1 ml-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-500 px-1 text-[9px] text-white">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              ) : null}
              <span className="truncate">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
