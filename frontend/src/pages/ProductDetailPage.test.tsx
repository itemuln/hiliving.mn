import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { jsonResponse } from '../test/catalogFixtures'
import { ProductDetailPage } from './ProductDetailPage'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('ProductDetailPage', () => {
  it('renders a safe product-not-found state for backend 404 responses', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({
      error: {
        code: 'RESOURCE_NOT_FOUND',
        message: 'Internal persistence details must not be shown',
        path: '/api/v1/products/missing-product',
        timestamp: '2026-07-15T10:00:00Z',
        fieldErrors: [],
      },
    }, 404)))

    render(
      <MemoryRouter initialEntries={['/products/missing-product']}>
        <Routes>
          <Route path="/products/:productSlug" element={<ProductDetailPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByRole('heading', { name: 'Бүтээгдэхүүн олдсонгүй' })).toBeInTheDocument()
    expect(screen.queryByText(/persistence details/)).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Каталог руу буцах' })).toHaveAttribute('href', '/categories')
  })
})
