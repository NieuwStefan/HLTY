const SHOPIFY_DOMAIN = import.meta.env.VITE_SHOPIFY_DOMAIN;
const STOREFRONT_TOKEN = import.meta.env.VITE_STOREFRONT_TOKEN;
const API_VERSION = import.meta.env.VITE_API_VERSION || '2024-01';

// ---------- Types ----------

export interface ShopifyImage {
  url: string;
  altText: string | null;
}

export interface Money {
  amount: string;
  currencyCode: string;
}

export interface ProductVariant {
  id: string;
  title: string;
  price: Money;
  availableForSale: boolean;
  image: ShopifyImage | null;
  selectedOptions: { name: string; value: string }[];
}

export interface Product {
  id: string;
  title: string;
  handle: string;
  description: string;
  descriptionHtml: string;
  productType: string;
  vendor: string;
  tags: string[];
  images: ShopifyImage[];
  variants: ProductVariant[];
  priceRange: {
    minVariantPrice: Money;
    maxVariantPrice: Money;
  };
}

export interface Collection {
  id: string;
  handle: string;
  title: string;
  description: string;
  image: ShopifyImage | null;
}

export interface CartLine {
  id: string;
  quantity: number;
  merchandise: ProductVariant & {
    product: { title: string; handle: string };
  };
  cost: { totalAmount: Money };
}

export interface Cart {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  lines: CartLine[];
  cost: {
    totalAmount: Money;
    subtotalAmount: Money;
  };
}

export interface MenuItem {
  id: string;
  title: string;
  url: string;
  type: string;
  items: MenuItem[];
}

export interface Menu {
  id: string;
  handle: string;
  title: string;
  items: MenuItem[];
}

// ---------- Helpers ----------

/**
 * Sort products by brand relevance: brands with more products in the
 * current context (collection / search result) appear first.
 * Within the same brand the original order (e.g. best-selling) is preserved.
 */
export function sortByBrandRelevance(products: Product[]): Product[] {
  const brandCount = new Map<string, number>();
  for (const p of products) {
    if (p.vendor) brandCount.set(p.vendor, (brandCount.get(p.vendor) ?? 0) + 1);
  }
  return [...products].sort((a, b) => (brandCount.get(b.vendor) ?? 0) - (brandCount.get(a.vendor) ?? 0));
}

// ---------- GraphQL Client ----------

async function shopifyFetch<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const res = await fetch(
    `https://${SHOPIFY_DOMAIN}/api/${API_VERSION}/graphql.json`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': STOREFRONT_TOKEN,
      },
      body: JSON.stringify({ query, variables }),
    }
  );

  const json = await res.json();
  if (json.errors) {
    console.error('Shopify API error:', json.errors);
    throw new Error(json.errors[0].message);
  }
  return json.data;
}

// ---------- Helpers ----------

function reshapeImages(images: { edges: { node: ShopifyImage }[] }): ShopifyImage[] {
  return images.edges.map((e) => e.node);
}

function reshapeVariants(variants: { edges: { node: ProductVariant }[] }): ProductVariant[] {
  return variants.edges.map((e) => e.node);
}

function reshapeProduct(node: any): Product {
  return {
    ...node,
    images: reshapeImages(node.images),
    variants: reshapeVariants(node.variants),
  };
}

function reshapeCartLines(lines: { edges: { node: any }[] }): CartLine[] {
  return lines.edges.map((e) => e.node);
}

// ---------- Fragments ----------

const PRODUCT_FRAGMENT = `
  fragment ProductFields on Product {
    id
    title
    handle
    description
    descriptionHtml
    productType
    vendor
    tags
    images(first: 10) {
      edges { node { url altText } }
    }
    variants(first: 30) {
      edges {
        node {
          id
          title
          price { amount currencyCode }
          availableForSale
          image { url altText }
          selectedOptions { name value }
        }
      }
    }
    priceRange {
      minVariantPrice { amount currencyCode }
      maxVariantPrice { amount currencyCode }
    }
  }
`;

