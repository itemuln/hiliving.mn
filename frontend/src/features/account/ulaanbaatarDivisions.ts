interface DistrictDefinition {
  readonly name: string;
  readonly aliases: readonly string[];
  readonly khoroos: readonly string[];
}

function numberedKhoroos(count: number) {
  return Array.from({ length: count }, (_, index) => `${index + 1}-р хороо`);
}

const definitions: readonly DistrictDefinition[] = [
  { name: 'Багануур дүүрэг', aliases: ['бнд', 'багануур'], khoroos: numberedKhoroos(5) },
  { name: 'Багахангай дүүрэг', aliases: ['бхд', 'багахангай'], khoroos: numberedKhoroos(2) },
  { name: 'Баянгол дүүрэг', aliases: ['бгд', 'баянгол'], khoroos: numberedKhoroos(34) },
  { name: 'Баянзүрх дүүрэг', aliases: ['бзд', 'баянзүрх'], khoroos: numberedKhoroos(43) },
  { name: 'Налайх дүүрэг', aliases: ['нд', 'налайх'], khoroos: numberedKhoroos(8) },
  {
    name: 'Сонгинохайрхан дүүрэг',
    aliases: ['схд', 'сонгинохайрхан'],
    khoroos: numberedKhoroos(43),
  },
  { name: 'Сүхбаатар дүүрэг', aliases: ['сбд', 'сүхбаатар'], khoroos: numberedKhoroos(20) },
  { name: 'Хан-Уул дүүрэг', aliases: ['худ', 'хан-уул', 'хан уул'], khoroos: numberedKhoroos(25) },
  { name: 'Чингэлтэй дүүрэг', aliases: ['чд', 'чингэлтэй'], khoroos: numberedKhoroos(24) },
] as const;

function normalized(value: string) {
  return value
    .trim()
    .toLocaleLowerCase('mn-MN')
    .replace(/\s+дүүрэг$/, '')
    .replace(/\s+/g, ' ');
}

export const ulaanbaatarDistricts = definitions.map(({ name }) => name);

export function districtKhoroos(district: string) {
  return definitions.find(({ name }) => name === district)?.khoroos ?? [];
}

export function canonicalDistrict(value: string) {
  const candidate = normalized(value);
  return (
    definitions.find(
      ({ name, aliases }) => normalized(name) === candidate || aliases.includes(candidate)
    )?.name ?? ''
  );
}

export function canonicalKhoroo(district: string, value: string) {
  const number = Number(value.match(/\d+/)?.[0]);
  if (!Number.isInteger(number) || number < 1) return '';
  return districtKhoroos(district)[number - 1] ?? '';
}
