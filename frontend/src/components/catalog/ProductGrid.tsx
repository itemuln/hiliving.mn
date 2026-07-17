import type { CatalogProduct } from '../../features/catalog/catalog.types';
import { useCart } from '../../features/cart/useCart';
import { ProductCard } from '../ui/ProductCard';

interface ProductGridProps {
  readonly products: readonly CatalogProduct[];
  readonly variant: 'brand' | 'category';
}

export function ProductGrid({ products, variant }: ProductGridProps) {
  const { addItem, itemCount } = useCart();

  return (
    <>
      <p className="sr-only" role="status" aria-live="polite">
        {itemCount > 0 ? `Сагсанд нийт ${itemCount} бараа байна.` : ''}
      </p>
      <div className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-3 md:gap-x-5 md:gap-y-12 xl:grid-cols-4">
        {products.map((product, index) => (
          <div key={product.id} className="min-w-0">
            <ProductCard
              product={product}
              variant={variant}
              imageLoading={index < 4 ? 'eager' : 'lazy'}
              onAddToCart={() => addItem(product.slug)}
            />
          </div>
        ))}
      </div>
    </>
  );
}
