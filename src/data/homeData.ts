export type CategoryIcon =
  | 'health'
  | 'beauty'
  | 'electronics'
  | 'home'
  | 'kitchen'
  | 'daily'
  | 'fashion'
  | 'food'
  | 'other'

export interface Category {
  id: string
  label: string
  icon: CategoryIcon
}

export interface Product {
  id: string
  name: string
  originalPrice: number
  salePrice: number
  image: string
}

export interface NewsItem {
  id: string
  title: string
  description: string
  image: string
}

export interface Brand {
  id: string
  name: string
}

export interface Banner {
  id: string
  image: string
  alt: string
}

export const navigation = ['Дэлгүүр хэсэх', 'Hiliving MGL', 'Брэндүүд', 'Мэдээлэл', 'Холбоо барих']

export const heroBanners: Banner[] = [
  { id: 'special', image: '/hero-special.svg', alt: 'Special Price онцгой үнийн урамшуулал' },
  { id: 'wellness', image: '/hero-wellness.svg', alt: 'Өдөр бүр эрүүл сонголт урамшуулал' },
]

export const categories: Category[] = [
  { id: 'health', label: 'Эрүүл мэнд', icon: 'health' },
  { id: 'beauty', label: 'Гоо сайхан', icon: 'beauty' },
  { id: 'electronics', label: 'Цахилгаан', icon: 'electronics' },
  { id: 'home', label: 'Гэр ахуй', icon: 'home' },
  { id: 'kitchen', label: 'Гал тогоо', icon: 'kitchen' },
  { id: 'daily', label: 'Өдөр тутам', icon: 'daily' },
  { id: 'fashion', label: 'Хувцас', icon: 'fashion' },
  { id: 'food', label: 'Хүнс', icon: 'food' },
  { id: 'other', label: 'Бусад', icon: 'other' },
]

const productNames = [
  'Хэт өндөр өтгөрүүлсэн аяга таваг угаагч шингэн',
  'Ургамлын гаралтай аяга таваг угаагч',
  'Эко гэр ахуйн цэвэрлэгээний шингэн',
  'Гэр бүлийн зөөлөн угаалгын шингэн',
  'Төвлөрсөн гал тогооны цэвэрлэгч',
  'Хүнсний ногоо угаах байгалийн шингэн',
  'Толбо арилгагч хүчирхэг шингэн',
  'Байгальд ээлтэй аяга таваг угаагч',
  'Өдөр тутмын гал тогооны арчилгаа',
  'Эдийн засгийн багц цэвэрлэгээний шингэн',
]

export const products: Product[] = productNames.map((name, index) => ({
  id: `product-${index + 1}`,
  name,
  originalPrice: index % 3 === 0 ? 65000 : 62000,
  salePrice: index % 3 === 0 ? 50000 : 48000,
  image: '/product-cleaner.svg',
}))

export const promotionalBanners: Banner[] = [
  { id: 'winter', image: '/promo-winter.svg', alt: 'Өвлийн тусгай хямдрал' },
  { id: 'spring', image: '/promo-spring.svg', alt: 'Хаврын шинэчлэл урамшуулал' },
]

export const newsItems: NewsItem[] = [
  {
    id: 'new-office',
    title: 'Hiliving Mongolia шинэ төв оффисоо нээлээ',
    description: 'Бид хэрэглэгчдэдээ илүү ойр, тухтай үйлчилгээг хүргэх шинэ орон зайгаа танилцуулж байна.',
    image: '/news-team.svg',
  },
  {
    id: 'healthy-home',
    title: 'Эрүүл гэр бүлийн өдөр тутмын сонголт',
    description: 'Өдөр тутмын хэрэглээнд байгальд ээлтэй бүтээгдэхүүн сонгох энгийн зөвлөгөөг хүргэе.',
    image: '/news-team.svg',
  },
  {
    id: 'community',
    title: 'Хамтын үнэ цэнийг бүтээх нь',
    description: 'Hiliving-ийн хамт олон нийгмийн сайн сайхны төлөөх шинэ санаачилгаа эхлүүллээ.',
    image: '/news-team.svg',
  },
]

const brandNames = ['TEZBLANC', 'BLUWELL', 'ENTREE', 'RAPHA402', 'MAMARTE']

export const brands: Brand[] = Array.from({ length: 20 }, (_, index) => ({
  id: `brand-${index + 1}`,
  name: brandNames[index % brandNames.length],
}))
