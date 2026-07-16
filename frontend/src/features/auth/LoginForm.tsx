import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authErrorMessage } from './authErrorMessage';
import { fieldClass, primaryButtonClass } from './AuthPageShell';
import { safeReturnTo } from './returnTo';
import { useAuth } from './useAuth';

export function LoginForm() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    const data = new FormData(event.currentTarget);
    try {
      await login({
        identifier: String(data.get('identifier') ?? ''),
        password: String(data.get('password') ?? ''),
      });
      navigate(safeReturnTo(params.get('returnTo')), { replace: true });
    } catch (failure) {
      setError(authErrorMessage(failure));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      {error ? (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      <label className="block text-sm font-medium text-neutral-700">
        Имэйл эсвэл утас
        <input
          className={fieldClass}
          name="identifier"
          autoComplete="username"
          required
          maxLength={254}
        />
      </label>
      <label className="block text-sm font-medium text-neutral-700">
        Нууц үг
        <input
          className={fieldClass}
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </label>
      <button className={primaryButtonClass} disabled={submitting}>
        {submitting ? 'Нэвтэрч байна…' : 'Нэвтрэх'}
      </button>
      <p className="text-center text-sm text-neutral-500">
        Бүртгэлгүй юу?{' '}
        <Link className="font-medium text-brand-600 hover:underline" to="/register">
          Бүртгүүлэх
        </Link>
      </p>
    </form>
  );
}
