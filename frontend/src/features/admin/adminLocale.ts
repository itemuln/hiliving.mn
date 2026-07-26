import type { InventoryState, ProductLifecycle } from './admin.types';

const lifecycleLabels: Record<ProductLifecycle, string> = {
  DRAFT: 'Ноорог',
  ACTIVE: 'Нийтэлсэн',
  ARCHIVED: 'Архивласан',
};

const inventoryLabels: Record<InventoryState, string> = {
  IN_STOCK: 'Нөөцтэй',
  LOW_STOCK: 'Нөөц багассан',
  OUT_OF_STOCK: 'Нөөц дууссан',
};

const accountStatusLabels: Record<string, string> = {
  ACTIVE: 'Идэвхтэй',
  DISABLED: 'Идэвхгүй',
  LOCKED: 'Түгжигдсэн',
};

const membershipLabels: Record<string, string> = {
  REGULAR: 'Ердийн',
  BRONZE: 'Хүрэл',
  SILVER: 'Мөнгө',
  GOLD: 'Алт',
};

export const adminDate = new Intl.DateTimeFormat('mn-MN', { dateStyle: 'medium' });
export const adminDateTime = new Intl.DateTimeFormat('mn-MN', {
  dateStyle: 'medium',
  timeStyle: 'short',
});
export const adminMoney = new Intl.NumberFormat('mn-MN');

export const lifecycleLabel = (value: ProductLifecycle) => lifecycleLabels[value];
export const inventoryLabel = (value: InventoryState) => inventoryLabels[value];
export const accountStatusLabel = (value: string) => accountStatusLabels[value] ?? value;
export const membershipLabel = (value: string) => membershipLabels[value] ?? value;
