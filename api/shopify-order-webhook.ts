// Vercel serverless function — ontvangt Shopify `orders/paid` webhooks en
// stuurt server-side een Purchase-conversie naar Meta (Conversions API) en
// optioneel GA4 (Measurement Protocol).
//
// Waarom server-side: de Shopify-checkout draait op checkout.hlty.shop en de
// bezoeker komt na betaling niet terug op de React-storefront. Het betrouwbare
// conversiesignaal (order betaald + bedrag) bestaat alleen aan Shopify-kant.
// Door op de `orders/paid` webhook te reageren vuren we de conversie hier,
// volledig aan onze kant — géén tracking-pixel in de Shopify-checkout nodig.
//
// Beveiliging: elke webhook wordt geverifieerd met HMAC-SHA256 over de RAUWE
// request-body en het Shopify-signing-secret. Ongeldige signature → 401, er
// wordt niets verstuurd. (Daarom bodyParser uit: we hebben de exacte bytes
// nodig die Shopify ondertekende.)
//
// Env-vars (server-side — NIET met VITE_-prefix; dit zijn secrets):
//   SHOPIFY_WEBHOOK_SECRET   verplicht — signing-secret van de webhook
//   META_PIXEL_ID            Meta Pixel-id (zelfde nummer als VITE_META_PIXEL_ID)
//   META_CAPI_TOKEN          Conversions API access token (secret)
//   GA4_MEASUREMENT_ID       optioneel — "G-XXXXXXX"
//   GA4_API_SECRET           optioneel — Measurement Protocol API secret
//
// Optioneel (betere stitching): als de storefront bij begin_checkout de
// GA client-id / Meta _fbp meegeeft als order-note_attributes (_ga_client_id,
// _fbp, _fbc), pikt deze functie die op. Zonder die velden matcht Meta op
// e-mail en gebruikt GA4 een gegenereerde client-id.

import crypto from 'node:crypto';
import type { IncomingMessage } from 'node:http';

// Body-parsing uit: we lezen de rauwe bytes zelf voor de HMAC-check.
export const config = { api: { bodyParser: false } };

// Response-helper in de stijl van de andere api/-functies (Vercel verrijkt
// `res` met deze methodes, ook met bodyParser uit).
interface VercelResponse {
  status: (code: number) => VercelResponse;
  json: (body: unknown) => void;
  end: (body?: string) => void;
  setHeader: (name: string, value: string) => void;
}

interface ShopifyLineItem {
  product_id?: number;
  variant_id?: number;
  quantity?: number;
  price?: string;
  title?: string;
}

interface ShopifyOrder {
  id: number;
  order_number?: number;
  email?: string | null;
  contact_email?: string | null;
  total_price?: string;
  currency?: string;
  customer?: { first_name?: string | null; last_name?: string | null; phone?: string | null };
  billing_address?: {
    city?: string | null;
    zip?: string | null;
    country_code?: string | null;
    phone?: string | null;
  };
  line_items?: ShopifyLineItem[];
  note_attributes?: { name: string; value: string }[];
}

export default async function handler(req: IncomingMessage, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
  if (!secret) {
    res.status(500).json({ error: 'SHOPIFY_WEBHOOK_SECRET not configured on server' });
    return;
  }

  const raw = await readRawBody(req);

  // --- HMAC-verificatie over de rauwe body ---
  const header = req.headers['x-shopify-hmac-sha256'];
  const provided = Array.isArray(header) ? header[0] : header;
  if (!provided || !verifyHmac(raw, provided, secret)) {
    res.status(401).json({ error: 'Invalid HMAC signature' });
    return;
  }

  let order: ShopifyOrder;
  try {
    order = JSON.parse(raw.toString('utf8')) as ShopifyOrder;
  } catch {
    res.status(400).json({ error: 'Invalid JSON body' });
    return;
  }

  // Conversies best-effort + parallel. Zodra de signature klopt antwoorden we
  // 200, zodat Shopify de webhook niet onnodig blijft herhalen of uitschakelt.
  const results = await Promise.allSettled([sendMetaPurchase(order), sendGa4Purchase(order)]);
  results.forEach((r) => {
    if (r.status === 'rejected') {
      // eslint-disable-next-line no-console
      console.error('[order-webhook] conversie faalde:', r.reason);
    }
  });

  res.status(200).json({ received: true, order: order.order_number ?? order.id });
}

// ---------------------------------------------------------------------------
// Meta Conversions API — Purchase
// ---------------------------------------------------------------------------

