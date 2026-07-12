import type { Product } from '../../data/homeData'

interface ProductCardProps {
  product: Product
}

const priceFormatter = new Intl.NumberFormat('mn-MN')

export function ProductCard({ product }: ProductCardProps) {
  return (
    <article className="group min-w-0">
      <a href={`#${product.id}`} className="block overflow-hidden rounded-sm border border-neutral-200 bg-white transition-all duration-300 ease-out hover:-translate-y-1 hover:border-brand-100 hover:shadow-soft motion-reduce:transform-none">
        <div className="aspect-[4/4.25] overflow-hidden p-2 sm:p-4">
          <img src={product.image} alt={product.name} loading="lazy" className="h-full w-full object-contain transition-all duration-300 ease-out group-hover:scale-[1.025] motion-reduce:transform-none" />
        </div>
      </a>
      <h3 className="mt-3 line-clamp-3 min-h-[3.5rem] text-[11px] font-normal leading-[1.35] text-neutral-500 sm:text-xs md:min-h-[3rem] md:text-sm">
        <a href={`#${product.id}`} className="transition-colors duration-300 ease-out hover:text-brand-500">{product.name}</a>
      </h3>
      <div className="mt-1.5 flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
        <span className="text-[11px] text-neutral-400 line-through sm:text-xs">{priceFormatter.format(product.originalPrice)}₮</span>
        <span className="text-sm font-medium text-brand-500 sm:text-base">{priceFormatter.format(product.salePrice)}₮</span>
      </div>
    </article>
  )
}
