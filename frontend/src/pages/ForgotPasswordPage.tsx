import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { requestPasswordReset } from '../api/accountApi';
import { authErrorMessage } from '../features/auth/authErrorMessage';
import { AuthPageShell, fieldClass, primaryButtonClass } from '../features/auth/AuthPageShell';

const acceptedMessage =
  'Хэрэв энэ имэйлээр бүртгэл байгаа бол нууц үг сэргээх заавар илгээгдлээ.';

export function ForgotPasswordPage() {
  const [submitting, setSubmitting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    const data = new FormData(event.currentTarget);
    try {
      await requestPasswordReset(String(data.get('email') ?? ''));
      setAccepted(true);
    } catch (failure) {
      setError(authErrorMessage(failure));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthPageShell title="Нууц үг сэргээх" subtitle="Бүртгэлтэй имэйл хаягаа оруулна уу.">
      {accepted ? (
        <div role="status" className="rounded-xl bg-green-50 p-5 text-sm leading-6 text-green-800">
          {acceptedMessage}
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-5">
          {error ? <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
          <label className="block text-sm font-medium text-neutral-700">
            Имэйл
            <input className={fieldClass} name="email" type="email" autoComplete="email" required maxLength={254} />
          </label>
          <button className={primaryButtonClass} disabled={submitting}>
            {submitting ? 'Илгээж байна…' : 'Сэргээх заавар авах'}
          </button>
        </form>
      )}
      <p className="mt-5 text-center text-sm">
        <Link className="font-medium text-brand-600 hover:underline" to="/login">Нэвтрэх рүү буцах</Link>
      </p>
    </AuthPageShell>
  );
}