const PRODUCT_CARD_FRAGMENT = `
  fragment ProductCardFields on Product {
    id
    title
    handle
    productType
    vendor
    tags
    images(first: 1) {
      edges { node { url altText } }
    }
    variants(first: 1) {
      edges {
        node {
          id
          title
          price { amount currencyCode }
          availableForSale
          image { url altText }
          selectedOptions { name value }
        }
      }
    }
    priceRange {
      minVariantPrice { amount currencyCode }
      maxVariantPrice { amount currencyCode }
    }
  }
`;

const CART_FRAGMENT = `
  fragment CartFields on Cart {
    id
    checkoutUrl
    totalQuantity
    lines(first: 100) {
      edges {
        node {
          id
          quantity
          merchandise {
            ... on ProductVariant {
              id
              title
              price { amount currencyCode }
              availableForSale
              image { url altText }
              selectedOptions { name value }
              product { title handle }
            }
          }
          cost { totalAmount { amount currencyCode } }
        }
      }
    }
    cost {
      totalAmount { amount currencyCode }
      subtotalAmount { amount currencyCode }
    }
  }
`;

// ---------- Product Queries ----------

import { get as cacheGet, set as cacheSet, TTL } from './cache';

export interface ProductListResult {
  products: Product[];
  pageInfo: { hasNextPage: boolean; endCursor: string };
}

export async function getProducts(first = 24, after?: string): Promise<ProductListResult> {
  const key = `products:${first}:${after ?? ''}`;
  const cached = cacheGet<ProductListResult>(key);
  if (cached) return cached;

  const data = await shopifyFetch<any>(
    `${PRODUCT_CARD_FRAGMENT}
    query Products($first: Int!, $after: String) {
      products(first: $first, after: $after, sortKey: BEST_SELLING) {
        pageInfo { hasNextPage endCursor }
        edges { node { ...ProductCardFields } }
      }
    }`,
    { first, after }
  );

  const result = {
    products: data.products.edges.map((e: any) => reshapeProduct(e.node)),
    pageInfo: data.products.pageInfo,
  };
  cacheSet(key, result, TTL.PRODUCTS);
  return result;
}

export async function getProduct(handle: string): Promise<Product> {
  const key = `product:${handle}`;
  const cached = cacheGet<Product>(key);
  if (cached) return cached;

  const data = await shopifyFetch<any>(
    `${PRODUCT_FRAGMENT}
    query Product($handle: String!) {
      product(handle: $handle) { ...ProductFields }
    }`,
    { handle }
  );

  if (!data.product) throw new Error('Product not found');
  const result = reshapeProduct(data.product);
  cacheSet(key, result, TTL.PRODUCTS);
  return result;
}

// ---------- AI Catalog Query ----------

const CATALOG_FRAGMENT = `
  fragment CatalogFields on Product {
    id
    title
    handle
    description
    productType
    vendor
    tags
    images(first: 1) {
      edges { node { url altText } }
    }
    variants(first: 1) {
      edges {
        node {
          id
          price { amount currencyCode }
          availableForSale
        }
      }
    }
    priceRange {
      minVariantPrice { amount currencyCode }
    }
  }
`;

export async function getCatalogProducts(first = 150) {
  const key = `catalog:${first}`;
  const cached = cacheGet<{ products: Product[] }>(key);
  if (cached) return cached;

  const data = await shopifyFetch<any>(
    `${CATALOG_FRAGMENT}
    query Catalog($first: Int!) {
      products(first: $first, sortKey: BEST_SELLING) {
        edges { node { ...CatalogFields } }
      }
    }`,
    { first }
  );

  const result = {
    products: data.products.edges.map((e: any) => reshapeProduct(e.node)),
  };
  cacheSet(key, result, TTL.PRODUCTS);
  return result;
}

