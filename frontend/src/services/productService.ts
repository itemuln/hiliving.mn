import { products } from '../data/products'

export async function getProducts() {
  const response = await fetch(`${import.meta.env.VITE_API_URL}/api/products`)
  if (!response.ok) {
    throw new Error('Failed to load products')
  }
  return response.json()
}

export async function getProductById(id: string) {
  return products.find((product) => product.id === id)
}
