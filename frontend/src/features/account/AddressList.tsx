import { useCallback, useEffect, useState } from 'react'
import { createAddress, deleteAddress, getAddresses, updateAddress } from '../../api/accountApi'
import { authErrorMessage } from '../auth/authErrorMessage'
import { AddressForm } from './AddressForm'
import type { Address, AddressInput } from './account.types'

export function AddressList() {
  const [addresses, setAddresses] = useState<readonly Address[]>([]); const [editing, setEditing] = useState<Address | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading'); const [error, setError] = useState(''); const [busy, setBusy] = useState(false)
  const load = useCallback(async () => { setStatus('loading'); try { setAddresses(await getAddresses()); setStatus('ready') } catch (failure) { setError(authErrorMessage(failure)); setStatus('error') } }, [])
  useEffect(() => { void load() }, [load])

  async function save(input: AddressInput) {
    setBusy(true); setError('')
    try { if (editing) await updateAddress(editing.id, input); else await createAddress(input); setEditing(null); await load() }
    catch (failure) { setError(authErrorMessage(failure)) } finally { setBusy(false) }
  }
  async function remove(address: Address) {
    if (!window.confirm(`“${address.label}” хаягийг устгах уу?`)) return
    setBusy(true); try { await deleteAddress(address.id); await load() } catch (failure) { setError(authErrorMessage(failure)) } finally { setBusy(false) }
  }

  return <div className="space-y-6">
    {error ? <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error} {status === 'error' ? <button onClick={() => void load()} className="ml-2 underline">Дахин оролдох</button> : null}</p> : null}
    {status === 'loading' ? <div className="h-28 animate-pulse rounded-2xl bg-neutral-100" aria-label="Хаяг уншиж байна" /> : null}
    {status === 'ready' && addresses.length === 0 ? <p className="rounded-2xl border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-500">Хүргэлтийн хаяг нэмээгүй байна.</p> : null}
    {addresses.map((address) => <article key={address.id} className="min-w-0 rounded-2xl border border-neutral-200 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><h2 className="font-semibold text-neutral-800">{address.label} {address.defaultAddress ? <span className="ml-2 rounded-full bg-brand-50 px-2 py-1 text-xs text-brand-600">Үндсэн</span> : null}</h2><p className="mt-2 break-words text-sm leading-6 text-neutral-600">{address.cityOrProvince}, {address.districtOrSoum}, {address.khorooOrBag ? `${address.khorooOrBag}, ` : ''}{address.addressLine}</p><p className="mt-1 text-sm text-neutral-500">{address.recipientName} · {address.recipientPhone}</p></div><div className="flex gap-2"><button onClick={() => setEditing(address)} className="rounded-lg border px-3 py-2 text-xs">Засах</button><button disabled={busy} onClick={() => void remove(address)} className="rounded-lg border border-red-200 px-3 py-2 text-xs text-red-600">Устгах</button></div></div>
    </article>)}
    <AddressForm editing={editing} onSubmit={save} onCancel={() => setEditing(null)} busy={busy} />
  </div>
}
