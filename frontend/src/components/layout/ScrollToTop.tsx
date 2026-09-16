import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const isCatalogPath = (pathname: string) => /^\/(categories|brands)(\/|$)/.test(pathname);

export function ScrollToTop() {
  const { pathname } = useLocation();
  const previousPathname = useRef(pathname);

  useEffect(() => {
    const previousPath = previousPathname.current;
    previousPathname.current = pathname;

    if (previousPath !== pathname && isCatalogPath(previousPath) && isCatalogPath(pathname)) {
      document
        .getElementById('catalog-products')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pathname]);

  return null;
}
