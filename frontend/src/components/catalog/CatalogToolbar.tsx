import { useEffect, useState, type FormEvent } from 'react'
import type { ProductSort } from '../../features/catalog/catalog.types'

interface CatalogToolbarProps {
  readonly search: string
  readonly sort: ProductSort
  readonly onSearch: (value: string) => void
  readonly onSort: (value: ProductSort) => void
}

export function CatalogToolbar({ search, sort, onSearch, onSort }: CatalogToolbarProps) {
  const [searchValue, setSearchValue] = useState(search)

  useEffect(() => setSearchValue(search), [search])

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSearch(searchValue.trim())
  }

  return (
    <div className="mb-7 flex flex-col gap-3 border-b border-neutral-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
      <form onSubmit={submitSearch} role="search" className="flex min-w-0 flex-1 items-center rounded border border-neutral-200 bg-white focus-within:border-brand-400 sm:max-w-sm">
        <label htmlFor="catalog-search" className="sr-only">Бүтээгдэхүүн хайх</label>
        <input
          id="catalog-search"
          type="search"
          value={searchValue}
          onChange={(event) => setSearchValue(event.target.value)}
          placeholder="Бүтээгдэхүүн хайх"
          maxLength={100}
          className="min-h-10 min-w-0 flex-1 px-3 text-sm outline-none placeholder:text-neutral-400"
        />
        <button type="submit" className="min-h-10 px-3 text-sm font-medium text-brand-500 hover:text-brand-600">Хайх</button>
      </form>

      <label className="flex items-center gap-2 text-xs text-neutral-500">
        <span>Эрэмбэлэх</span>
        <select
          aria-label="Бүтээгдэхүүн эрэмбэлэх"
          value={sort}
          onChange={(event) => onSort(event.target.value as ProductSort)}
          className="min-h-10 rounded border border-neutral-200 bg-white px-3 text-sm text-neutral-600 focus:border-brand-400 focus:outline-none"
        >
          <option value="newest">Шинэ эхэнд</option>
          <option value="price_asc">Үнэ өсөхөөр</option>
          <option value="price_desc">Үнэ буурахаар</option>
          <option value="name_asc">Нэрээр</option>
        </select>
      </label>
    </div>
  )
}
