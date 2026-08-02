// Vercel serverless function — genereert sitemap.xml dynamisch uit
// Shopify Storefront data + statische routes.
//
// Wordt aangeroepen via /sitemap.xml (rewrite in vercel.json).
// Cache: 1 uur edge cache, daarna stale-while-revalidate van 24 uur —
// crawlers krijgen altijd snel een verse versie zonder Shopify-roundtrip.

interface VercelRequest {
  method?: string;
}

interface VercelResponse {
  status: (code: number) => VercelResponse;
  setHeader: (name: string, value: string) => void;
  send: (body: string) => void;
}

const SITE_URL = 'https://www.hlty.shop';
const SHOPIFY_DOMAIN = process.env.VITE_SHOPIFY_DOMAIN;
const STOREFRONT_TOKEN = process.env.VITE_STOREFRONT_TOKEN;
const API_VERSION = '2026-07';

const STATIC_PAGES: { path: string; priority: string; changefreq: string }[] = [
  { path: '/', priority: '1.0', changefreq: 'daily' },
  { path: '/alle-producten', priority: '0.8', changefreq: 'daily' },
  { path: '/contact', priority: '0.5', changefreq: 'monthly' },
  { path: '/veelgestelde-vragen', priority: '0.6', changefreq: 'monthly' },
  { path: '/beleid/privacy', priority: '0.3', changefreq: 'yearly' },
  { path: '/beleid/verzending', priority: '0.5', changefreq: 'yearly' },
  { path: '/beleid/retour', priority: '0.4', changefreq: 'yearly' },
  { path: '/beleid/voorwaarden', priority: '0.3', changefreq: 'yearly' },
  { path: '/beleid/contact-informatie', priority: '0.3', changefreq: 'yearly' },
  { path: '/beleid/wettelijke-kennisgeving', priority: '0.2', changefreq: 'yearly' },
];

async function shopifyFetch<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  if (!SHOPIFY_DOMAIN || !STOREFRONT_TOKEN) {
    throw new Error('Shopify env vars niet gezet (VITE_SHOPIFY_DOMAIN / VITE_STOREFRONT_TOKEN)');
  }
  const res = await fetch(`https://${SHOPIFY_DOMAIN}/api/${API_VERSION}/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': STOREFRONT_TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = (await res.json()) as { data?: T; errors?: { message: string }[] };
  if (json.errors?.length) throw new Error(json.errors[0].message);
  if (!json.data) throw new Error('Geen data van Shopify');
  return json.data;
}

interface ProductNode {
  handle: string;
  vendor: string;
  updatedAt: string;
}
interface ProductsResponse {
  products: {
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
    edges: { node: ProductNode }[];
  };
}

async function fetchAllProducts(): Promise<ProductNode[]> {
  const all: ProductNode[] = [];
  let after: string | null = null;
  while (true) {
    const data: ProductsResponse = await shopifyFetch<ProductsResponse>(
      `query Products($after: String) {
        products(first: 250, after: $after) {
          pageInfo { hasNextPage endCursor }
          edges { node { handle vendor updatedAt } }
        }
      }`,
      { after }
    );
    all.push(...data.products.edges.map((e) => e.node));
    if (!data.products.pageInfo.hasNextPage) break;
    after = data.products.pageInfo.endCursor;
  }
  return all;
}

interface CollectionNode {
  handle: string;
  updatedAt: string;
}
interface CollectionsResponse {
  collections: {
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
    edges: { node: CollectionNode }[];
  };
}

async function fetchAllCollections(): Promise<CollectionNode[]> {
  const all: CollectionNode[] = [];
  let after: string | null = null;
  while (true) {
    const data: CollectionsResponse = await shopifyFetch<CollectionsResponse>(
      `query Collections($after: String) {
        collections(first: 250, after: $after) {
          pageInfo { hasNextPage endCursor }
          edges { node { handle updatedAt } }
        }
      }`,
      { after }
    );
    all.push(...data.collections.edges.map((e) => e.node));
    if (!data.collections.pageInfo.hasNextPage) break;
    after = data.collections.pageInfo.endCursor;
  }
  return all;
}

function brandHandle(vendor: string): string {
  return vendor
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function urlEntry(loc: string, lastmod?: string, priority?: string, changefreq?: string): string {
  return [
    '  <url>',
    `    <loc>${escapeXml(loc)}</loc>`,
    lastmod ? `    <lastmod>${lastmod.slice(0, 10)}</lastmod>` : null,
    changefreq ? `    <changefreq>${changefreq}</changefreq>` : null,
    priority ? `    <priority>${priority}</priority>` : null,
    '  </url>',
  ]
    .filter(Boolean)
    .join('\n');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method && req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    res.status(405).send('Method not allowed');
    return;
  }

  try {
    const [products, collections] = await Promise.all([fetchAllProducts(), fetchAllCollections()]);

    // Brands afleiden uit unieke vendors die echt een product hebben.
    const brandMap = new Map<string, string>();
    for (const p of products) {
      if (!p.vendor) continue;
      const handle = brandHandle(p.vendor);
      if (!brandMap.has(handle)) brandMap.set(handle, p.updatedAt);
      else if (p.updatedAt > (brandMap.get(handle) as string)) brandMap.set(handle, p.updatedAt);
    }

    const entries: string[] = [];

    for (const p of STATIC_PAGES) {
      entries.push(urlEntry(`${SITE_URL}${p.path}`, undefined, p.priority, p.changefreq));
    }
    for (const c of collections) {
      entries.push(urlEntry(`${SITE_URL}/collectie/${c.handle}`, c.updatedAt, '0.8', 'weekly'));
    }
    for (const [handle, lastmod] of brandMap) {
      entries.push(urlEntry(`${SITE_URL}/merken/${handle}`, lastmod, '0.7', 'weekly'));
    }
    for (const p of products) {
      entries.push(urlEntry(`${SITE_URL}/product/${p.handle}`, p.updatedAt, '0.7', 'weekly'));
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join('\n')}
</urlset>
`;

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    res.status(200).send(xml);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Onbekende fout';
    res.status(500).send(`<?xml version="1.0" encoding="UTF-8"?>\n<!-- sitemap error: ${escapeXml(msg)} -->\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`);
  }
}