export async function searchProducts(query: string, first = 24, sortKey: 'RELEVANCE' | 'BEST_SELLING' = 'RELEVANCE'): Promise<ProductListResult> {
  const key = `search:${query}:${first}:${sortKey}`;
  const cached = cacheGet<ProductListResult>(key);
  if (cached) return cached;

  const data = await shopifyFetch<any>(
    `${PRODUCT_CARD_FRAGMENT}
    query Search($query: String!, $first: Int!, $sortKey: ProductSortKeys!) {
      products(first: $first, query: $query, sortKey: $sortKey) {
        pageInfo { hasNextPage endCursor }
        edges { node { ...ProductCardFields } }
      }
    }`,
    { query, first, sortKey }
  );

  const result = {
    products: data.products.edges.map((e: any) => reshapeProduct(e.node)),
    pageInfo: data.products.pageInfo,
  };
  cacheSet(key, result, TTL.PRODUCTS);
  return result;
}

export async function getProductRecommendations(productId: string): Promise<Product[]> {
  const key = `recommendations:${productId}`;
  const cached = cacheGet<Product[]>(key);
  if (cached) return cached;

  const data = await shopifyFetch<any>(
    `${PRODUCT_CARD_FRAGMENT}
    query Recommendations($productId: ID!) {
      productRecommendations(productId: $productId) {
        ...ProductCardFields
      }
    }`,
    { productId }
  );

  const result = (data.productRecommendations || []).map(reshapeProduct);
  cacheSet(key, result, TTL.PRODUCTS);
  return result;
}

// ---------- Collection Queries ----------

export async function getCollections(first = 50): Promise<Collection[]> {
  const key = `collections:${first}`;
  const cached = cacheGet<Collection[]>(key);
  if (cached) return cached;

  const data = await shopifyFetch<any>(
    `query Collections($first: Int!) {
      collections(first: $first) {
        edges {
          node {
            id
            handle
            title
            description
            image { url altText }
          }
        }
      }
    }`,
    { first }
  );

  const result = data.collections.edges.map((e: any) => e.node) as Collection[];
  cacheSet(key, result, TTL.PRODUCTS);
  return result;
}

export interface CollectionProductsResult {
  collection: Collection;
  products: Product[];
  pageInfo: { hasNextPage: boolean; endCursor: string };
}

export async function getCollectionProducts(handle: string, first = 24, after?: string): Promise<CollectionProductsResult> {
  const key = `collection:${handle}:${first}:${after ?? ''}`;
  const cached = cacheGet<CollectionProductsResult>(key);
  if (cached) return cached;

  const data = await shopifyFetch<any>(
    `${PRODUCT_CARD_FRAGMENT}
    query CollectionProducts($handle: String!, $first: Int!, $after: String) {
      collection(handle: $handle) {
        id
        title
        handle
        description
        image { url altText }
        products(first: $first, after: $after, sortKey: BEST_SELLING) {
          pageInfo { hasNextPage endCursor }
          edges { node { ...ProductCardFields } }
        }
      }
    }`,
    { handle, first, after }
  );

  if (!data.collection) throw new Error('Collection not found');
  const result = {
    collection: data.collection as Collection,
    products: data.collection.products.edges.map((e: any) => reshapeProduct(e.node)),
    pageInfo: data.collection.products.pageInfo,
  };
  cacheSet(key, result, TTL.PRODUCTS);
  return result;
}

export interface AllCollectionProductsResult {
  collection: Collection;
  products: Product[];
}

/**
 * Fetch a collection plus *every* product inside it. Paginates internally
 * with Shopify's max page size (250) until hasNextPage is false.
 * Designed for collections up to a few hundred products.
 */
