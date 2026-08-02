import { createHash } from 'node:crypto';

import { isGoogleMerchantGtin } from '../src/lib/gtin';
import { formatProductTitle } from '../src/lib/product-title';
import {
  PILOT_CONTRACT,
  type PilotContract,
} from './_merchant-pilot-contract';

export const SHOPIFY_API_VERSION = '2026-07';
export const PILOT_BATCH_SIZE = 10;
export const PILOT_ITEM_COUNT = 40;

export const PILOT_SUPPLEMENT_HANDLES = [
  'orthica-cal-mag-zink-90-tabletten',
  'arctic-blue-pure-visolie-300-milliliter',
  'fittergy-k2-100mcg-en-d3-50mcg-60-tabletten',
  'mattisson-organic-vegan-protein-blend-vanilla-400-gram',
  'mattisson-vitamine-d3-k2-75mcg-36mcg-vegan-druppels-25-milliliter',
  'mattisson-whey-protein-isolate-isolaat-sport-500-gram',
  'orthica-magnesium-400-120-tabletten',
  'orthica-foliumzuur-400-90-vegetarische-capsules',
  'orthica-magnesium-citraat-125-90-capsules',
  'the-green-athlete-creatine-400-gram',
  'royal-green-zinc-complex-bio-60-vegetarische-capsules',
  'mattisson-calcium-magnesium-zink-90-tabletten',
  'arctic-blue-algenolie-dha-met-vitamine-d-90-softgels',
  'arctic-blue-pure-arctische-visolie-msc-60-softgels',
  'arctic-blue-pure-alaska-msc-visolie-60-softgels',
  'orthica-orthiflor-original-30-capsules',
  'mattisson-sport-wei-whey-proteine-concentraat-naturel-450-gram',
  'orthica-vitamine-d-10-120-tabletten',
  'vitals-vitamine-d3-1000ie-vegan-100-softgels',
  'mattisson-gefermenteerde-l-leucine-500mg-60-vegetarische-capsules',
] as const;

export const PILOT_AID_HANDLES = [
  'futuro-enkelbandage-aanpasbaar-1-stuks',
  'futuro-polsspalk-omkeerbaar-medium-1-stuks',
  'futuro-sport-tenniselleboog-bandage-aanpasbaar-1-stuks',
  'futuro-enkelbandage-maat-l-47876-1-stuks',
  'medisana-bloeddrukmeter-bovenarm-bu512-1-stuks',
  'aquashield-voet-1-stuks',
  'kt-tape-pro-uncut-tape-roll-5-meter-zwart-1-stuks',
  'epitact-enkelknobbel-beschermer-sport-2-stuks',
  'epitact-teenspreiders-small-6-stuks',
  'kt-tape-original-precut-5-meter-beige-20-stuks',
  'nexcare-cold-hot-therapy-pack-flexible-1-stuks',
  'nexcare-cold-hot-belt-rug-buik-s-m-1-stuks',
  'emdee-elastic-support-enkel-maat-m-huidskleur-1-stuks',
  'able-2-egelballen-8cm-1-stuks',
  '3m-cold-hot-pack-classic-1-stuks',
  'able-2-grijper-standaard-67cm-kort-1-stuks',
  'able-2-kruk-en-stokdoppen-19mm-zwart-2-stuks',
  'able-2-pillendoos-extra-groot-1-stuks',
  'aquashield-onderarm-klein-1-stuks',
  'able-2-harley-wigkussen-slimline-1-stuks',
] as const;

export const PILOT_HANDLES = [
  ...PILOT_SUPPLEMENT_HANDLES,
  ...PILOT_AID_HANDLES,
] as const;

const SITE_URL = 'https://www.hlty.shop';
const MAX_ATTEMPTS = 3;
const REQUEST_TIMEOUT_MS = 8_000;
const HANDLE_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

interface ShopifyImage {
  url: string;
  width: number | null;
  height: number | null;
}

interface ShopifyVariant {
  id: string;
  sku: string | null;
  barcode: string | null;
  availableForSale: boolean;
  currentlyNotInStock: boolean;
  price: {
    amount: string;
    currencyCode: string;
  };
  image: ShopifyImage | null;
}

