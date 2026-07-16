import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { authErrorMessage } from './authErrorMessage'
import { fieldClass, primaryButtonClass } from './AuthPageShell'
import { useAuth } from './useAuth'

export function RegisterForm() {
  const { register } = useAuth()
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setSubmitting(true)
    const data = new FormData(event.currentTarget)
    try {
      await register({
        firstName: String(data.get('firstName') ?? ''), lastName: String(data.get('lastName') ?? ''),
        phoneNumber: String(data.get('phoneNumber') ?? ''), email: String(data.get('email') ?? ''),
        password: String(data.get('password') ?? ''),
      })
      setSuccess(true)
    } catch (failure) { setError(authErrorMessage(failure)) }
    finally { setSubmitting(false) }
  }

  if (success) return <div role="status" className="rounded-xl bg-green-50 p-5 text-sm leading-6 text-green-800">
    Бүртгэл амжилттай үүслээ. <Link to="/login" className="font-semibold underline">Одоо нэвтрэх</Link>
  </div>
  return <form onSubmit={submit} className="space-y-5">
    {error ? <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="block text-sm font-medium text-neutral-700">Нэр<input className={fieldClass} name="firstName" required maxLength={100} autoComplete="given-name" /></label>
      <label className="block text-sm font-medium text-neutral-700">Овог<input className={fieldClass} name="lastName" required maxLength={100} autoComplete="family-name" /></label>
    </div>
    <label className="block text-sm font-medium text-neutral-700">Утасны дугаар<input className={fieldClass} name="phoneNumber" required maxLength={30} inputMode="tel" autoComplete="tel" placeholder="99112233" /></label>
    <label className="block text-sm font-medium text-neutral-700">Имэйл<input className={fieldClass} name="email" type="email" required maxLength={254} autoComplete="email" /></label>
    <label className="block text-sm font-medium text-neutral-700">Нууц үг<input className={fieldClass} name="password" type="password" required minLength={10} autoComplete="new-password" /><span className="mt-1 block text-xs font-normal text-neutral-400">10-аас дээш тэмдэгт, үсэг болон тоо агуулна.</span></label>
    <button className={primaryButtonClass} disabled={submitting}>{submitting ? 'Бүртгэж байна…' : 'Бүртгүүлэх'}</button>
    <p className="text-center text-sm text-neutral-500">Бүртгэлтэй юу? <Link className="font-medium text-brand-600 hover:underline" to="/login">Нэвтрэх</Link></p>
  </form>
}
