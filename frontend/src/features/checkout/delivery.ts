export type DeliveryMethod = 'STANDARD_DELIVERY' | 'SELF_PICKUP';

export const SELF_PICKUP_LOCATION = {
  label: 'Туршилтын байршил',
  name: 'Hiliving Mongolia төв оффис',
  address: 'Улаанбаатар, Хан-Уул дүүрэг, 17-р хороо, Зайсангийн гүүрний урд',
  hours: 'Даваа–Бямба 10:00–20:00 · Ням амарна',
  phone: '7755-8888',
} as const;

export function deliveryMethodLabel(deliveryMethod: DeliveryMethod) {
  return deliveryMethod === 'SELF_PICKUP' ? 'Өөрөө авах' : 'Стандарт хүргэлт';
}
