// Landen die we in de adres-selector aanbieden. Klein gehouden voor
// HLTY's EU-bezorggebied. Klanten met afwijkende landen kunnen mailen
// naar info@hlty.shop.

export interface Country {
  code: string; // ISO-3166 alpha-2 — wordt als territoryCode opgeslagen
  name: string; // weergavenaam (NL-locale)
}

export const COUNTRIES: Country[] = [
  { code: 'NL', name: 'Nederland' },
  { code: 'BE', name: 'België' },
  { code: 'DE', name: 'Duitsland' },
  { code: 'FR', name: 'Frankrijk' },
  { code: 'GB', name: 'Verenigd Koninkrijk' },
];

export function countryName(code: string | null | undefined): string {
  if (!code) return '';
  const c = COUNTRIES.find((x) => x.code === code);
  return c?.name ?? code;
}
