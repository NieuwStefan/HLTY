// Lichte client-side validators voor de profile-edit forms.
// Houden bewust simpel: server-side errors uit Shopify's userErrors
// blijven de bron van waarheid; deze checks zijn UX-vriendelijkheid.

export interface FieldError {
  field: string;
  message: string;
}

// E.164: + gevolgd door 8-15 cijfers.
export function validatePhone(value: string): string | null {
  const v = value.trim();
  if (v === '') return null;
  if (!/^\+\d{8,15}$/.test(v)) {
    return 'Gebruik internationale notatie, bv. +31612345678';
  }
  return null;
}

// NL: 1234 AB of 1234AB. BE: 4 cijfers. DE: 5 cijfers.
// FR: 5 cijfers. GB: complex maar we accepteren grofweg alfanumeriek 5-8.
export function validateZip(value: string, territoryCode: string): string | null {
  const v = value.trim();
  if (v === '') return 'Vul een postcode in';
  switch (territoryCode) {
    case 'NL':
      if (!/^\d{4}\s?[A-Za-z]{2}$/.test(v)) return 'Postcode moet 1234 AB zijn';
      return null;
    case 'BE':
      if (!/^\d{4}$/.test(v)) return 'Postcode moet 4 cijfers zijn';
      return null;
    case 'DE':
    case 'FR':
      if (!/^\d{5}$/.test(v)) return 'Postcode moet 5 cijfers zijn';
      return null;
    case 'GB':
      if (!/^[A-Za-z0-9\s]{5,8}$/.test(v)) return 'Ongeldige postcode';
      return null;
    default:
      return null;
  }
}

export function validateRequired(value: string, label: string): string | null {
  if (value.trim() === '') return `${label} is verplicht`;
  return null;
}

// Normaliseert NL-postcodes naar "1234 AB" (spatie tussen cijfers en letters).
export function normalizeZip(value: string, territoryCode: string): string {
  const v = value.trim().toUpperCase();
  if (territoryCode === 'NL') {
    const m = v.match(/^(\d{4})\s?([A-Z]{2})$/);
    if (m) return `${m[1]} ${m[2]}`;
  }
  return v;
}
