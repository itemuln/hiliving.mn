import { AccountApiError } from '../../api/accountApi'

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
}

export function authErrorMessage(error: unknown) {
  return error instanceof AccountApiError
    ? messages[error.code] ?? 'Хүсэлтийг гүйцэтгэж чадсангүй. Дахин оролдоно уу.'
    : 'Хүсэлтийг гүйцэтгэж чадсангүй. Дахин оролдоно уу.'
}
