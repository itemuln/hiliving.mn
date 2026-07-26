const orderLabels: Record<string, string> = {
  PENDING_PAYMENT: 'Төлбөр хүлээж байна',
  PENDING_CONFIRMATION: 'Баталгаажуулалт хүлээж байна',
  CONFIRMED: 'Баталгаажсан',
  PROCESSING: 'Бэлтгэж байна',
  SHIPPED: 'Хүргэлтэд гарсан',
  DELIVERED: 'Хүргэгдсэн',
  CANCELLED: 'Цуцлагдсан',
};

const paymentLabels: Record<string, string> = {
  PENDING: 'Төлбөр хүлээж байна',
  PAID: 'Төлөгдсөн',
  FAILED: 'Амжилтгүй',
  EXPIRED: 'Хугацаа дууссан',
  REFUNDED: 'Буцаагдсан',
};

export const orderStatusLabel = (status: string) => orderLabels[status] ?? status;
export const paymentStatusLabel = (status: string) => paymentLabels[status] ?? status;

export const statusTone = (status: string) => {
  if (status === 'PAID' || status === 'CONFIRMED' || status === 'DELIVERED') {
    return 'bg-emerald-50 text-emerald-700';
  }
  if (status === 'FAILED' || status === 'EXPIRED' || status === 'CANCELLED') {
    return 'bg-red-50 text-red-700';
  }
  return 'bg-amber-50 text-amber-700';
};
