import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { confirmEmailVerification, requestEmailVerification } from '../api/accountApi';
import { authErrorMessage } from '../features/auth/authErrorMessage';
import { AuthPageShell, primaryButtonClass } from '../features/auth/AuthPageShell';
import { useAuth } from '../features/auth/useAuth';

type VerifyState = 'idle' | 'checking' | 'success' | 'error' | 'resent';

export function VerifyEmailPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { state: auth, refresh } = useAuth();
  const [token] = useState(() => params.get('token') ?? '');
  const [state, setState] = useState<VerifyState>(token ? 'checking' : 'idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) return;
    navigate('/verify-email', { replace: true });
    let active = true;
    void confirmEmailVerification(token)
      .then(async () => {
        if (!active) return;
        setState('success');
        setMessage('Имэйл хаяг амжилттай баталгаажлаа.');
        if (auth.status === 'authenticated') await refresh();
      })
      .catch((failure) => {
        if (!active) return;
        setState('error');
        setMessage(authErrorMessage(failure));
      });
    return () => { active = false; };
  }, [auth.status, navigate, refresh, token]);

  async function resend() {
    setMessage('');
    try {
      await requestEmailVerification();
      setState('resent');
      setMessage('Хэрэв баталгаажуулах шаардлагатай бол шинэ заавар илгээгдлээ.');
    } catch (failure) {
      setState('error');
      setMessage(authErrorMessage(failure));
    }
  }

  return (
    <AuthPageShell title="Имэйл баталгаажуулах" subtitle="HiLiving бүртгэлийн имэйл хаягийн баталгаажуулалт.">
      {state === 'checking' ? <p role="status" className="text-sm text-neutral-600">Баталгаажуулж байна…</p> : null}
      {message ? <p role={state === 'error' ? 'alert' : 'status'} className={`rounded-xl p-5 text-sm leading-6 ${state === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-800'}`}>{message}</p> : null}
      {state === 'idle' && auth.status === 'authenticated' && !auth.user.emailVerified ? (
        <button className={primaryButtonClass} onClick={() => void resend()}>Баталгаажуулах имэйл дахин авах</button>
      ) : null}
      {state === 'error' && auth.status === 'authenticated' && !auth.user.emailVerified ? (
        <button className={`${primaryButtonClass} mt-5`} onClick={() => void resend()}>Шинэ холбоос авах</button>
      ) : null}
      {state === 'idle' && auth.status !== 'authenticated' ? (
        <p className="text-sm leading-6 text-neutral-600">Шинэ холбоос авахын тулд <Link className="font-medium text-brand-600 underline" to="/login">нэвтэрнэ үү</Link>.</p>
      ) : null}
      <p className="mt-5 text-center text-sm"><Link className="font-medium text-brand-600 hover:underline" to="/account">Миний бүртгэл</Link></p>
    </AuthPageShell>
  );
}
