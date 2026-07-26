import { describe, expect, it } from 'vitest';
import {
  canonicalDistrict,
  canonicalKhoroo,
  districtKhoroos,
  ulaanbaatarDistricts,
} from './ulaanbaatarDivisions';

describe('Ulaanbaatar address divisions', () => {
  it('provides the current nine districts and 204 khoroos', () => {
    expect(ulaanbaatarDistricts).toHaveLength(9);
    expect(
      ulaanbaatarDistricts.reduce((total, district) => total + districtKhoroos(district).length, 0)
    ).toBe(204);
  });

  it('normalizes map and abbreviated values to dropdown options', () => {
    expect(canonicalDistrict('СБД')).toBe('Сүхбаатар дүүрэг');
    expect(canonicalDistrict('Хан Уул дүүрэг')).toBe('Хан-Уул дүүрэг');
    expect(canonicalKhoroo('Хан-Уул дүүрэг', '17 дугаар хороо')).toBe('17-р хороо');
    expect(canonicalKhoroo('Хан-Уул дүүрэг', '30-р хороо')).toBe('');
  });
});
