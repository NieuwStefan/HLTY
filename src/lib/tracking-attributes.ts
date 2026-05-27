// Bouwt de tracking-stitching-attributen die we vlak vóór de Shopify-checkout
// op de cart zetten (zie CartDrawer + shopify.updateCartAttributes). Ze komen
// als order-`note_attributes` terug en worden server-side uitgelezen door de
// Purchase-webhook (api/shopify-order-webhook.ts), die ze naar Meta (CAPI) en
// GA4 (Measurement Protocol) stuurt.
//
// Doel: hogere Meta Event Match Quality (EMQ) en GA4-sessiekoppeling voor het
// purchase-event, dat buiten de SPA op de Shopify-checkout plaatsvindt.
//
// Consent-gating: marketing-identifiers (_fbp/_fbc/_external_id → Meta) alleen
// ná marketing-consent; de GA4 client-id alleen ná analytics-consent. Zonder
// de bijbehorende consent bestaan de cookies sowieso niet, maar we gaten ook
// expliciet zodat external_id (onze eigen id) niet zonder marketing-consent lekt.

import type { ConsentState } from './analytics';

const EXTERNAL_ID_KEY = 'hlty_ext_id';

function readCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const match = document.cookie.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[1]) : undefined;
}

// GA4's client-id is het deel ná de `GA1.<domeindiepte>.`-prefix van de
// `_ga`-cookie (bv. `GA1.1.1126776692.1779903276` → `1126776692.1779903276`).
// Dit is de waarde die GA4's Measurement Protocol als `client_id` verwacht.
export function getGaClientId(): string | undefined {
  const raw = readCookie('_ga');
  if (!raw) return undefined;
  const m = raw.match(/^GA\d\.\d\.(.+)$/);
  return m ? m[1] : undefined;
}

// Stabiele, persistente bezoeker-id voor Meta `external_id`. Voor ingelogde
// klanten geven we de Shopify customer-id mee (consistenter over apparaten);
// anders een willekeurige id die in localStorage blijft staan.
export function getOrCreateExternalId(): string | undefined {
  if (typeof localStorage === 'undefined') return undefined;
  try {
    let id = localStorage.getItem(EXTERNAL_ID_KEY);
    if (!id) {
      id =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(EXTERNAL_ID_KEY, id);
    }
    return id;
  } catch {
    return undefined;
  }
}

export interface CheckoutAttributeInput {
  consent: ConsentState | null;
  /** Shopify customer-id (GID) van een ingelogde klant, indien aanwezig */
  customerId?: string | null;
}

// Stelt de note_attribute-lijst samen. Lege/ontbrekende waarden worden
// weggelaten; zonder relevante consent komt er niets in die categorie.
export function buildCheckoutAttributes({
  consent,
  customerId,
}: CheckoutAttributeInput): { key: string; value: string }[] {
  const attrs: { key: string; value: string }[] = [];
  if (!consent) return attrs;

  if (consent.marketing) {
    const fbp = readCookie('_fbp');
    const fbc = readCookie('_fbc');
    if (fbp) attrs.push({ key: '_fbp', value: fbp });
    if (fbc) attrs.push({ key: '_fbc', value: fbc });
    const externalId = customerId || getOrCreateExternalId();
    if (externalId) attrs.push({ key: '_external_id', value: externalId });
  }

  if (consent.analytics) {
    const gaClientId = getGaClientId();
    if (gaClientId) attrs.push({ key: '_ga_client_id', value: gaClientId });
  }

  return attrs;
}
