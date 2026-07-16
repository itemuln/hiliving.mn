import type { Membership } from '../auth/auth.types'

export function MembershipCard({ membership }: { membership: Membership }) {
  return <div className="rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 p-6 text-white">
    <p className="text-xs uppercase tracking-[0.2em] text-white/70">Гишүүнчлэл</p>
    <h2 className="mt-2 text-2xl font-semibold">{membership.displayName}</h2>
    <p className="mt-5 text-4xl font-semibold">{membership.effectiveDiscountPercentage}%</p>
    <p className="mt-1 text-sm text-white/75">Үйлчлэх хөнгөлөлт</p>
    {membership.discountOverridePercentage !== null ? <p className="mt-3 text-xs text-white/70">Тусгай хөнгөлөлт үйлчилж байна</p> : null}
  </div>
}
