import { brands } from './brands'
import { categories } from './categories'

export interface Product {
  id: string
  slug: string
  name: string
  image: string
  originalPrice: number
  salePrice: number
  brandSlug: string
  categorySlug: string
}

const productNames = [
  'Хэт өндөр өтгөрүүлсэн гал тогооны аяга таваг угаагч шингэн',
  'Ургамлын гаралтай аяга таваг угаагч',
  'Эко гэр ахуйн цэвэрлэгээний шингэн',
  'Гэр бүлийн зөөлөн угаалгын шингэн',
]

export const products: Product[] = categories.flatMap((category, categoryIndex) =>
  Array.from({ length: 16 }, (_, productIndex) => {
    const brand = brands[(categoryIndex * 2 + productIndex) % brands.length]
    const sequence = categoryIndex * 16 + productIndex + 1

    return {
      id: `catalog-product-${sequence}`,
      slug: `${category.slug}-${brand.slug}-${productIndex + 1}`,
      name: productNames[productIndex % productNames.length],
      image: '/product-cleaner.svg',
      originalPrice: 65000,
      salePrice: 50000,
      brandSlug: brand.slug,
      categorySlug: category.slug,
    }
  }),
)
