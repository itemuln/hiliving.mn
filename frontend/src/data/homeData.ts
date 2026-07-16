export interface NewsItem {
  id: string;
  title: string;
  description: string;
  image: string;
}

export interface Banner {
  id: string;
  image: string;
  alt: string;
}

export const navigation = ['Дэлгүүр хэсэх', 'Hiliving MGL', 'Брэндүүд', 'Мэдээлэл', 'Холбоо барих'];

export const heroBanners: Banner[] = [
  { id: 'special', image: '/hero-special.svg', alt: 'Special Price онцгой үнийн урамшуулал' },
  { id: 'wellness', image: '/hero-wellness.svg', alt: 'Өдөр бүр эрүүл сонголт урамшуулал' },
];

export const promotionalBanners: Banner[] = [
  { id: 'winter', image: '/promo-winter.svg', alt: 'Өвлийн тусгай хямдрал' },
  { id: 'spring', image: '/promo-spring.svg', alt: 'Хаврын шинэчлэл урамшуулал' },
];

export const newsItems: NewsItem[] = [
  {
    id: 'new-office',
    title: 'Hiliving Mongolia шинэ төв оффисоо нээлээ',
    description:
      'Бид хэрэглэгчдэдээ илүү ойр, тухтай үйлчилгээг хүргэх шинэ орон зайгаа танилцуулж байна.',
    image: '/news-team.svg',
  },
  {
    id: 'healthy-home',
    title: 'Эрүүл гэр бүлийн өдөр тутмын сонголт',
    description:
      'Өдөр тутмын хэрэглээнд байгальд ээлтэй бүтээгдэхүүн сонгох энгийн зөвлөгөөг хүргэе.',
    image: '/news-team.svg',
  },
  {
    id: 'community',
    title: 'Хамтын үнэ цэнийг бүтээх нь',
    description: 'Hiliving-ийн хамт олон нийгмийн сайн сайхны төлөөх шинэ санаачилгаа эхлүүллээ.',
    image: '/news-team.svg',
  },
];