async function sendMetaPurchase(order: ShopifyOrder): Promise<void> {
  const pixelId = process.env.META_PIXEL_ID;
  const token = process.env.META_CAPI_TOKEN;
  if (!pixelId || !token) return; // niet geconfigureerd → overslaan

  const email = (order.email || order.contact_email || '').trim().toLowerCase();
  const value = parseFloat(order.total_price || '0');
  const currency = order.currency || 'EUR';

  // user_data — gehasht (SHA-256) zoals Meta vereist, behalve fbp/fbc.
  const userData: Record<string, unknown> = {};
  if (email) userData.em = [sha256(email)];
  const phone = order.customer?.phone || order.billing_address?.phone;
  if (phone) userData.ph = [sha256(normalizePhone(phone))];
  if (order.customer?.first_name) userData.fn = [sha256(clean(order.customer.first_name))];
  if (order.customer?.last_name) userData.ln = [sha256(clean(order.customer.last_name))];
  if (order.billing_address?.city) userData.ct = [sha256(clean(order.billing_address.city).replace(/\s/g, ''))];
  if (order.billing_address?.zip) userData.zp = [sha256(clean(order.billing_address.zip).replace(/\s/g, ''))];
  if (order.billing_address?.country_code) userData.country = [sha256(clean(order.billing_address.country_code))];

  const fbp = noteAttr(order, '_fbp');
  const fbc = noteAttr(order, '_fbc');
  if (fbp) userData.fbp = fbp;
  if (fbc) userData.fbc = fbc;

  const contents = (order.line_items || []).map((li) => ({
    id: String(li.product_id ?? li.variant_id ?? ''),
    quantity: li.quantity ?? 1,
    item_price: li.price ? parseFloat(li.price) : undefined,
  }));

  const payload = {
    data: [
      {
        event_name: 'Purchase',
        event_time: Math.floor(Date.now() / 1000),
        event_id: `order_${order.id}`, // dedup-sleutel (matcht een eventuele browser-pixel)
        action_source: 'website',
        user_data: userData,
        custom_data: {
          currency,
          value,
          content_type: 'product',
          contents,
          num_items: contents.reduce((n, c) => n + (c.quantity || 0), 0),
          order_id: String(order.id),
        },
      },
    ],
  };

  const url = `https://graph.facebook.com/v21.0/${pixelId}/events?access_token=${encodeURIComponent(token)}`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Meta CAPI ${resp.status}: ${text.slice(0, 300)}`);
  }
}

// ---------------------------------------------------------------------------
// GA4 Measurement Protocol — purchase (optioneel)
// ---------------------------------------------------------------------------

async function sendGa4Purchase(order: ShopifyOrder): Promise<void> {
  const measurementId = process.env.GA4_MEASUREMENT_ID;
  const apiSecret = process.env.GA4_API_SECRET;
  if (!measurementId || !apiSecret) return; // niet geconfigureerd → overslaan

  // Liefst de echte client-id (meegegeven door de storefront), anders een
  // gegenereerde — dan telt de omzet wél mee, maar zonder sessiekoppeling.
  const clientId =
    noteAttr(order, '_ga_client_id') ||
    `${Math.floor(Math.random() * 1e10)}.${Math.floor(Date.now() / 1000)}`;
  const value = parseFloat(order.total_price || '0');
  const currency = order.currency || 'EUR';

  const items = (order.line_items || []).map((li) => ({
    item_id: String(li.variant_id ?? li.product_id ?? ''),
    item_name: li.title,
    quantity: li.quantity ?? 1,
    price: li.price ? parseFloat(li.price) : undefined,
  }));

  const payload = {
    client_id: clientId,
    events: [
      {
        name: 'purchase',
        params: { transaction_id: String(order.id), currency, value, items },
      },
    ],
  };

  const url = `https://www.google-analytics.com/mp/collect?measurement_id=${encodeURIComponent(
    measurementId,
  )}&api_secret=${encodeURIComponent(apiSecret)}`;
  const resp = await fetch(url, { method: 'POST', body: JSON.stringify(payload) });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`GA4 MP ${resp.status}: ${text.slice(0, 300)}`);
  }
}

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

async function readRawBody(req: IncomingMessage): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : (chunk as Buffer));
  }
  return Buffer.concat(chunks);
}

function verifyHmac(raw: Buffer, provided: string, secret: string): boolean {
  const digest = crypto.createHmac('sha256', secret).update(raw).digest('base64');
  const a = Buffer.from(digest);
  const b = Buffer.from(provided);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function sha256(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function clean(value: string): string {
  return value.trim().toLowerCase();
}

function normalizePhone(phone: string): string {
  return phone.replace(/[^0-9]/g, '');
}

function noteAttr(order: ShopifyOrder, name: string): string | undefined {
  return order.note_attributes?.find((a) => a.name === name)?.value;
}
