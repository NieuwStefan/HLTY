const GTIN_LENGTHS = new Set([8, 12, 13, 14]);
const GOOGLE_RESTRICTED_PREFIXES = ['02', '04', '2', '05', '98', '99'];

export type GtinProperty = 'gtin8' | 'gtin12' | 'gtin13' | 'gtin14';

/** Valideert een GTIN met de GS1 modulo-10-controle. */
export function isValidGtin(value: string): boolean {
  if (!/^\d+$/.test(value) || !GTIN_LENGTHS.has(value.length)) return false;

  const digits = value.split('').map(Number);
  const checkDigit = digits.pop();
  if (checkDigit === undefined) return false;

  let sum = 0;
  let weight = 3;
  for (let index = digits.length - 1; index >= 0; index -= 1) {
    sum += digits[index] * weight;
    weight = weight === 3 ? 1 : 3;
  }

  return (10 - (sum % 10)) % 10 === checkDigit;
}

/** Past naast GS1 ook de aanvullende Google Merchant-prefixregels toe. */
export function isGoogleMerchantGtin(value: string): boolean {
  if (!isValidGtin(value)) return false;

  // Bij GTIN-14 is het eerste cijfer het verpakkingsniveau. Google staat
  // niveaus 1–8 toe, maar niet het bulk-/kartonniveau 9. De GS1-prefix begint
  // voor deze vorm pas na die indicator.
  if (value.length === 14 && value.startsWith('9')) return false;
  const gs1Value = value.length === 14 ? value.slice(1) : value;
  return !GOOGLE_RESTRICTED_PREFIXES.some((prefix) => gs1Value.startsWith(prefix));
}

/** Geeft de meest specifieke schema.org-eigenschap voor een geldige GTIN. */
export function getGtinEntry(value: string | null | undefined): Partial<Record<GtinProperty, string>> {
  const normalized = value?.trim();
  if (!normalized || !isGoogleMerchantGtin(normalized)) return {};
  return { [`gtin${normalized.length}` as GtinProperty]: normalized };
}
