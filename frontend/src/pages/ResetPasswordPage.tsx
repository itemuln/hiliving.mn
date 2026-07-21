import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { confirmPasswordReset } from '../api/accountApi';
import { authErrorMessage } from '../features/auth/authErrorMessage';
import { AuthPageShell, fieldClass, primaryButtonClass } from '../features/auth/AuthPageShell';

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [token] = useState(() => params.get('token') ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (token) navigate('/reset-password', { replace: true });
  }, [navigate, token]);

  useEffect(() => {
    if (!complete) return;
    const timer = window.setTimeout(() => navigate('/login', { replace: true }), 1500);
    return () => window.clearTimeout(timer);
  }, [complete, navigate]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    const data = new FormData(event.currentTarget);
    const newPassword = String(data.get('newPassword') ?? '');
    const confirmPassword = String(data.get('confirmPassword') ?? '');
    if (newPassword !== confirmPassword) {
      setError('Шинэ нууц үгнүүд хоорондоо таарахгүй байна.');
      return;
    }
    setSubmitting(true);
    try {
      await confirmPasswordReset({ token, newPassword, confirmPassword });
      setComplete(true);
    } catch (failure) {
      setError(authErrorMessage(failure));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthPageShell title="Шинэ нууц үг" subtitle="Нууц үгээ аюулгүй шинэчилнэ үү.">
      {!token ? (
        <p role="alert" className="rounded-xl bg-amber-50 p-5 text-sm leading-6 text-amber-800">
          Сэргээх холбоос дутуу байна. Шинэ хүсэлт гаргана уу.
        </p>
      ) : complete ? (
        <p role="status" className="rounded-xl bg-green-50 p-5 text-sm leading-6 text-green-800">
          Нууц үг амжилттай шинэчлэгдлээ. Нэвтрэх хуудас руу шилжүүлж байна…
        </p>
      ) : (
        <form onSubmit={submit} className="space-y-5">
          {error ? <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
          <label className="block text-sm font-medium text-neutral-700">
            Шинэ нууц үг
            <input className={fieldClass} name="newPassword" type="password" autoComplete="new-password" required minLength={10} maxLength={128} />
          </label>
          <label className="block text-sm font-medium text-neutral-700">
            Шинэ нууц үг давтах
            <input className={fieldClass} name="confirmPassword" type="password" autoComplete="new-password" required minLength={10} maxLength={128} />
          </label>
          <p className="text-xs leading-5 text-neutral-500">10-аас дээш тэмдэгт, дор хаяж нэг үсэг болон нэг тоо агуулна.</p>
          <button className={primaryButtonClass} disabled={submitting}>{submitting ? 'Шинэчилж байна…' : 'Нууц үг шинэчлэх'}</button>
        </form>
      )}
      <p className="mt-5 text-center text-sm"><Link className="font-medium text-brand-600 hover:underline" to="/login">Нэвтрэх рүү буцах</Link></p>
    </AuthPageShell>
  );
}
