import { environment } from '../../config/environment';

export interface MapPoint {
  readonly latitude: number;
  readonly longitude: number;
}

export interface MapAddressSelection extends MapPoint {
  readonly cityOrProvince: string;
  readonly districtOrSoum: string;
  readonly khorooOrBag: string;
  readonly addressLine: string;
  readonly displayName: string;
}

interface NominatimAddress {
  readonly amenity?: string;
  readonly borough?: string;
  readonly building?: string;
  readonly city?: string;
  readonly city_district?: string;
  readonly county?: string;
  readonly district?: string;
  readonly hamlet?: string;
  readonly house_number?: string;
  readonly municipality?: string;
  readonly neighbourhood?: string;
  readonly pedestrian?: string;
  readonly province?: string;
  readonly quarter?: string;
  readonly residential?: string;
  readonly road?: string;
  readonly state?: string;
  readonly suburb?: string;
  readonly town?: string;
  readonly village?: string;
}

interface NominatimReverseResponse {
  readonly address?: NominatimAddress;
  readonly display_name?: string;
  readonly error?: string;
}

function firstValue(...values: Array<string | undefined>) {
  return values.find((value) => value?.trim())?.trim() ?? '';
}

function limited(value: string, maximumLength: number) {
  return Array.from(value).slice(0, maximumLength).join('');
}

export function cleanPickedAddress(value: string) {
  return value
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part && !/^\d{5}$/.test(part) && !/^Монгол улс(?:\s|$)/i.test(part))
    .join(', ');
}

export async function reverseGeocode(
  point: MapPoint,
  signal?: AbortSignal
): Promise<MapAddressSelection> {
  const url = new URL(`${environment.nominatimBaseUrl}/reverse`);
  url.search = new URLSearchParams({
    format: 'jsonv2',
    lat: String(point.latitude),
    lon: String(point.longitude),
    zoom: '18',
    addressdetails: '1',
    'accept-language': 'mn,en',
  }).toString();

  const response = await fetch(url, {
    signal,
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) {
    throw new Error(`Хаяг тодорхойлох үйлчилгээ ${response.status} алдаа буцаалаа.`);
  }

  const result = (await response.json()) as NominatimReverseResponse;
  if (result.error) throw new Error(result.error);

  const address = result.address ?? {};
  const displayName = cleanPickedAddress(result.display_name?.trim() ?? '');
  if (!displayName) throw new Error('Сонгосон байршлын хаяг олдсонгүй.');

  const cityOrProvince = firstValue(
    address.city,
    address.town,
    address.municipality,
    address.state,
    address.province,
    'Улаанбаатар'
  );
  const districtOrSoum = firstValue(
    address.city_district,
    address.borough,
    address.district,
    address.county,
    address.suburb
  );
  const khorooOrBag = firstValue(
    address.quarter,
    address.neighbourhood,
    address.suburb,
    address.village,
    address.hamlet
  );
  const street = firstValue(address.road, address.pedestrian, address.residential);
  const premises = firstValue(address.house_number, address.building, address.amenity);
  const addressLine = firstValue(
    street ? [premises, street].filter(Boolean).join(', ') : '',
    displayName
  );

  return {
    ...point,
    cityOrProvince: limited(cityOrProvince, 120),
    districtOrSoum: limited(districtOrSoum, 120),
    khorooOrBag: limited(khorooOrBag, 120),
    addressLine: limited(addressLine, 300),
    displayName,
  };
}
