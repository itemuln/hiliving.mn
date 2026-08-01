export const NEWS_CATEGORY_LABELS = {
  TRAINING: 'Сургалт',
  NEWS: 'Мэдээ',
  INFORMATION: 'Мэдээлэл',
} as const;

export type NewsCategory = keyof typeof NEWS_CATEGORY_LABELS;

export const NEWS_CATEGORY_OPTIONS = Object.entries(NEWS_CATEGORY_LABELS).map(
  ([value, label]) => ({ value: value as NewsCategory, label })
);
