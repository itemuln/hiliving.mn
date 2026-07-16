import { useState, type FormEvent } from 'react';
import { changePassword } from '../../api/accountApi';
import { fieldClass, primaryButtonClass } from '../auth/AuthPageShell';
import { authErrorMessage } from '../auth/authErrorMessage';

export function PasswordChangeForm() {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);
    const form = event.currentTarget;
    const data = new FormData(form);
    const newPassword = String(data.get('newPassword') ?? '');
    const confirmation = String(data.get('confirmation') ?? '');
    if (newPassword !== confirmation) {
      setError('Шинэ нууц үг таарахгүй байна.');
      setSubmitting(false);
      return;
    }
    try {
      await changePassword({
        currentPassword: String(data.get('currentPassword') ?? ''),
        newPassword,
      });
      form.reset();
      setSuccess('Нууц үг амжилттай шинэчлэгдлээ.');
    } catch (failure) {
      setError(authErrorMessage(failure));
    } finally {
      setSubmitting(false);
    }
  }
  return (
    <form onSubmit={submit} className="max-w-xl space-y-5">
      {error ? (
        <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      {success ? (
        <p role="status" className="rounded-xl bg-green-50 p-3 text-sm text-green-700">
          {success}
        </p>
      ) : null}
      <label className="block text-sm font-medium">
        Одоогийн нууц үг
        <input
          className={fieldClass}
          name="currentPassword"
          type="password"
          required
          autoComplete="current-password"
        />
      </label>
      <label className="block text-sm font-medium">
        Шинэ нууц үг
        <input
          className={fieldClass}
          name="newPassword"
          type="password"
          required
          minLength={10}
          autoComplete="new-password"
        />
      </label>
      <label className="block text-sm font-medium">
        Шинэ нууц үг давтах
        <input
          className={fieldClass}
          name="confirmation"
          type="password"
          required
          minLength={10}
          autoComplete="new-password"
        />
      </label>
      <button className={`${primaryButtonClass} sm:w-auto`} disabled={submitting}>
        {submitting ? 'Шинэчилж байна…' : 'Нууц үг шинэчлэх'}
      </button>
    </form>
  );
}
