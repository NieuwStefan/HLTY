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
  return null;
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
