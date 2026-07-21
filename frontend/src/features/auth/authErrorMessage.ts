import { AccountApiError } from '../../api/accountApi';

const messages: Record<string, string> = {
  INVALID_CREDENTIALS: 'Имэйл, утасны дугаар эсвэл нууц үг буруу байна.',
  ACCOUNT_DISABLED: 'Таны бүртгэл идэвхгүй байна. Үйлчилгээний төвтэй холбогдоно уу.',
  ACCOUNT_LOCKED: 'Олон удаагийн оролдлогын улмаас бүртгэл түр түгжигдсэн байна.',
  EMAIL_ALREADY_REGISTERED: 'Энэ имэйл хаяг бүртгэлтэй байна.',
  PHONE_ALREADY_REGISTERED: 'Энэ утасны дугаар бүртгэлтэй байна.',
  CURRENT_PASSWORD_INVALID: 'Одоогийн нууц үг буруу байна.',
  PASSWORD_POLICY_VIOLATION: 'Нууц үг 10-аас дээш тэмдэгттэй, үсэг болон тоо агуулсан байна.',
  VALIDATION_ERROR: 'Оруулсан мэдээллээ шалгана уу.',
  SERVICE_UNAVAILABLE: 'Үйлчилгээтэй холбогдож чадсангүй. Дахин оролдоно уу.',
  RATE_LIMITED: 'Хэт олон удаа оролдлоо. Түр хүлээгээд дахин оролдоно уу.',
  PASSWORD_CONFIRMATION_MISMATCH: 'Шинэ нууц үгнүүд хоорондоо таарахгүй байна.',
  PASSWORD_RESET_TOKEN_INVALID: 'Энэ холбоос хүчингүй, хугацаа дууссан эсвэл өмнө ашиглагдсан байна.',
  EMAIL_VERIFICATION_TOKEN_INVALID: 'Баталгаажуулах холбоос хүчингүй эсвэл өмнө ашиглагдсан байна.',
  EMAIL_VERIFICATION_TOKEN_EXPIRED: 'Баталгаажуулах холбоосын хугацаа дууссан байна.',
};

export function authErrorMessage(error: unknown) {
  return error instanceof AccountApiError
    ? messages[error.code] ?? 'Хүсэлтийг гүйцэтгэж чадсангүй. Дахин оролдоно уу.'
    : 'Хүсэлтийг гүйцэтгэж чадсангүй. Дахин оролдоно уу.';
}