export async function getAllCollectionProducts(handle: string): Promise<AllCollectionProductsResult> {
  const key = `collection-all:${handle}`;
  const cached = cacheGet<AllCollectionProductsResult>(key);
  if (cached) return cached;

  const PAGE_SIZE = 250;
  let collection: Collection | null = null;
  const products: Product[] = [];
  let cursor: string | null = null;

  for (let page = 0; page < 20; page++) {
    const data: any = await shopifyFetch<any>(
      `${PRODUCT_CARD_FRAGMENT}
      query AllCollectionProducts($handle: String!, $first: Int!, $after: String) {
        collection(handle: $handle) {
          id
          title
          handle
          description
          image { url altText }
          products(first: $first, after: $after, sortKey: BEST_SELLING) {
            pageInfo { hasNextPage endCursor }
            edges { node { ...ProductCardFields } }
          }
        }
      }`,
      { handle, first: PAGE_SIZE, after: cursor }
    );

    if (!data.collection) throw new Error('Collection not found');
    if (!collection) collection = data.collection as Collection;
    for (const edge of data.collection.products.edges) {
      products.push(reshapeProduct(edge.node));
    }
    if (!data.collection.products.pageInfo.hasNextPage) break;
    cursor = data.collection.products.pageInfo.endCursor;
  }

  const result = { collection: collection!, products };
  cacheSet(key, result, TTL.PRODUCTS);
  return result;
}

// ---------- Homepage Batched Query ----------

export async function getHomepageData(productCount = 8) {
  const key = `homepage:${productCount}`;
  const cached = cacheGet<{ products: Product[]; collections: Collection[] }>(key);
  if (cached) return cached;

  const data = await shopifyFetch<any>(
    `${PRODUCT_CARD_FRAGMENT}
    query Homepage($first: Int!) {
      products(first: $first, sortKey: BEST_SELLING) {
        edges { node { ...ProductCardFields } }
      }
      collections(first: 50) {
        edges {
          node {
            id
            handle
            title
            description
            image { url altText }
          }
        }
      }
    }`,
    { first: productCount }
  );

  const result = {
    products: data.products.edges.map((e: any) => reshapeProduct(e.node)) as Product[],
    collections: data.collections.edges.map((e: any) => e.node) as Collection[],
  };
  cacheSet(key, result, TTL.PRODUCTS);
  return result;
}

/**
 * Lichte query voor de homepage die NIET op BEST_SELLING sorteert
 * (deze sortKey geeft een Shopify INTERNAL_SERVER_ERROR voor winkels
 * met onvoldoende sales-data). Sorteert op nieuwste producten.
 */
export async function getFeaturedProducts(count = 4): Promise<Product[]> {
  const key = `featured:${count}`;
  const cached = cacheGet<Product[]>(key);
  if (cached) return cached;

  const data = await shopifyFetch<any>(
    `${PRODUCT_CARD_FRAGMENT}
    query FeaturedProducts($first: Int!) {
      products(first: $first, sortKey: CREATED_AT, reverse: true) {
        edges { node { ...ProductCardFields } }
      }
    }`,
    { first: count }
  );

  const result = data.products.edges.map((e: any) => reshapeProduct(e.node)) as Product[];
  cacheSet(key, result, TTL.PRODUCTS);
  return result;
}

// ---------- Cart Mutations ----------

export async function createCart(variantId?: string, quantity = 1): Promise<Cart> {
  const lines = variantId ? [{ merchandiseId: variantId, quantity }] : [];

  const data = await shopifyFetch<any>(
    `${CART_FRAGMENT}
    mutation CartCreate($input: CartInput!) {
      cartCreate(input: $input) {
        cart { ...CartFields }
      }
    }`,
    { input: { lines, buyerIdentity: { countryCode: 'NL' } } }
  );

  const cart = data.cartCreate.cart;
  return { ...cart, lines: reshapeCartLines(cart.lines) };
}

export async function updateCartBuyerIdentity(cartId: string): Promise<Cart> {
  const data = await shopifyFetch<any>(
    `${CART_FRAGMENT}
    mutation CartBuyerIdentity($cartId: ID!, $buyerIdentity: CartBuyerIdentityInput!) {
      cartBuyerIdentityUpdate(cartId: $cartId, buyerIdentity: $buyerIdentity) {
        cart { ...CartFields }
      }
    }`,
    { cartId, buyerIdentity: { countryCode: 'NL' } }
  );

  const cart = data.cartBuyerIdentityUpdate.cart;
  return { ...cart, lines: reshapeCartLines(cart.lines) };
}

