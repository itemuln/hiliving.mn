import { lazy, Suspense, type FormEvent, useEffect, useState } from 'react';
import type { Address, AddressInput } from './account.types';
import type { MapAddressSelection } from './addressMap';
import { fieldClass, primaryButtonClass } from '../auth/AuthPageShell';
import { useOptionalAuth } from '../auth/useAuth';
import {
  canonicalDistrict,
  canonicalKhoroo,
  districtKhoroos,
  ulaanbaatarDistricts,
} from './ulaanbaatarDivisions';

const AddressMapPicker = lazy(() =>
  import('./AddressMapPicker').then((module) => ({ default: module.AddressMapPicker }))
);

interface AddressDetailsDraft {
  readonly entrance: string;
  readonly unitNumber: string;
  readonly note: string;
}

const emptyDetails: AddressDetailsDraft = { entrance: '', unitNumber: '', note: '' };

function parseDetails(value: string | null | undefined): AddressDetailsDraft {
  if (!value) return emptyDetails;
  const parts = value.split(' · ').map((part) => part.trim());
  const entrance = parts.find((part) => part.startsWith('Орц: '))?.slice(5) ?? '';
  const unitNumber = parts.find((part) => part.startsWith('Тоот: '))?.slice(6) ?? '';
  const note = parts
    .filter((part) => !part.startsWith('Орц: ') && !part.startsWith('Тоот: '))
    .join(' · ');
  return { entrance, unitNumber, note };
}

function formatDetails(details: AddressDetailsDraft) {
  const parts = [
    details.entrance.trim() ? `Орц: ${details.entrance.trim()}` : '',
    details.unitNumber.trim() ? `Тоот: ${details.unitNumber.trim()}` : '',
    details.note.trim(),
  ].filter(Boolean);
  return parts.join(' · ') || null;
}

function addressDraft(
  editing: Address | null,
  recipientName: string,
  recipientPhone: string
): AddressInput {
  if (!editing)
    return {
      label: 'Хүргэлтийн хаяг',
      cityOrProvince: 'Улаанбаатар',
      districtOrSoum: '',
      khorooOrBag: null,
      addressLine: '',
      additionalDetails: null,
      recipientName,
      recipientPhone,
      defaultAddress: false,
    };
  const district = canonicalDistrict(editing.districtOrSoum);
  return {
    label: editing.label,
    cityOrProvince: editing.cityOrProvince,
    districtOrSoum: district || editing.districtOrSoum,
    khorooOrBag: canonicalKhoroo(district, editing.khorooOrBag ?? '') || editing.khorooOrBag,
    addressLine: editing.addressLine,
    additionalDetails: editing.additionalDetails,
    recipientName: editing.recipientName,
    recipientPhone: editing.recipientPhone,
    defaultAddress: editing.defaultAddress,
  };
}

