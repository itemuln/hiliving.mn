import { useNavigate } from 'react-router-dom'
import type { Category } from '../../data/categories'

interface MobileCategoryHeaderProps {
  categories: Category[]
  activeCategory?: Category
}

export function MobileCategoryHeader({ categories, activeCategory }: MobileCategoryHeaderProps) {
  const navigate = useNavigate()

  return (
    <div className="mb-6">
      <div className="flex items-stretch">
        <span className="flex h-10 w-11 shrink-0 items-center justify-center border border-neutral-300 bg-white">
          {activeCategory ? (
            <img src={activeCategory.icon} alt="" aria-hidden="true" className="max-h-8 max-w-9 object-contain" />
          ) : null}
        </span>
        <h1 className="flex min-w-0 flex-1 items-center bg-brand-500 px-3 text-lg font-medium uppercase text-white">
          {activeCategory?.name ?? 'Ангилал олдсонгүй'}
        </h1>
      </div>
      <label className="mt-2 flex items-center justify-end gap-2 text-xs text-neutral-400">
        <span>Ангилал солих</span>
        <select
          value={activeCategory?.slug ?? ''}
          onChange={(event) => navigate(`/categories/${event.target.value}`)}
          className="min-h-9 max-w-[180px] rounded border border-neutral-200 bg-white px-2 text-xs text-neutral-600 focus:border-brand-400 focus:outline-none"
        >
          {!activeCategory ? <option value="" disabled>Сонгох</option> : null}
          {categories.map((category) => (
            <option key={category.slug} value={category.slug}>{category.name}</option>
          ))}
        </select>
      </label>
    </div>
  )
}