export async function addToCart(cartId: string, variantId: string, quantity = 1): Promise<Cart> {
  const data = await shopifyFetch<any>(
    `${CART_FRAGMENT}
    mutation CartAdd($cartId: ID!, $lines: [CartLineInput!]!) {
      cartLinesAdd(cartId: $cartId, lines: $lines) {
        cart { ...CartFields }
      }
    }`,
    { cartId, lines: [{ merchandiseId: variantId, quantity }] }
  );

  const cart = data.cartLinesAdd.cart;
  return { ...cart, lines: reshapeCartLines(cart.lines) };
}

export async function updateCartLine(cartId: string, lineId: string, quantity: number): Promise<Cart> {
  const data = await shopifyFetch<any>(
    `${CART_FRAGMENT}
    mutation CartUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
      cartLinesUpdate(cartId: $cartId, lines: $lines) {
        cart { ...CartFields }
      }
    }`,
    { cartId, lines: [{ id: lineId, quantity }] }
  );

  const cart = data.cartLinesUpdate.cart;
  return { ...cart, lines: reshapeCartLines(cart.lines) };
}

export async function removeCartLine(cartId: string, lineId: string): Promise<Cart> {
  const data = await shopifyFetch<any>(
    `${CART_FRAGMENT}
    mutation CartRemove($cartId: ID!, $lineIds: [ID!]!) {
      cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
        cart { ...CartFields }
      }
    }`,
    { cartId, lineIds: [lineId] }
  );

  const cart = data.cartLinesRemove.cart;
  return { ...cart, lines: reshapeCartLines(cart.lines) };
}

export async function getCart(cartId: string): Promise<Cart | null> {
  const data = await shopifyFetch<any>(
    `${CART_FRAGMENT}
    query Cart($cartId: ID!) {
      cart(id: $cartId) { ...CartFields }
    }`,
    { cartId }
  );

  if (!data.cart) return null;
  return { ...data.cart, lines: reshapeCartLines(data.cart.lines) };
}

// ---------- Menu Queries ----------

export async function getMenu(handle: string): Promise<Menu> {
  const key = `menu:${handle}`;
  const cached = cacheGet<Menu>(key);
  if (cached) return cached;

  const data = await shopifyFetch<any>(
    `query Menu($handle: String!) {
      menu(handle: $handle) {
        id
        handle
        title
        items {
          id title url type
          items {
            id title url type
            items {
              id title url type
            }
          }
        }
      }
    }`,
    { handle }
  );

  cacheSet(key, data.menu, TTL.MENU);
  return data.menu;
}

/** Extract a collection handle from a Shopify URL, e.g.
 *  "https://hlty.shop/collections/energie-1" → "energie-1" */
