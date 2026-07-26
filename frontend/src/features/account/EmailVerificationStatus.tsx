import { useState } from 'react';
import { requestEmailVerification } from '../../api/accountApi';
import { authErrorMessage } from '../auth/authErrorMessage';
import { useAuth } from '../auth/useAuth';

export function EmailVerificationStatus() {
  const { state } = useAuth();
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  if (state.status !== 'authenticated' || state.user.emailVerified) return null;

  async function resend() {
    setSending(true);
    setMessage('');
    setError('');
    try {
      await requestEmailVerification();
      setMessage('Хэрэв баталгаажуулах шаардлагатай бол шинэ заавар илгээгдлээ.');
    } catch (failure) {
      setError(authErrorMessage(failure));
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="text-sm">
      <p className="font-medium text-amber-700">Имэйл баталгаажаагүй</p>
      <p className="mt-1 leading-6 text-neutral-500">
        Нууц үг сэргээхийн тулд имэйл хаягаа баталгаажуулна уу.
      </p>
      {message ? (
        <p role="status" className="mt-3 leading-6 text-neutral-600">
          {message}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="mt-3 text-red-700">
          {error}
        </p>
      ) : null}
      <button
        type="button"
        disabled={sending}
        onClick={() => void resend()}
        className="mt-3 rounded-lg border border-neutral-300 px-3 py-2 text-xs font-medium text-neutral-700 transition hover:border-brand-400 hover:text-brand-600 disabled:opacity-60"
      >
        {sending ? 'Илгээж байна…' : 'Баталгаажуулах имэйл авах'}
      </button>
    </div>
  );
}
