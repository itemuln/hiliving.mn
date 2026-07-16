import { type FormEvent } from 'react'
import type { Address, AddressInput } from './account.types'
import { fieldClass, primaryButtonClass } from '../auth/AuthPageShell'

export function AddressForm({ editing, onSubmit, onCancel, busy }: { editing: Address | null; onSubmit(input: AddressInput): Promise<void>; onCancel(): void; busy: boolean }) {
  const key = editing?.id ?? 'new'
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = event.currentTarget; const data = new FormData(form)
    await onSubmit({
      label: String(data.get('label') ?? ''), cityOrProvince: String(data.get('cityOrProvince') ?? ''),
      districtOrSoum: String(data.get('districtOrSoum') ?? ''), khorooOrBag: String(data.get('khorooOrBag') ?? '') || null,
      addressLine: String(data.get('addressLine') ?? ''), additionalDetails: String(data.get('additionalDetails') ?? '') || null,
      recipientName: String(data.get('recipientName') ?? ''), recipientPhone: String(data.get('recipientPhone') ?? ''),
      defaultAddress: data.get('defaultAddress') === 'on',
    })
    if (!editing) form.reset()
  }
  return <form key={key} onSubmit={submit} className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 sm:p-5">
    <h2 className="font-semibold text-neutral-800">{editing ? 'Хаяг засах' : 'Шинэ хаяг'}</h2>
    <div className="mt-4 grid gap-4 sm:grid-cols-2">
      <label className="text-sm font-medium">Нэршил<input className={fieldClass} name="label" defaultValue={editing?.label} placeholder="Гэр" required /></label>
      <label className="text-sm font-medium">Хот / аймаг<input className={fieldClass} name="cityOrProvince" defaultValue={editing?.cityOrProvince} required /></label>
      <label className="text-sm font-medium">Дүүрэг / сум<input className={fieldClass} name="districtOrSoum" defaultValue={editing?.districtOrSoum} required /></label>
      <label className="text-sm font-medium">Хороо / баг<input className={fieldClass} name="khorooOrBag" defaultValue={editing?.khorooOrBag ?? ''} /></label>
      <label className="text-sm font-medium sm:col-span-2">Дэлгэрэнгүй хаяг<input className={fieldClass} name="addressLine" defaultValue={editing?.addressLine} required /></label>
      <label className="text-sm font-medium sm:col-span-2">Нэмэлт тайлбар<textarea className={`${fieldClass} min-h-20 resize-y`} name="additionalDetails" defaultValue={editing?.additionalDetails ?? ''} /></label>
      <label className="text-sm font-medium">Хүлээн авагч<input className={fieldClass} name="recipientName" defaultValue={editing?.recipientName} required /></label>
      <label className="text-sm font-medium">Хүлээн авагчийн утас<input className={fieldClass} name="recipientPhone" defaultValue={editing?.recipientPhone} required /></label>
    </div>
    <label className="mt-4 flex items-center gap-2 text-sm"><input type="checkbox" name="defaultAddress" defaultChecked={editing?.defaultAddress} /> Үндсэн хаяг болгох</label>
    <div className="mt-5 flex flex-wrap gap-3"><button disabled={busy} className={`${primaryButtonClass} w-auto`}>{busy ? 'Хадгалж байна…' : 'Хадгалах'}</button>{editing ? <button type="button" onClick={onCancel} className="rounded-xl border border-neutral-300 px-5 py-3 text-sm">Болих</button> : null}</div>
  </form>
}