export function extractCollectionHandle(url: string): string | null {
  const match = url.match(/\/collections\/([^/?#]+)/);
  return match ? match[1] : null;
}

/** Convert a Shopify menu item URL to an internal route */
export function menuItemToRoute(item: MenuItem): string | null {
  const handle = extractCollectionHandle(item.url);
  if (handle) return `/collectie/${handle}`;
  if (item.url.includes('/pages/')) {
    const page = item.url.match(/\/pages\/([^/?#]+)/);
    if (page) return `/pagina/${page[1]}`;
  }
  if (/\/merken\b/i.test(item.url) || item.title.trim().toLowerCase() === 'merken') {
    return '/merken';
  }
  return null;
}

// ---------- Brand Queries ----------

export interface BrandSummary {
  name: string;
  handle: string;
  count: number;
  categoryKey: string;
  categoryLabel: string;
  productType: string;
}

/** Turn a vendor string into a URL-safe slug */
export function brandSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Category buckets that brands are grouped into on the /merken overview and
 * the "Merken" dropdown in the header. Order matters — used for section order.
 */
// NOTE: order matters. More specific matchers must come first because
// `categorizeProductType` returns on the first hit. E.g. "Spierverzorging en
// Gewrichtsverzorging" must hit the Sport bucket before the generic verzorging one.
export const BRAND_CATEGORIES: { key: string; label: string; match: (productType: string) => boolean }[] = [
  {
    key: 'sport-herstel',
    label: 'Sport & Herstel',
    match: (t) =>
      /brace|bandage|tape|orthese|spierverzorg|gewricht|sport|herstel|recovery|fysio|mobiliteit|oefening|therapie|ehbo|kompres/i.test(
        t
      ),
  },
  {
    key: 'supplementen',
    label: 'Supplementen & Vitamines',
    match: (t) =>
      /supplement|vitamin|mineral|kruid|herb|probiot|vetzu|aminozu|omega/i.test(t),
  },
  {
    key: 'voeding',
    label: 'Bewuste Voeding',
    match: (t) =>
      /voeding|food|superfood|drank|drink|thee|tea|repen|snack|ontbijt|shake|maaltijdvervang/i.test(
        t
      ),
  },
  {
    key: 'verzorging',
    label: 'Persoonlijke Verzorging',
    match: (t) =>
      /lichaamsverzorg|huidverzorg|haarverzorg|mondverzorg|dental|etherisch|aroma|essential|oliën|olieen|lichaamsolie/i.test(
        t
      ),
  },
  {
    key: 'lifestyle',
    label: 'Lifestyle & Accessoires',
    match: (t) =>
      /instrument|badkamer|toilet|beschermho|apparaat|device|gadget|accessoire|lifestyle|koken|tafelen|thermometer|glucosemeter|bloeddrukmet|manchet|meter/i.test(
        t
      ),
  },
];
export const BRAND_CATEGORY_OTHER = { key: 'overig', label: 'Overige Merken' };

/** Pick the best-matching category for a dominant productType. */
export function categorizeProductType(productType: string): { key: string; label: string } {
  const t = (productType || '').trim();
  if (!t) return BRAND_CATEGORY_OTHER;
  for (const cat of BRAND_CATEGORIES) {
    if (cat.match(t)) return { key: cat.key, label: cat.label };
  }
  return BRAND_CATEGORY_OTHER;
}

/**
 * Coarse buckets used by the Collection-page sub-filter pills.
 *
 * Intentionally separate from BRAND_CATEGORIES so that tuning these regexes
 * never affects the Merken-menu in the header.
 *
 *  - supplementen        → to ingest (vitamines, mineralen, aminozuren, kruidextract)
 *  - voeding             → consumable food (sportvoeding, superfoods, repen, dranken)
 *  - fysio-verzorging    → externally applied / used (braces, balsem, oliën, gels)
 *  - lifestyle-wellness  → meet-instrumenten + spiritualiteit (catches what would
 *                          otherwise dominate "Overig" in Stemming/Bloeddruk/Weerstand)
 *
 * Multi-match: a product can fall in multiple buckets (e.g. eiwitshake).
 */
const COLLECTION_CATEGORIES: { key: string; label: string; match: (productType: string) => boolean }[] = [
  {
    key: 'supplementen',
    label: 'Supplementen & Vitamines',
    match: (t) =>
      /aminozu|mineral|vitamin|voedingssupplement|kruid|herb|supplement|omega|vetzu|probiot|micro-?organism/i.test(t),
  },
  {
    key: 'voeding',
    label: 'Bewuste Voeding',
    match: (t) =>
      /sportvoed|superfood|pasta|rijst|reep|snack|drank|drink|shake|ontbijt|maaltijd|\bthee\b|\btea\b|dessert|soep|bouillon|chocola|honing|aardappel|\bgroente\b|\bfruit\b|koffie/i.test(t),
  },
  {
    key: 'fysio-verzorging',
    label: 'Fysio & Verzorging',
    match: (t) =>
      /verzorg|gewricht|etherisch|aroma|essential|oli(?:ën|en)|brace|bandage|tape|orthese|kompres|fysio|ehbo|balsem|massage|oefening|therapie|\bkruik|spalk|\bkussen|zwachtel|snelverband|inlegzo|geurversprei|mondhygi|\bsteken\b|\bbeten\b|dameshygi|pleister|badkamer|toilet/i.test(t),
  },
  {
    key: 'lifestyle-wellness',
    label: 'Lifestyle & Wellness',
    match: (t) =>
      /spiritualiteit|thermometer|glucosemet|bloeddrukmet|manchet|instrument/i.test(t),
  },
];

const COLLECTION_CATEGORY_OTHER = { key: 'overig', label: 'Overig' };

/**
 * Return *all* matching collection-pill categories for a productType.
 * A product can belong to multiple buckets (e.g. an eiwitshake matches both
 * Voeding via "shake" and Supplementen via "aminozu" if its productType says so).
 * Falls back to "Overig" if no rule matches.
 */
export function getProductCategories(productType: string): { key: string; label: string }[] {
  const t = (productType || '').trim();
  if (!t) return [COLLECTION_CATEGORY_OTHER];
  const matches = COLLECTION_CATEGORIES.filter((c) => c.match(t)).map(({ key, label }) => ({ key, label }));
  return matches.length > 0 ? matches : [COLLECTION_CATEGORY_OTHER];
}

/** Fetch all unique brands (vendors) with product counts, sorted by count desc. */
export async function getAllBrands(): Promise<BrandSummary[]> {
  const key = 'brands:all:v4';
  const cached = cacheGet<BrandSummary[]>(key);
  if (cached) return cached;

  // Lightweight vendor + productType query. Paginated to cover the full catalog.
  const all: { vendor: string; productType: string }[] = [];
  let cursor: string | null = null;
  for (let page = 0; page < 40; page++) {
    const data: any = await shopifyFetch<any>(
      `query Brands($first: Int!, $after: String) {
        products(first: $first, after: $after) {
          pageInfo { hasNextPage endCursor }
          edges { node { vendor productType } }
        }
      }`,
      { first: 100, after: cursor }
    );
    for (const edge of data.products.edges) all.push(edge.node);
    if (!data.products.pageInfo.hasNextPage) break;
    cursor = data.products.pageInfo.endCursor;
  }

  // Aggregate per vendor: total count + dominant productType
  const perBrand = new Map<string, { count: number; types: Map<string, number> }>();
  for (const p of all) {
    const vendor = (p.vendor || '').trim();
    if (!vendor) continue;
    const entry = perBrand.get(vendor) ?? { count: 0, types: new Map<string, number>() };
    entry.count += 1;
    const pt = (p.productType || '').trim();
    if (pt) entry.types.set(pt, (entry.types.get(pt) ?? 0) + 1);
    perBrand.set(vendor, entry);
  }

  const result: BrandSummary[] = [...perBrand.entries()]
    .map(([name, { count, types }]) => {
      // Dominant productType
      let dominant = '';
      let best = 0;
      for (const [pt, c] of types) {
        if (c > best) {
          best = c;
          dominant = pt;
        }
      }
      const cat = categorizeProductType(dominant);
      return {
        name,
        handle: brandSlug(name),
        count,
        categoryKey: cat.key,
        categoryLabel: cat.label,
        productType: dominant,
      };
    })
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  cacheSet(key, result, TTL.PRODUCTS);
  return result;
}

/** Fetch all products for a given vendor name (exact match). */
export async function getProductsByBrand(vendorName: string): Promise<Product[]> {
  const key = `brand-products:${vendorName}`;
  const cached = cacheGet<Product[]>(key);
  if (cached) return cached;

  const data = await shopifyFetch<any>(
    `${PRODUCT_CARD_FRAGMENT}
    query BrandProducts($query: String!, $first: Int!) {
      products(first: $first, query: $query, sortKey: BEST_SELLING) {
        edges { node { ...ProductCardFields } }
      }
    }`,
    { query: `vendor:"${vendorName.replace(/"/g, '\\"')}"`, first: 100 }
  );

  const result: Product[] = data.products.edges.map((e: any) => reshapeProduct(e.node));
  cacheSet(key, result, TTL.PRODUCTS);
  return result;
}

// ---------- Customer Auth ----------

export interface CustomerOrder {
  id: string;
  orderNumber: number;
  processedAt: string;
  financialStatus: string;
  fulfillmentStatus: string;
  totalPrice: Money;
  lineItems: {
    title: string;
    quantity: number;
    variant: { image: ShopifyImage | null } | null;
  }[];
}

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  orders: CustomerOrder[];
}

export interface CustomerUserError {
  field: string[] | null;
  message: string;
}

export async function customerLogin(email: string, password: string): Promise<{ token: string; expiresAt: string }> {
  const data = await shopifyFetch<any>(
    `mutation CustomerLogin($input: CustomerAccessTokenCreateInput!) {
      customerAccessTokenCreate(input: $input) {
        customerAccessToken {
          accessToken
          expiresAt
        }
        customerUserErrors {
          field
          message
        }
      }
    }`,
    { input: { email, password } }
  );

  const result = data.customerAccessTokenCreate;
  if (result.customerUserErrors.length > 0) {
    throw new Error(result.customerUserErrors[0].message);
  }
  return {
    token: result.customerAccessToken.accessToken,
    expiresAt: result.customerAccessToken.expiresAt,
  };
}

export async function customerRegister(input: {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}): Promise<Customer> {
  const data = await shopifyFetch<any>(
    `mutation CustomerRegister($input: CustomerCreateInput!) {
      customerCreate(input: $input) {
        customer {
          id
          firstName
          lastName
          email
          phone
        }
        customerUserErrors {
          field
          message
        }
      }
    }`,
    { input }
  );

  const result = data.customerCreate;
  if (result.customerUserErrors.length > 0) {
    throw new Error(result.customerUserErrors[0].message);
  }
  return result.customer;
}

export async function getCustomer(accessToken: string): Promise<Customer> {
  const data = await shopifyFetch<any>(
    `query Customer($accessToken: String!) {
      customer(customerAccessToken: $accessToken) {
        id
        firstName
        lastName
        email
        phone
        orders(first: 20, sortKey: PROCESSED_AT, reverse: true) {
          edges {
            node {
              id
              orderNumber
              processedAt
              financialStatus
              fulfillmentStatus
              totalPriceV2 { amount currencyCode }
              lineItems(first: 5) {
                edges {
                  node {
                    title
                    quantity
                    variant { image { url altText } }
                  }
                }
              }
            }
          }
        }
      }
    }`,
    { accessToken }
  );

  if (!data.customer) throw new Error('Niet ingelogd');

  const customer = data.customer;
  return {
    ...customer,
    orders: customer.orders.edges.map((e: any) => ({
      ...e.node,
      totalPrice: e.node.totalPriceV2,
      lineItems: e.node.lineItems.edges.map((le: any) => le.node),
    })),
  };
}

export async function customerRecover(email: string): Promise<void> {
  const data = await shopifyFetch<any>(
    `mutation CustomerRecover($email: String!) {
      customerRecover(email: $email) {
        customerUserErrors {
          field
          message
        }
      }
    }`,
    { email }
  );

  const errors = data.customerRecover.customerUserErrors;
  if (errors.length > 0) {
    throw new Error(errors[0].message);
  }
}

// ---------- Price Formatter ----------

export function formatPrice(money: Money): string {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: money.currencyCode,
  }).format(parseFloat(money.amount));
}