interface ShopifyProduct {
  handle: string;
  title: string;
  description: string;
  vendor: string;
  productType: string;
  images: { nodes: ShopifyImage[] };
  variants: { nodes: ShopifyVariant[] };
}

interface GraphQlError {
  message?: string;
  extensions?: { code?: string };
}

interface GraphQlEnvelope {
  data?: Record<string, ShopifyProduct | null>;
  errors?: GraphQlError[];
}

export interface FeedConfig {
  domain: string;
  storefrontToken: string;
}

export interface FeedDependencies {
  fetchImpl?: typeof fetch;
  sleep?: (milliseconds: number) => Promise<void>;
  timeoutMs?: number;
  pilotContract?: PilotContract;
}

export interface MerchantFeedItem {
  handle: string;
  id: string;
  title: string;
  description: string;
  link: string;
  imageLink: string;
  additionalImageLinks: string[];
  availability: 'in_stock' | 'out_of_stock';
  price: string;
  brand: string;
  gtin: string;
  productType: string;
  sku: string;
  sourceContentHash: string;
}

export interface MerchantFeedPayload {
  xml: string;
  etag: string;
  items: MerchantFeedItem[];
}

export class MerchantFeedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MerchantFeedError';
  }
}

class RetryableShopifyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RetryableShopifyError';
  }
}

/** Leest servervariabelen met tijdelijke compatibiliteit voor de bestaande VITE-namen. */
export function readFeedConfig(env: NodeJS.ProcessEnv = process.env): FeedConfig {
  const domain = (env.SHOPIFY_DOMAIN ?? env.VITE_SHOPIFY_DOMAIN)?.trim();
  const storefrontToken = (
    env.SHOPIFY_STOREFRONT_TOKEN ?? env.VITE_STOREFRONT_TOKEN
  )?.trim();

  if (!domain || !/^[a-z0-9][a-z0-9.-]+$/i.test(domain)) {
    throw new MerchantFeedError('Shopify-domein ontbreekt of is ongeldig.');
  }
  if (!storefrontToken) {
    throw new MerchantFeedError('Shopify Storefront-token ontbreekt.');
  }

  return { domain, storefrontToken };
}

/** Controleert dat de pilot exact, uniek en deterministisch is. */
export function assertPilotAllowlist(handles: readonly string[] = PILOT_HANDLES): void {
  if (handles.length !== PILOT_ITEM_COUNT) {
    throw new MerchantFeedError(`Pilot moet exact ${PILOT_ITEM_COUNT} handles bevatten.`);
  }
  if (new Set(handles).size !== handles.length) {
    throw new MerchantFeedError('Pilot bevat dubbele handles.');
  }
  if (handles.some((handle) => !HANDLE_PATTERN.test(handle))) {
    throw new MerchantFeedError('Pilot bevat een ongeldige handle.');
  }
}

function buildBatchQuery(batchSize: number): string {
  const variables = Array.from(
    { length: batchSize },
    (_, index) => `$handle${index}: String!`,
  ).join(', ');
  const lookups = Array.from(
    { length: batchSize },
    (_, index) => `p${index}: product(handle: $handle${index}) { ...FeedProduct }`,
  ).join('\n');

  return `query MerchantPilotBatch(${variables}) {
${lookups}
}
fragment FeedProduct on Product {
  handle
  title
  description
  vendor
  productType
  images(first: 11) { nodes { url width height } }
  variants(first: 2) {
    nodes {
      id
      sku
      barcode
      availableForSale
      currentlyNotInStock
      price { amount currencyCode }
      image { url width height }
    }
  }
}`;
}

function retryDelay(attempt: number): number {
  return attempt === 0 ? 250 : 1_000;
}

function isRetryableGraphQlError(error: GraphQlError): boolean {
  const code = error.extensions?.code;
  return code === 'THROTTLED' || code === 'INTERNAL_SERVER_ERROR' || code === 'INTERNAL_ERROR';
}

