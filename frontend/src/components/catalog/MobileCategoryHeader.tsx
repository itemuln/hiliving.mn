import { useRef, useState } from 'react';
import { Link } from 'react-router';
import type { CatalogCategory } from '../../features/catalog/catalog.types';

interface MobileCategoryHeaderProps {
  readonly categories: readonly CatalogCategory[];
  readonly activeCategory?: CatalogCategory;
  readonly isAll: boolean;
}

export function MobileCategoryHeader({
  categories,
  activeCategory,
  isAll,
}: MobileCategoryHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const activeIcon = isAll ? '/icons/grid.svg' : activeCategory?.iconUrl;
  const activeLabel = isAll ? 'БҮГД' : activeCategory?.name ?? 'Ангилал олдсонгүй';

  return (
    <div className="mb-6">
      <div className="flex items-stretch">
        <div
          className="relative shrink-0"
          onBlur={(event) => {
            if (
              !(event.relatedTarget instanceof Node) ||
              !event.currentTarget.contains(event.relatedTarget)
            ) {
              setIsMenuOpen(false);
            }
          }}
          onKeyDown={(event) => {
            if (event.key === 'Escape' && isMenuOpen) {
              setIsMenuOpen(false);
              triggerRef.current?.focus();
            }
          }}
        >
          <button
            ref={triggerRef}
            type="button"
            aria-label="Ангилал солих"
            aria-expanded={isMenuOpen}
            aria-controls="mobile-category-menu"
            onClick={() => setIsMenuOpen((current) => !current)}
            className="flex h-10 w-11 items-center justify-center border border-neutral-300 bg-white transition-colors duration-200 hover:border-brand-400 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2"
          >
            {activeIcon ? (
              <img
                src={activeIcon}
                alt=""
                aria-hidden="true"
                className="max-h-8 max-w-9 object-contain"
              />
            ) : null}
          </button>

          {isMenuOpen ? (
            <nav
              id="mobile-category-menu"
              aria-label="Ангилал сонгох"
              className="absolute left-0 top-full z-30 mt-2 max-h-72 w-64 max-w-[calc(100vw-3rem)] overflow-y-auto border border-neutral-200 bg-white p-1.5 shadow-lg"
            >
              <Link
                to="/categories"
                aria-current={isAll ? 'page' : undefined}
                onClick={() => setIsMenuOpen(false)}
                className={`flex min-h-10 items-center gap-3 px-3 py-2 text-sm transition-colors duration-200 ${
                  isAll
                    ? 'bg-brand-500 font-medium text-white'
                    : 'text-neutral-600 hover:bg-brand-50 hover:text-brand-500'
                }`}
              >
                <img
                  src="/icons/grid.svg"
                  alt=""
                  aria-hidden="true"
                  className="h-6 w-7 object-contain"
                />
                БҮГД
              </Link>
              {categories.map((category) => {
                const isActive = activeCategory?.slug === category.slug;

                return (
                  <Link
                    key={category.slug}
                    to={`/categories/${category.slug}`}
                    aria-current={isActive ? 'page' : undefined}
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex min-h-10 items-center gap-3 px-3 py-2 text-sm transition-colors duration-200 ${
                      isActive
                        ? 'bg-brand-500 font-medium text-white'
                        : 'text-neutral-600 hover:bg-brand-50 hover:text-brand-500'
                    }`}
                  >
                    <span className="flex h-6 w-7 shrink-0 items-center justify-center bg-white/90">
                      <img
                        src={category.iconUrl}
                        alt=""
                        aria-hidden="true"
                        className="max-h-6 max-w-7 object-contain"
                      />
                    </span>
                    <span>{category.name}</span>
                  </Link>
                );
              })}
            </nav>
          ) : null}
        </div>
        <h1 className="flex min-w-0 flex-1 items-center bg-brand-500 px-3 text-lg font-medium uppercase text-white">
          {activeLabel}
        </h1>
      </div>
    </div>
  );
}
