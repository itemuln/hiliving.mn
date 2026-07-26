import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanPickedAddress, reverseGeocode } from './addressMap';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('address map reverse geocoding', () => {
  it('removes the postal code and Mongolia country suffix from a picked address', () => {
    expect(
      cleanPickedAddress('Энхтайвны өргөн чөлөө, Сүхбаатар дүүрэг, 13371, Монгол улс ᠮᠤᠩᠭᠤᠯ ᠤᠯᠤᠰ')
    ).toBe('Энхтайвны өргөн чөлөө, Сүхбаатар дүүрэг');
  });

  it('maps an OpenStreetMap result into the existing address contract', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          display_name: '12, Энхтайвны өргөн чөлөө, Сүхбаатар дүүрэг, Улаанбаатар',
          address: {
            city: 'Улаанбаатар',
            city_district: 'Сүхбаатар дүүрэг',
            quarter: '1-р хороо',
            house_number: '12',
            road: 'Энхтайвны өргөн чөлөө',
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await reverseGeocode({ latitude: 47.918873, longitude: 106.917701 });

    expect(result).toMatchObject({
      cityOrProvince: 'Улаанбаатар',
      districtOrSoum: 'Сүхбаатар дүүрэг',
      khorooOrBag: '1-р хороо',
      addressLine: '12, Энхтайвны өргөн чөлөө',
    });
    const requestedUrl = new URL(String(fetchMock.mock.calls[0]?.[0]));
    expect(requestedUrl.pathname).toBe('/reverse');
    expect(requestedUrl.searchParams.get('accept-language')).toBe('mn,en');
    expect(requestedUrl.searchParams.get('addressdetails')).toBe('1');
  });

  it('fails explicitly when the geocoder does not return an address', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: 'Unable to geocode' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      )
    );

    await expect(reverseGeocode({ latitude: 47.918873, longitude: 106.917701 })).rejects.toThrow(
      'Unable to geocode'
    );
  });
});
