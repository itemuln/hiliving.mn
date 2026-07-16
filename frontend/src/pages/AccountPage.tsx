import { AccountShell } from '../features/account/AccountShell'
import { MembershipCard } from '../features/account/MembershipCard'
import { useAuth } from '../features/auth/useAuth'

export function AccountPage() {
  const { state } = useAuth()
  if (state.status !== 'authenticated') return null
  return <AccountShell title={`Сайн байна уу, ${state.user.firstName}`}>
    <div className="grid gap-6 lg:grid-cols-2">
      <MembershipCard membership={state.user.membership} />
      <div className="rounded-2xl border border-neutral-200 p-6 text-sm leading-7 text-neutral-600">
        <p className="font-medium text-neutral-800">Бүртгэлийн мэдээлэл</p>
        <p className="mt-3 break-all">{state.user.email}</p><p>{state.user.phoneNumber}</p>
        <p className="mt-3 text-xs text-neutral-400">Захиалгын түүх дараагийн үе шатанд нэмэгдэнэ.</p>
      </div>
    </div>
  </AccountShell>
}
