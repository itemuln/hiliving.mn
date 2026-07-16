import { useState, type FormEvent } from 'react';
import { updateProfile } from '../../api/accountApi';
import { fieldClass, primaryButtonClass } from '../auth/AuthPageShell';
import { authErrorMessage } from '../auth/authErrorMessage';
import { useAuth } from '../auth/useAuth';

export function ProfileForm() {
  const { state, replaceUser } = useAuth();
  const user = state.status === 'authenticated' ? state.user : null;
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  if (!user) return null;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);
    const data = new FormData(event.currentTarget);
    try {
      const updated = await updateProfile({
        firstName: String(data.get('firstName') ?? ''),
        lastName: String(data.get('lastName') ?? ''),
        email: String(data.get('email') ?? ''),
        phoneNumber: String(data.get('phoneNumber') ?? ''),
        currentPassword: String(data.get('currentPassword') ?? '') || undefined,
      });
      replaceUser(updated);
      setSuccess('Мэдээлэл амжилттай шинэчлэгдлээ.');
    } catch (failure) {
      setError(authErrorMessage(failure));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="max-w-2xl space-y-5">
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
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium">
          Нэр
          <input className={fieldClass} name="firstName" defaultValue={user.firstName} required />
        </label>
        <label className="text-sm font-medium">
          Овог
          <input className={fieldClass} name="lastName" defaultValue={user.lastName} required />
        </label>
      </div>
      <label className="block text-sm font-medium">
        Имэйл
        <input
          className={fieldClass}
          name="email"
          type="email"
          defaultValue={user.email}
          required
        />
      </label>
      <label className="block text-sm font-medium">
        Утас
        <input className={fieldClass} name="phoneNumber" defaultValue={user.phoneNumber} required />
      </label>
      <label className="block text-sm font-medium">
        Одоогийн нууц үг{' '}
        <span className="font-normal text-neutral-400">(имэйл эсвэл утас солих үед)</span>
        <input
          className={fieldClass}
          name="currentPassword"
          type="password"
          autoComplete="current-password"
        />
      </label>
      <button className={`${primaryButtonClass} sm:w-auto`} disabled={submitting}>
        {submitting ? 'Хадгалж байна…' : 'Хадгалах'}
      </button>
    </form>
  );
}
