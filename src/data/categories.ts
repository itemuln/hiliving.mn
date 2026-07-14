export interface Category {
  slug: string
  name: string
  icon: string
}

export const categories: Category[] = [
  { slug: 'health', name: 'Эрүүл мэнд', icon: '/health.png' },
  { slug: 'beauty', name: 'Гоо сайхан', icon: '/skincare.png' },
  { slug: 'electronics', name: 'Цахилгаан', icon: '/air.png' },
  { slug: 'home', name: 'Гэр ахуй', icon: '/tovel.png' },
  { slug: 'kitchen', name: 'Гал тогоо', icon: '/pan.png' },
  { slug: 'daily', name: 'Өдөр тутам', icon: '/brush.png' },
  { slug: 'fashion', name: 'Хувцас', icon: '/shoe.png' },
  { slug: 'food', name: 'Хүнс', icon: '/ingredient.png' },
  { slug: 'other', name: 'Бусад', icon: '/book.png' },
]

