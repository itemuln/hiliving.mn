import { Link } from 'react-router-dom';
import { CircleCheck } from 'lucide-react';
import { AccountShell } from '../features/account/AccountShell';
import { EmailVerificationStatus } from '../features/account/EmailVerificationStatus';
import { MembershipCard } from '../features/account/MembershipCard';
import { useAuth } from '../features/auth/useAuth';

export function AccountPage() {
  const { state } = useAuth();
  if (state.status !== 'authenticated') return null;
  return (
    <AccountShell title={`Сайн байна уу, ${state.user.firstName}`}>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <MembershipCard membership={state.user.membership} />
        <section
          aria-labelledby="account-information-title"
          className="rounded-2xl border border-neutral-200 p-6 text-sm text-neutral-600"
        >
          <div className="flex items-center justify-between gap-4">
            <h2 id="account-information-title" className="font-medium text-neutral-800">
              Бүртгэлийн мэдээлэл
            </h2>
            <Link
              to="/account/profile"
              className="shrink-0 text-xs font-medium text-brand-600 underline underline-offset-4"
            >
              Мэдээлэл засах
            </Link>
          </div>
          <dl className="mt-5 space-y-4">
            <div>
              <dt className="text-xs text-neutral-400">И-мэйл</dt>
              <dd className="mt-1 flex min-w-0 items-center gap-2 text-neutral-700">
                <span className="break-all">{state.user.email}</span>
                {state.user.emailVerified ? (
                  <span
                    role="img"
                    aria-label="Имэйл баталгаажсан"
                    className="shrink-0 text-green-600"
                  >
                    <CircleCheck aria-hidden="true" className="h-4 w-4" />
                  </span>
                ) : null}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-neutral-400">Утас</dt>
              <dd className="mt-1 text-neutral-700">{state.user.phoneNumber}</dd>
            </div>
          </dl>
          {!state.user.emailVerified ? (
            <div className="mt-5 border-t border-neutral-200 pt-5">
              <EmailVerificationStatus />
            </div>
          ) : null}
        </section>
      </div>
    </AccountShell>
  );
}