export function AddressForm({
  editing,
  onSubmit,
  onCancel,
  busy,
}: {
  editing: Address | null;
  onSubmit(input: AddressInput): Promise<void>;
  onCancel(): void;
  busy: boolean;
}) {
  const auth = useOptionalAuth();
  const accountUser = auth?.state.status === 'authenticated' ? auth.state.user : null;
  const defaultRecipientName = accountUser
    ? `${accountUser.firstName} ${accountUser.lastName}`.trim()
    : 'Хэрэглэгч';
  const defaultRecipientPhone = accountUser?.phoneNumber ?? '';
  const [draft, setDraft] = useState<AddressInput>(() =>
    addressDraft(editing, defaultRecipientName, defaultRecipientPhone)
  );
  const [details, setDetails] = useState<AddressDetailsDraft>(() =>
    parseDetails(editing?.additionalDetails)
  );
  const [mapOpen, setMapOpen] = useState(false);

  useEffect(() => {
    setDraft(addressDraft(editing, defaultRecipientName, defaultRecipientPhone));
    setDetails(parseDetails(editing?.additionalDetails));
  }, [defaultRecipientName, defaultRecipientPhone, editing]);

  function updateDraft<Field extends keyof AddressInput>(field: Field, value: AddressInput[Field]) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit({ ...draft, additionalDetails: formatDetails(details) });
    if (!editing) {
      setDraft(addressDraft(null, defaultRecipientName, defaultRecipientPhone));
      setDetails(emptyDetails);
    }
  }

  function applyMapSelection(selection: MapAddressSelection) {
    const district = canonicalDistrict(selection.districtOrSoum);
    const khoroo = canonicalKhoroo(district, selection.khorooOrBag);
    setDraft((current) => ({
      ...current,
      cityOrProvince: selection.cityOrProvince || current.cityOrProvince,
      districtOrSoum: district || current.districtOrSoum,
      khorooOrBag: khoroo || current.khorooOrBag,
      addressLine: selection.addressLine,
    }));
    setMapOpen(false);
  }

  return (
    <>
      <form
        onSubmit={submit}
        className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 sm:p-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold text-neutral-800">
              {editing ? 'Хаяг засах' : 'Шинэ хаяг'}
            </h2>
            <p className="mt-1 text-xs text-neutral-500">
              Газрын зургаас сонгох эсвэл хаягаа гараар оруулна уу.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setMapOpen(true)}
            className="rounded-xl border border-brand-200 bg-white px-4 py-2.5 text-sm font-semibold text-brand-600 transition hover:bg-brand-50"
          >
            Газрын зураг дээр сонгох
          </button>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium">
            Хот / аймаг
            <input
              className={fieldClass}
              name="cityOrProvince"
              value={draft.cityOrProvince}
              onChange={(event) => updateDraft('cityOrProvince', event.target.value)}
              required
            />
          </label>
          <label className="text-sm font-medium">
            Дүүрэг / сум
            <select
              className={fieldClass}
              name="districtOrSoum"
              value={draft.districtOrSoum}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  districtOrSoum: event.target.value,
                  khorooOrBag: null,
                }))
              }
              required
            >
              <option value="" disabled>
                Дүүрэг / сум сонгох
              </option>
              {ulaanbaatarDistricts.map((district) => (
                <option key={district} value={district}>
                  {district}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium">
            Хороо / баг
            <select
              className={fieldClass}
              name="khorooOrBag"
              value={draft.khorooOrBag ?? ''}
              onChange={(event) => updateDraft('khorooOrBag', event.target.value || null)}
              disabled={!draft.districtOrSoum}
              required
            >
              <option value="" disabled>
                Хороо / баг сонгох
              </option>
              {districtKhoroos(draft.districtOrSoum).map((khoroo) => (
                <option key={khoroo} value={khoroo}>
                  {khoroo}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium sm:col-span-2">
            Дэлгэрэнгүй хаяг
            <input
              className={fieldClass}
              name="addressLine"
              value={draft.addressLine}
              onChange={(event) => updateDraft('addressLine', event.target.value)}
              required
            />
          </label>
          <label className="text-sm font-medium">
            Орц
            <input
              className={fieldClass}
              name="entrance"
              value={details.entrance}
              onChange={(event) => setDetails({ ...details, entrance: event.target.value })}
              maxLength={50}
              placeholder="1-р орц"
            />
          </label>
          <label className="text-sm font-medium">
            Тоот
            <input
              className={fieldClass}
              name="unitNumber"
              value={details.unitNumber}
              onChange={(event) => setDetails({ ...details, unitNumber: event.target.value })}
              maxLength={50}
              placeholder="101"
            />
          </label>
          <label className="text-sm font-medium sm:col-span-2">
            Нэмэлт тайлбар
            <textarea
              className={`${fieldClass} min-h-20 resize-y`}
              name="additionalDetails"
              value={details.note}
              onChange={(event) => setDetails({ ...details, note: event.target.value })}
              maxLength={350}
            />
          </label>
          <label className="text-sm font-medium">
            Хүлээн авагчийн утас
            <input
              className={fieldClass}
              name="recipientPhone"
              value={draft.recipientPhone}
              onChange={(event) => updateDraft('recipientPhone', event.target.value)}
              required
            />
          </label>
        </div>
        <label className="mt-4 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="defaultAddress"
            checked={draft.defaultAddress}
            onChange={(event) => updateDraft('defaultAddress', event.target.checked)}
          />{' '}
          Үндсэн хаяг болгох
        </label>
        <div className="mt-5 flex flex-wrap gap-3">
          <button disabled={busy} className={`${primaryButtonClass} w-auto`}>
            {busy ? 'Хадгалж байна…' : 'Хадгалах'}
          </button>
          {editing ? (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-xl border border-neutral-300 px-5 py-3 text-sm"
            >
              Болих
            </button>
          ) : null}
        </div>
      </form>
      {mapOpen ? (
        <Suspense
          fallback={
            <div
              role="status"
              className="fixed inset-0 z-[100] grid place-items-center bg-neutral-950/60 text-sm font-semibold text-white"
            >
              Газрын зураг ачаалж байна…
            </div>
          }
        >
          <AddressMapPicker onClose={() => setMapOpen(false)} onSelect={applyMapSelection} />
        </Suspense>
      ) : null}
    </>
  );
}
