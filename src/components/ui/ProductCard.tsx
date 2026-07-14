interface ProductCardProduct {
  id: string
  name: string
  originalPrice: number
  salePrice: number
  image: string
}

interface ProductCardProps {
  product: ProductCardProduct
  variant?: 'home' | 'brand' | 'category'
  imageLoading?: 'eager' | 'lazy'
  onAddToCart?: () => void
}

const priceFormatter = new Intl.NumberFormat('mn-MN')

export function ProductCard({ product, variant = 'home', imageLoading = 'lazy', onAddToCart }: ProductCardProps) {
  const showCartButton = variant === 'category'

  return (
    <article className="group min-w-0">
      <div className="aspect-square overflow-hidden rounded-sm border border-neutral-200 bg-white p-2 transition-colors duration-200 group-hover:border-brand-100 sm:p-3">
        <img
          src={product.image}
          alt={product.name}
          loading={imageLoading}
          decoding="async"
          className="h-full w-full object-contain transition-transform duration-300 ease-out group-hover:scale-[1.02] motion-reduce:transform-none"
        />
      </div>
      <h3 className="mt-2.5 line-clamp-3 min-h-[3.25rem] text-[11px] font-normal leading-[1.35] text-neutral-500 sm:text-xs md:mt-3 md:min-h-[3.2rem] md:text-[13px]">
        {product.name}
      </h3>
      <div className="mt-1.5 flex min-w-0 items-center gap-1.5 md:gap-2">
        <span className="shrink-0 whitespace-nowrap text-[9px] tracking-tight text-neutral-400 line-through sm:text-[11px]">{priceFormatter.format(product.originalPrice)}₮</span>
        <span className="min-w-0 whitespace-nowrap text-[13px] font-medium text-brand-500 sm:text-base">{priceFormatter.format(product.salePrice)}₮</span>
        {showCartButton ? (
          <button
            type="button"
            onClick={onAddToCart}
            aria-label={`${product.name} бүтээгдэхүүнийг сагсанд нэмэх`}
            className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-sm bg-brand-500 transition-colors duration-200 hover:bg-brand-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 md:h-7 md:w-7"
          >
            <img src="/icons/cart.svg" alt="" aria-hidden="true" className="h-4 w-4 brightness-0 invert" />
          </button>
        ) : null}
      </div>
    </article>
  )
}
