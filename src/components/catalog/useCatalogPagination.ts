import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'

export const CATALOG_PAGE_SIZE = 16

interface CatalogPaginationOptions<T> {
  items: T[]
  enabled?: boolean
}

export function useCatalogPagination<T>({ items, enabled = true }: CatalogPaginationOptions<T>) {
  const [searchParams, setSearchParams] = useSearchParams()
  const rawPage = searchParams.get('page')
  const parsedPage = rawPage === null ? 1 : Number(rawPage)
  const requestedPage = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1
  const totalPages = Math.max(1, Math.ceil(items.length / CATALOG_PAGE_SIZE))
  const currentPage = Math.min(requestedPage, totalPages)

  useEffect(() => {
    if (!enabled) return

    const normalizedPage = currentPage === 1 ? null : String(currentPage)
    if (rawPage === normalizedPage) return

    const nextSearchParams = new URLSearchParams(searchParams)
    if (normalizedPage) {
      nextSearchParams.set('page', normalizedPage)
    } else {
      nextSearchParams.delete('page')
    }
    setSearchParams(nextSearchParams, { replace: true })
  }, [currentPage, enabled, rawPage, searchParams, setSearchParams])

  const startIndex = (currentPage - 1) * CATALOG_PAGE_SIZE

  return {
    currentPage,
    totalPages,
    paginatedItems: items.slice(startIndex, startIndex + CATALOG_PAGE_SIZE),
  }
}

