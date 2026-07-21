import { useState } from 'react';
import { requestEmailVerification } from '../../api/accountApi';
import { authErrorMessage } from '../auth/authErrorMessage';
import { useAuth } from '../auth/useAuth';

export function EmailVerificationCard() {
  const { state } = useAuth();
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  if (state.status !== 'authenticated') return null;

  if (state.user.emailVerified) {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-6 text-sm text-green-800">
        <p className="font-medium">Имэйл баталгаажсан</p>
        <p className="mt-2 break-all">{state.user.email}</p>
      </div>
    );
  }

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
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
      <p className="font-medium">Имэйл баталгаажаагүй</p>
      <p className="mt-2 leading-6">Нууц үг сэргээхийн тулд имэйл хаягаа баталгаажуулна уу.</p>
      {message ? <p role="status" className="mt-3 leading-6">{message}</p> : null}
      {error ? <p role="alert" className="mt-3 text-red-700">{error}</p> : null}
      <button
        type="button"
        disabled={sending}
        onClick={() => void resend()}
        className="mt-4 rounded-xl bg-brand-500 px-4 py-2 font-medium text-white disabled:opacity-60"
      >
        {sending ? 'Илгээж байна…' : 'Баталгаажуулах имэйл авах'}
      </button>
    </div>
  );
}
