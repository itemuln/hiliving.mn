import { AccountShell } from '../features/account/AccountShell';
import { MembershipCard } from '../features/account/MembershipCard';
import { EmailVerificationCard } from '../features/account/EmailVerificationCard';
import { useAuth } from '../features/auth/useAuth';
import { Link } from 'react-router-dom';

export function AccountPage() {
  const { state } = useAuth();
  if (state.status !== 'authenticated') return null;
  return (
    <AccountShell title={`Сайн байна уу, ${state.user.firstName}`}>
      <div className="grid gap-6 lg:grid-cols-2">
        <MembershipCard membership={state.user.membership} />
        <EmailVerificationCard />
        <div className="rounded-2xl border border-neutral-200 p-6 text-sm leading-7 text-neutral-600">
          <p className="font-medium text-neutral-800">Бүртгэлийн мэдээлэл</p>
          <p className="mt-3 break-all">{state.user.email}</p>
          <p>{state.user.phoneNumber}</p>
          <Link to="/account/orders" className="mt-4 inline-flex text-brand-600 underline">
            Миний захиалгуудыг харах
          </Link>
        </div>
      </div>
    </AccountShell>
  );
}
