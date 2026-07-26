import type { Membership } from '../auth/auth.types';

export function MembershipCard({ membership }: { membership: Membership }) {
  return (
    <div className="self-start rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 p-5 text-white">
      <p className="text-[11px] uppercase tracking-[0.18em] text-white/70">Гишүүнчлэл</p>
      <h2 className="mt-1.5 text-xl font-semibold">{membership.displayName}</h2>
      <p className="mt-4 text-3xl font-semibold">{membership.effectiveDiscountPercentage}%</p>
      <p className="mt-1 text-sm text-white/75">Үйлчлэх хөнгөлөлт</p>
      {membership.discountOverridePercentage !== null ? (
        <p className="mt-2 text-xs text-white/70">Тусгай хөнгөлөлт үйлчилж байна</p>
      ) : null}
    </div>
  );
}