async function requestBatchOnce(
  handles: readonly string[],
  config: FeedConfig,
  fetchImpl: typeof fetch,
  timeoutMs: number,
): Promise<ShopifyProduct[]> {
  const variables = Object.fromEntries(
    handles.map((handle, index) => [`handle${index}`, handle]),
  );
  let response: Response;

  try {
    response = await fetchImpl(
      `https://${config.domain}/api/${SHOPIFY_API_VERSION}/graphql.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Storefront-Access-Token': config.storefrontToken,
        },
        body: JSON.stringify({
          query: buildBatchQuery(handles.length),
          variables,
        }),
        signal: AbortSignal.timeout(timeoutMs),
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'onbekende netwerkfout';
    throw new RetryableShopifyError(`Shopify-netwerkfout: ${message}`);
  }

  if (response.status === 429 || response.status >= 500) {
    throw new RetryableShopifyError(`Shopify gaf HTTP ${response.status}.`);
  }
  if (!response.ok) {
    throw new MerchantFeedError(`Shopify gaf niet-herstelbare HTTP ${response.status}.`);
  }

  const servedVersion = response.headers.get('x-shopify-api-version');
  if (servedVersion !== SHOPIFY_API_VERSION) {
    throw new MerchantFeedError(
      `Shopify API-versie wijkt af: ${servedVersion ?? 'ontbreekt'}.`,
    );
  }

  let envelope: GraphQlEnvelope;
  try {
    envelope = (await response.json()) as GraphQlEnvelope;
  } catch {
    throw new MerchantFeedError('Shopify gaf ongeldige JSON.');
  }

  if (envelope.errors?.length) {
    if (envelope.errors.every(isRetryableGraphQlError)) {
      throw new RetryableShopifyError('Shopify gaf een tijdelijke GraphQL-fout.');
    }
    throw new MerchantFeedError('Shopify gaf een niet-herstelbare GraphQL-fout.');
  }
  if (!envelope.data) {
    throw new MerchantFeedError('Shopify-response bevat geen data.');
  }

  return handles.map((expectedHandle, index) => {
    const product = envelope.data?.[`p${index}`];
    if (!product) {
      throw new MerchantFeedError(`Pilotproduct ontbreekt: ${expectedHandle}.`);
    }
    if (product.handle !== expectedHandle) {
      throw new MerchantFeedError(`Shopify gaf een onverwachte handle voor ${expectedHandle}.`);
    }
    return product;
  });
}

async function requestBatch(
  handles: readonly string[],
  config: FeedConfig,
  dependencies: FeedDependencies,
): Promise<ShopifyProduct[]> {
  const fetchImpl = dependencies.fetchImpl ?? fetch;
  const sleep = dependencies.sleep ?? ((milliseconds) => new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  }));
  const timeoutMs = dependencies.timeoutMs ?? REQUEST_TIMEOUT_MS;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    try {
      return await requestBatchOnce(handles, config, fetchImpl, timeoutMs);
    } catch (error) {
      if (!(error instanceof RetryableShopifyError) || attempt === MAX_ATTEMPTS - 1) {
        throw error;
      }
      await sleep(retryDelay(attempt));
    }
  }

  throw new MerchantFeedError('Shopify-retries onverwacht uitgeput.');
}

/** Verwijdert tekens die niet in een XML 1.0-document mogen voorkomen. */
export function sanitizeXmlText(value: string): string {
  return Array.from(value).filter((character) => {
    const codePoint = character.codePointAt(0);
    return codePoint === 0x9
      || codePoint === 0xA
      || codePoint === 0xD
      || (codePoint !== undefined && codePoint >= 0x20 && codePoint <= 0xD7FF)
      || (codePoint !== undefined && codePoint >= 0xE000 && codePoint <= 0xFFFD)
      || (codePoint !== undefined && codePoint >= 0x10000 && codePoint <= 0x10FFFF);
  }).join('');
}

function normalizeText(value: string): string {
  return sanitizeXmlText(value).replace(/\s+/g, ' ').trim();
}

function truncateUnicode(value: string, maxLength: number): string {
  return Array.from(value).slice(0, maxLength).join('');
}

function validFeedImage(image: ShopifyImage | null | undefined): image is ShopifyImage {
  if (
    !image?.url
    || image.url.length > 2_000
    || typeof image.width !== 'number'
    || image.width < 500
    || typeof image.height !== 'number'
    || image.height < 500
    || image.width * image.height > 64_000_000
  ) {
    return false;
  }

  try {
    const parsed = new URL(image.url);
    return parsed.protocol === 'https:'
      && !parsed.username
      && !parsed.password
      && parsed.href === image.url;
  } catch {
    return false;
  }
}

function variantNumericId(gid: string): string {
  const match = /^gid:\/\/shopify\/ProductVariant\/(\d+)$/.exec(gid);
  if (!match) throw new MerchantFeedError(`Ongeldige variant-ID: ${gid}.`);
  return match[1];
}

function normalizePrice(amount: string, currencyCode: string): string {
  if (currencyCode !== 'EUR' || !/^\d+(?:\.\d{1,2})?$/.test(amount)) {
    throw new MerchantFeedError(`Ongeldige prijs of valuta: ${amount} ${currencyCode}.`);
  }
  const numeric = Number(amount);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    throw new MerchantFeedError(`Prijs moet positief zijn: ${amount}.`);
  }
  return `${numeric.toFixed(2)} EUR`;
}

function mapProduct(product: ShopifyProduct): MerchantFeedItem {
  if (product.variants.nodes.length !== 1) {
    throw new MerchantFeedError(
      `Pilotproduct ${product.handle} moet exact één variant hebben.`,
    );
  }

  const variant = product.variants.nodes[0];
  if (variant.currentlyNotInStock) {
    throw new MerchantFeedError(
      `Backorder zonder bevestigde beschikbaarheidsdatum voor ${product.handle}.`,
    );
  }
  const numericId = variantNumericId(variant.id);
  const sku = variant.sku?.trim();
  const gtin = variant.barcode?.trim();
  if (!sku) throw new MerchantFeedError(`SKU ontbreekt voor ${product.handle}.`);
  if (!gtin || !isGoogleMerchantGtin(gtin)) {
    throw new MerchantFeedError(`Google Merchant-geschikte GTIN ontbreekt voor ${product.handle}.`);
  }

  const sourceTitle = normalizeText(formatProductTitle(product.title, product.vendor));
  const title = truncateUnicode(sourceTitle, 150);
  const sourceDescription = normalizeText(product.description);
  const brand = normalizeText(product.vendor);
  const productType = normalizeText(product.productType);
  if (!title || !sourceDescription || !brand || !productType) {
    throw new MerchantFeedError(`Verplicht tekstveld ontbreekt voor ${product.handle}.`);
  }
  // Leveranciersbeschrijvingen bevatten geregeld promotionele of nog te
  // beoordelen claims. De pilot stuurt daarom alleen deze feitelijke velden
  // naar Merchant Center; de volledige broncopy blijft via de hash bewaakt.
  const description = `Productinformatie voor ${title}. Merk: ${brand}. Producttype: ${productType}.`;

  const intendedPrimaryImage = variant.image ?? product.images.nodes[0];
  if (!validFeedImage(intendedPrimaryImage)) {
    throw new MerchantFeedError(
      `Primaire afbeelding voldoet niet aan het Google-contract voor ${product.handle}.`,
    );
  }
  const images = [intendedPrimaryImage, variant.image, ...product.images.nodes]
    .filter(validFeedImage)
    .filter((image, index, all) => all.findIndex((entry) => entry.url === image.url) === index);
  const primaryImage = images[0];

  return {
    handle: product.handle,
    id: `shopify-v-${numericId}`,
    title,
    description,
    link: `${SITE_URL}/product/${product.handle}`,
    imageLink: primaryImage.url,
    additionalImageLinks: images.slice(1, 11).map((image) => image.url),
    availability: variant.availableForSale ? 'in_stock' : 'out_of_stock',
    price: normalizePrice(variant.price.amount, variant.price.currencyCode),
    brand,
    gtin,
    productType,
    sku,
    sourceContentHash: merchantContentHash({
      title: sourceTitle,
      description: sourceDescription,
      brand,
      productType,
    }),
  };
}

function assertUniqueItems(items: MerchantFeedItem[]): void {
  const unique = (values: string[], label: string) => {
    if (new Set(values).size !== values.length) {
      throw new MerchantFeedError(`Pilot bevat een dubbele ${label}.`);
    }
  };
  unique(items.map((item) => item.id), 'variant-ID');
  unique(items.map((item) => item.gtin), 'GTIN');
  unique(items.map((item) => item.sku), 'SKU');
}

/** Hash van alle commerciële Shopify-brontekst die op de landingspagina staat. */
export function merchantContentHash(
  item: Pick<MerchantFeedItem, 'title' | 'description' | 'brand' | 'productType'>,
): string {
  return createHash('sha256')
    .update(JSON.stringify([item.title, item.description, item.brand, item.productType]))
    .digest('base64url');
}

function assertPilotContract(
  items: MerchantFeedItem[],
  contract: PilotContract,
): void {
  const contractHandles = Object.keys(contract);
  if (
    contractHandles.length !== PILOT_HANDLES.length
    || contractHandles.some((handle) => !PILOT_HANDLES.includes(handle as (typeof PILOT_HANDLES)[number]))
  ) {
    throw new MerchantFeedError('Pilotcontract komt niet exact overeen met de allowlist.');
  }

  for (const item of items) {
    const expected = contract[item.handle];
    if (!expected) {
      throw new MerchantFeedError(`Pilotcontract ontbreekt voor ${item.handle}.`);
    }
    if (
      item.id !== `shopify-v-${expected.variantId}`
      || item.sku !== expected.sku
      || item.gtin !== expected.gtin
    ) {
      throw new MerchantFeedError(`Identifierdrift gedetecteerd voor ${item.handle}.`);
    }
    if (item.sourceContentHash !== expected.contentHash) {
      throw new MerchantFeedError(`Niet-beoordeelde tekstwijziging voor ${item.handle}.`);
    }
  }
}

/** Escapet tekst voor elementinhoud in de XML-feed. */
export function escapeXml(value: string): string {
  return sanitizeXmlText(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function renderItem(item: MerchantFeedItem): string {
  const additionalImages = item.additionalImageLinks.map(
    (url) => `      <g:additional_image_link>${escapeXml(url)}</g:additional_image_link>`,
  );
  return [
    '    <item>',
    `      <g:id>${escapeXml(item.id)}</g:id>`,
    `      <g:title>${escapeXml(item.title)}</g:title>`,
    `      <g:description>${escapeXml(item.description)}</g:description>`,
    `      <g:link>${escapeXml(item.link)}</g:link>`,
    `      <g:image_link>${escapeXml(item.imageLink)}</g:image_link>`,
    ...additionalImages,
    `      <g:availability>${item.availability}</g:availability>`,
    `      <g:price>${item.price}</g:price>`,
    `      <g:brand>${escapeXml(item.brand)}</g:brand>`,
    `      <g:gtin>${item.gtin}</g:gtin>`,
    '      <g:condition>new</g:condition>',
    `      <g:product_type>${escapeXml(item.productType)}</g:product_type>`,
    '      <g:custom_label_0>pilot</g:custom_label_0>',
    '    </item>',
  ].join('\n');
}

/** Rendert een deterministische Google Merchant RSS-feed. */
export function renderMerchantFeed(items: MerchantFeedItem[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>HLTY Merchant-pilot</title>
    <link>${SITE_URL}</link>
    <description>Gevalideerde pilotcatalogus van HLTY</description>
${items.map(renderItem).join('\n')}
  </channel>
</rss>
`;
}

/** Haalt alle vier batches op en geeft alleen bij volledige validatie XML terug. */
export async function createMerchantFeed(
  config: FeedConfig,
  dependencies: FeedDependencies = {},
): Promise<MerchantFeedPayload> {
  assertPilotAllowlist();
  const products: ShopifyProduct[] = [];

  for (let index = 0; index < PILOT_HANDLES.length; index += PILOT_BATCH_SIZE) {
    const handles = PILOT_HANDLES.slice(index, index + PILOT_BATCH_SIZE);
    products.push(...await requestBatch(handles, config, dependencies));
  }

  const items = products.map(mapProduct);
  if (items.length !== PILOT_ITEM_COUNT) {
    throw new MerchantFeedError(`Pilotfeed bevat niet exact ${PILOT_ITEM_COUNT} items.`);
  }
  assertUniqueItems(items);
  assertPilotContract(items, dependencies.pilotContract ?? PILOT_CONTRACT);

  const xml = renderMerchantFeed(items);
  const hash = createHash('sha256').update(xml).digest('base64url');
  return { xml, etag: `"${hash}"`, items };
}
