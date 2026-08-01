export const NEWS_CATEGORY_LABELS = {
  GENERAL: 'Ерөнхий',
  ECONOMY: 'Эдийн засаг',
  BUSINESS: 'Бизнес',
  SOCIETY: 'Нийгэм',
  HEALTH: 'Эрүүл мэнд',
  EDUCATION: 'Боловсрол',
  LIFESTYLE: 'Амьдралын хэв маяг',
} as const;

export type NewsCategory = keyof typeof NEWS_CATEGORY_LABELS;

export const NEWS_CATEGORY_OPTIONS = Object.entries(NEWS_CATEGORY_LABELS).map(
  ([value, label]) => ({ value: value as NewsCategory, label })
);
