import { AccountApiError } from '../../api/accountApi';

export function cartErrorMessage(error: unknown) {
  const code = error instanceof AccountApiError ? error.code : 'REQUEST_FAILED';
  if (code === 'OUT_OF_STOCK')
    return 'Сагсан дахь бүтээгдэхүүний нөөц дууссан. Барааг хасаж үргэлжлүүлнэ үү.';
  if (code === 'QUANTITY_EXCEEDS_STOCK')
    return 'Сонгосон тоо үлдэгдлээс их байна. Тоог багасгана уу.';
  if (code === 'PRODUCT_NOT_AVAILABLE' || code === 'PRODUCT_NOT_FOUND')
    return 'Сагсан дахь нэг бүтээгдэхүүн худалдаанд байхгүй болсон. Барааг хасаж үргэлжлүүлнэ үү.';
  if (code === 'ADDRESS_NOT_FOUND') return 'Сонгосон хүргэлтийн хаяг олдсонгүй.';
  if (code === 'DUPLICATE_ORDER_SUBMISSION')
    return 'Энэ захиалгын оролдлого өөр мэдээллээр өмнө ашиглагдсан байна. Дахин шалгана уу.';
  if (code === 'SERVICE_UNAVAILABLE') return 'Үйлчилгээтэй холбогдож чадсангүй. Дахин оролдоно уу.';
  return 'Мэдээллийг баталгаажуулж чадсангүй. Дахин оролдоно уу.';
}
