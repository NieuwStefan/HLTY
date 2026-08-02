import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { XMLParser, XMLValidator } from 'fast-xml-parser';

import {
  PILOT_BATCH_SIZE,
  PILOT_AID_HANDLES,
  PILOT_HANDLES,
  PILOT_ITEM_COUNT,
  PILOT_SUPPLEMENT_HANDLES,
  SHOPIFY_API_VERSION,
  assertPilotAllowlist,
  createMerchantFeed,
  escapeXml,
  merchantContentHash,
  readFeedConfig,
  sanitizeXmlText,
} from '../api/_merchant-feed';
import { handleMerchantFeedRequest } from '../api/merchant-feed';
import type { PilotContract } from '../api/_merchant-pilot-contract';
import { isGoogleMerchantGtin, isValidGtin } from '../src/lib/gtin';

const TEST_CONFIG = {
  domain: 'hlty-test.myshopify.com',
  storefrontToken: 'test-token',
};

interface FixtureImage {
  url: string;
  width: number | null;
  height: number | null;
}

interface FixtureProduct {
  handle: string;
  title: string;
  description: string;
  vendor: string;
  productType: string;
  images: { nodes: FixtureImage[] };
  variants: {
    nodes: Array<{
      id: string;
      sku: string | null;
      barcode: string | null;
      availableForSale: boolean;
      currentlyNotInStock: boolean;
      price: { amount: string; currencyCode: string };
      image: FixtureImage | null;
    }>;
  };
}

interface FetchCall {
  handles: string[];
  url: string;
}

interface FakeFetchOptions {
  mutateProduct?: (product: FixtureProduct, productIndex: number) => void;
  intercept?: (callIndex: number, handles: string[]) => Response | undefined;
}

function calculateGtin(body: string): string {
  const digits = body.split('').map(Number);
  let sum = 0;
  let weight = 3;
  for (let index = digits.length - 1; index >= 0; index -= 1) {
    sum += digits[index] * weight;
    weight = weight === 3 ? 1 : 3;
  }
  return `${body}${(10 - (sum % 10)) % 10}`;
}

function fixtureProduct(handle: string, index: number): FixtureProduct {
  return {
    handle,
    title: index === 0 ? 'Orthica & Test <speciaal> 😊' : `Pilotproduct ${index + 1}`,
    description: `Heldere beschrijving voor ${handle} & veilig getest.`,
    vendor: index < 20 ? 'Supplementmerk' : 'Hulpmiddelenmerk',
    productType: index < 20 ? 'Voedingssupplementen' : 'Fysio & herstel',
    images: {
      nodes: [
        {
          url: `https://cdn.shopify.com/pilot-${index}.jpg?width=800&format=webp`,
          width: 800,
          height: 800,
        },
        {
          url: `https://cdn.shopify.com/pilot-${index}-extra.jpg`,
          width: 700,
          height: 700,
        },
      ],
    },
    variants: {
      nodes: [
        {
          id: `gid://shopify/ProductVariant/${900_000 + index}`,
          sku: `PILOT-${String(index + 1).padStart(3, '0')}`,
          barcode: calculateGtin(String(871_000_000_000 + index)),
          availableForSale: index !== 7,
          currentlyNotInStock: false,
          price: { amount: `${12 + index}.95`, currencyCode: 'EUR' },
          image: null,
        },
      ],
    },
  };
}

function createTestContract(): PilotContract {
  return Object.fromEntries(PILOT_HANDLES.map((handle, index) => {
    const product = fixtureProduct(handle, index);
    const variant = product.variants.nodes[0];
    return [handle, {
      variantId: variant.id.slice('gid://shopify/ProductVariant/'.length),
      sku: variant.sku as string,
      gtin: variant.barcode as string,
      contentHash: merchantContentHash({
        title: product.title,
        description: product.description,
        brand: product.vendor,
        productType: product.productType,
      }),
    }];
  }));
}

const TEST_CONTRACT = createTestContract();

function createFakeFetch(options: FakeFetchOptions = {}) {
  const calls: FetchCall[] = [];
  let activeRequests = 0;
  let maxActiveRequests = 0;

  const fetchImpl = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    const body = JSON.parse(String(init?.body)) as {
      variables: Record<string, string>;
    };
    const handles = Object.values(body.variables);
    const callIndex = calls.length;
    calls.push({ handles, url });

    activeRequests += 1;
    maxActiveRequests = Math.max(maxActiveRequests, activeRequests);
    await Promise.resolve();
    activeRequests -= 1;

    const intercepted = options.intercept?.(callIndex, handles);
    if (intercepted) return intercepted;

    const data = Object.fromEntries(handles.map((handle, batchIndex) => {
      const productIndex = PILOT_HANDLES.indexOf(handle as (typeof PILOT_HANDLES)[number]);
      assert.notEqual(productIndex, -1, `Onverwachte testhandle: ${handle}`);
      const product = fixtureProduct(handle, productIndex);
      options.mutateProduct?.(product, productIndex);
      return [`p${batchIndex}`, product];
    }));

    return new Response(JSON.stringify({ data }), {
      status: 200,
      headers: { 'X-Shopify-API-Version': SHOPIFY_API_VERSION },
    });
  }) as typeof fetch;

  return {
    fetchImpl,
    dependencies: { fetchImpl, pilotContract: TEST_CONTRACT },
    calls,
    getMaxActiveRequests: () => maxActiveRequests,
  };
}

test('pilot-allowlist bevat exact 20 supplementen en 20 hulpmiddelen', () => {
  assertPilotAllowlist();
  assert.equal(PILOT_HANDLES.length, PILOT_ITEM_COUNT);
  assert.equal(new Set(PILOT_HANDLES).size, PILOT_ITEM_COUNT);
  assert.equal(PILOT_SUPPLEMENT_HANDLES.length, 20);
  assert.equal(PILOT_AID_HANDLES.length, 20);
  assert.deepEqual(PILOT_HANDLES, [...PILOT_SUPPLEMENT_HANDLES, ...PILOT_AID_HANDLES]);
  assert.throws(() => assertPilotAllowlist(PILOT_HANDLES.slice(1)), /exact 40/);
  assert.throws(
    () => assertPilotAllowlist([...PILOT_HANDLES.slice(0, 39), PILOT_HANDLES[0]]),
    /dubbele handles/,
  );
});

test('GTIN-validatie ondersteunt 8, 12, 13 en 14 cijfers inclusief voorloopnul', () => {
  for (const body of ['1234567', '01234567890', '871000000000', '0123456789012']) {
    assert.equal(isValidGtin(calculateGtin(body)), true);
  }
  const valid = calculateGtin('871000000000');
  const wrongCheckDigit = `${valid.slice(0, -1)}${(Number(valid.at(-1)) + 1) % 10}`;
  assert.equal(isValidGtin(wrongCheckDigit), false);
  assert.equal(isValidGtin('871000000000A'), false);
  assert.equal(isValidGtin('123456'), false);
});

test('Google Merchant-validatie weigert restricted, coupon- en bulkprefixes', () => {
  for (const body of [
    '020000000000',
    '040000000000',
    '200000000000',
    '050000000000',
    '980000000000',
    '990000000000',
  ]) {
    const gtin = calculateGtin(body);
    assert.equal(isValidGtin(gtin), true);
    assert.equal(isGoogleMerchantGtin(gtin), false);
  }

  assert.equal(isGoogleMerchantGtin(calculateGtin('1020000000000')), false);
  assert.equal(isGoogleMerchantGtin(calculateGtin('9871000000000')), false);
  assert.equal(isGoogleMerchantGtin(calculateGtin('1871000000000')), true);
});

test('bouwt vier sequentiële batches en geldige deterministische XML met 40 items', async () => {
  const fake = createFakeFetch();
  const first = await createMerchantFeed(TEST_CONFIG, {
    ...fake.dependencies,
    sleep: async () => undefined,
  });

  assert.equal(fake.calls.length, 4);
  assert.equal(fake.getMaxActiveRequests(), 1);
  fake.calls.forEach((call, callIndex) => {
    assert.equal(call.url, `https://${TEST_CONFIG.domain}/api/${SHOPIFY_API_VERSION}/graphql.json`);
    assert.deepEqual(
      call.handles,
      PILOT_HANDLES.slice(callIndex * PILOT_BATCH_SIZE, (callIndex + 1) * PILOT_BATCH_SIZE),
    );
  });

  assert.equal(first.items.length, 40);
  assert.equal(first.items[7].availability, 'out_of_stock');
  assert.equal(first.items[0].price, '12.95 EUR');
  assert.equal(
    first.items[0].description,
    'Productinformatie voor Orthica & Test <speciaal> 😊. Merk: Supplementmerk. Producttype: Voedingssupplementen.',
  );
  assert.equal(
    first.items[0].sourceContentHash,
    TEST_CONTRACT[PILOT_HANDLES[0]].contentHash,
  );
  assert.doesNotMatch(first.xml, /Heldere beschrijving voor/);
  assert.equal(XMLValidator.validate(first.xml), true);
  assert.match(first.xml, /Orthica &amp; Test &lt;speciaal&gt; 😊/);
  assert.match(first.xml, /width=800&amp;format=webp/);

  const parsed = new XMLParser({ ignoreAttributes: false }).parse(first.xml) as {
    rss: { channel: { item: Array<Record<string, unknown>> } };
  };
  assert.equal(parsed.rss.channel.item.length, 40);
  const requiredTags = [
    'g:id',
    'g:title',
    'g:description',
    'g:link',
    'g:image_link',
    'g:availability',
    'g:price',
    'g:brand',
    'g:gtin',
    'g:condition',
    'g:product_type',
    'g:custom_label_0',
  ];
  for (const item of parsed.rss.channel.item) {
    for (const tag of requiredTags) assert.ok(Object.hasOwn(item, tag), `Tag ontbreekt: ${tag}`);
    assert.equal(item['g:condition'], 'new');
    assert.equal(item['g:custom_label_0'], 'pilot');
    assert.ok(['in_stock', 'out_of_stock'].includes(String(item['g:availability'])));
  }
  assert.equal(new Set(first.items.map((item) => item.id)).size, 40);
  assert.equal(new Set(first.items.map((item) => item.gtin)).size, 40);

  const secondFake = createFakeFetch();
  const second = await createMerchantFeed(TEST_CONFIG, secondFake.dependencies);
  assert.equal(second.xml, first.xml);
  assert.equal(second.etag, first.etag);
});

test('XML-escaping verwerkt alle vijf gereserveerde tekens', () => {
  assert.equal(escapeXml(`&<>"'`), '&amp;&lt;&gt;&quot;&apos;');
});

test('XML-sanitizing verwijdert C0-controls en losse surrogaten', () => {
  const unsafe = `goed\u0000\u0001\u000Btekst\uD800einde`;
  assert.equal(sanitizeXmlText(unsafe), 'goedteksteinde');
  assert.equal(escapeXml(unsafe), 'goedteksteinde');
});

test('blokkeert een tweede variant, te klein beeld en dubbele GTIN', async (t) => {
  await t.test('tweede variant', async () => {
    const fake = createFakeFetch({
      mutateProduct(product, index) {
        if (index === 3) product.variants.nodes.push({ ...product.variants.nodes[0] });
      },
    });
    await assert.rejects(
      createMerchantFeed(TEST_CONFIG, fake.dependencies),
      /exact één variant/,
    );
  });

  await t.test('beeld kleiner dan 500×500', async () => {
    const fake = createFakeFetch({
      mutateProduct(product, index) {
        if (index === 4) {
          product.images.nodes = [{ url: 'https://cdn.shopify.com/small.jpg', width: 499, height: 800 }];
        }
      },
    });
    await assert.rejects(
      createMerchantFeed(TEST_CONFIG, fake.dependencies),
      /Primaire afbeelding/,
    );
  });

  await t.test('onveilige primaire beeld-URL', async () => {
    const fake = createFakeFetch({
      mutateProduct(product, index) {
        if (index === 4) product.images.nodes[0].url = 'http://cdn.shopify.com/onveilig.jpg';
      },
    });
    await assert.rejects(
      createMerchantFeed(TEST_CONFIG, fake.dependencies),
      /Primaire afbeelding/,
    );
  });

  await t.test('backorder zonder datum', async () => {
    const fake = createFakeFetch({
      mutateProduct(product, index) {
        if (index === 4) product.variants.nodes[0].currentlyNotInStock = true;
      },
    });
    await assert.rejects(
      createMerchantFeed(TEST_CONFIG, fake.dependencies),
      /Backorder zonder bevestigde beschikbaarheidsdatum/,
    );
  });

  await t.test('dubbele GTIN', async () => {
    const firstGtin = calculateGtin(String(871_000_000_000));
    const fake = createFakeFetch({
      mutateProduct(product, index) {
        if (index === 1) product.variants.nodes[0].barcode = firstGtin;
      },
    });
    await assert.rejects(
      createMerchantFeed(TEST_CONFIG, fake.dependencies),
      /dubbele GTIN/,
    );
  });
});

test('blokkeert identifier- en commerciële tekstdrift ten opzichte van het pilotcontract', async (t) => {
  await t.test('identifierdrift', async () => {
    const fake = createFakeFetch({
      mutateProduct(product, index) {
        if (index === 2) product.variants.nodes[0].sku = 'NIEUWE-SKU';
      },
    });
    await assert.rejects(
      createMerchantFeed(TEST_CONFIG, fake.dependencies),
      /Identifierdrift/,
    );
  });

  await t.test('niet-beoordeelde tekstwijziging', async () => {
    const fake = createFakeFetch({
      mutateProduct(product, index) {
        if (index === 2) product.description += ' Nieuwe leveranciersclaim.';
      },
    });
    await assert.rejects(
      createMerchantFeed(TEST_CONFIG, fake.dependencies),
      /Niet-beoordeelde tekstwijziging/,
    );
  });

  await t.test('tekstwijziging na de oude veldlimieten', async () => {
    const handle = PILOT_HANDLES[0];
    const baselineProduct = fixtureProduct(handle, 0);
    baselineProduct.title = `${'T'.repeat(160)} origineel`;
    baselineProduct.description = `${'D'.repeat(5_100)} origineel`;
    const contract: PilotContract = {
      ...TEST_CONTRACT,
      [handle]: {
        ...TEST_CONTRACT[handle],
        contentHash: merchantContentHash({
          title: baselineProduct.title,
          description: baselineProduct.description,
          brand: baselineProduct.vendor,
          productType: baselineProduct.productType,
        }),
      },
    };
    const fake = createFakeFetch({
      mutateProduct(product, index) {
        if (index === 0) {
          product.title = `${'T'.repeat(160)} gewijzigd`;
          product.description = `${'D'.repeat(5_100)} gewijzigd`;
        }
      },
    });
    await assert.rejects(
      createMerchantFeed(TEST_CONFIG, { ...fake.dependencies, pilotContract: contract }),
      /Niet-beoordeelde tekstwijziging/,
    );
  });

  await t.test('onvolledig contract', async () => {
    const fake = createFakeFetch();
    await assert.rejects(
      createMerchantFeed(TEST_CONFIG, {
        ...fake.dependencies,
        pilotContract: {},
      }),
      /niet exact overeen met de allowlist/,
    );
  });
});

test('probeert 429 en tijdelijke GraphQL-fouten begrensd opnieuw', async (t) => {
  await t.test('HTTP 429', async () => {
    const delays: number[] = [];
    const fake = createFakeFetch({
      intercept(callIndex) {
        return callIndex === 0 ? new Response('', { status: 429 }) : undefined;
      },
    });
    const feed = await createMerchantFeed(TEST_CONFIG, {
      ...fake.dependencies,
      sleep: async (delay) => { delays.push(delay); },
    });
    assert.equal(feed.items.length, 40);
    assert.equal(fake.calls.length, 5);
    assert.deepEqual(delays, [250]);
  });

  await t.test('GraphQL THROTTLED', async () => {
    const fake = createFakeFetch({
      intercept(callIndex) {
        return callIndex === 0
          ? new Response(JSON.stringify({
              errors: [{ message: 'Throttled', extensions: { code: 'THROTTLED' } }],
            }), {
              status: 200,
              headers: { 'X-Shopify-API-Version': SHOPIFY_API_VERSION },
            })
          : undefined;
      },
    });
    const feed = await createMerchantFeed(TEST_CONFIG, {
      ...fake.dependencies,
      sleep: async () => undefined,
    });
    assert.equal(feed.items.length, 40);
    assert.equal(fake.calls.length, 5);
  });
});

test('blokkeert ongeldige Shopify- en productresponses fail-closed', async (t) => {
  const versionHeaders = { 'X-Shopify-API-Version': SHOPIFY_API_VERSION };

  await t.test('afwijkende API-versie', async () => {
    const fake = createFakeFetch({
      intercept(callIndex) {
        return callIndex === 0
          ? new Response(JSON.stringify({ data: {} }), {
              status: 200,
              headers: { 'X-Shopify-API-Version': '2025-10' },
            })
          : undefined;
      },
    });
    await assert.rejects(createMerchantFeed(TEST_CONFIG, fake.dependencies), /API-versie wijkt af/);
  });

  await t.test('ongeldige JSON', async () => {
    const fake = createFakeFetch({
      intercept(callIndex) {
        return callIndex === 0
          ? new Response('{ongeldig', { status: 200, headers: versionHeaders })
          : undefined;
      },
    });
    await assert.rejects(createMerchantFeed(TEST_CONFIG, fake.dependencies), /ongeldige JSON/);
  });

  await t.test('niet-herstelbare GraphQL-fout', async () => {
    const fake = createFakeFetch({
      intercept(callIndex) {
        return callIndex === 0
          ? new Response(JSON.stringify({
              errors: [{ message: 'Schemafout', extensions: { code: 'GRAPHQL_VALIDATION_FAILED' } }],
            }), { status: 200, headers: versionHeaders })
          : undefined;
      },
    });
    await assert.rejects(
      createMerchantFeed(TEST_CONFIG, fake.dependencies),
      /niet-herstelbare GraphQL-fout/,
    );
  });

  await t.test('ontbrekend product', async () => {
    const fake = createFakeFetch({
      intercept(callIndex, handles) {
        if (callIndex !== 0) return undefined;
        const data = Object.fromEntries(handles.map((_handle, index) => [`p${index}`, null]));
        return new Response(JSON.stringify({ data }), { status: 200, headers: versionHeaders });
      },
    });
    await assert.rejects(createMerchantFeed(TEST_CONFIG, fake.dependencies), /Pilotproduct ontbreekt/);
  });

  await t.test('verkeerde handle', async () => {
    const fake = createFakeFetch({
      mutateProduct(product, index) {
        if (index === 0) product.handle = 'verkeerd-product';
      },
    });
    await assert.rejects(createMerchantFeed(TEST_CONFIG, fake.dependencies), /onverwachte handle/);
  });

  await t.test('ongeldige prijs en valuta', async () => {
    const fake = createFakeFetch({
      mutateProduct(product, index) {
        if (index === 0) product.variants.nodes[0].price = { amount: '0', currencyCode: 'USD' };
      },
    });
    await assert.rejects(createMerchantFeed(TEST_CONFIG, fake.dependencies), /Ongeldige prijs of valuta/);
  });

  await t.test('ontbrekende SKU', async () => {
    const fake = createFakeFetch({
      mutateProduct(product, index) {
        if (index === 0) product.variants.nodes[0].sku = null;
      },
    });
    await assert.rejects(createMerchantFeed(TEST_CONFIG, fake.dependencies), /SKU ontbreekt/);
  });

  await t.test('dubbele variant-ID en SKU', async () => {
    const first = fixtureProduct(PILOT_HANDLES[0], 0).variants.nodes[0];
    const fake = createFakeFetch({
      mutateProduct(product, index) {
        if (index === 1) {
          product.variants.nodes[0].id = first.id;
          product.variants.nodes[0].sku = first.sku;
        }
      },
    });
    await assert.rejects(createMerchantFeed(TEST_CONFIG, fake.dependencies), /dubbele variant-ID/);
  });
});

test('geeft nooit gedeeltelijke XML als een latere batch blijft falen', async () => {
  const fake = createFakeFetch({
    intercept(_callIndex, handles) {
      return handles[0] === PILOT_HANDLES[20]
        ? new Response('', { status: 503 })
        : undefined;
    },
  });
  await assert.rejects(
    createMerchantFeed(TEST_CONFIG, {
      ...fake.dependencies,
      sleep: async () => undefined,
    }),
    /HTTP 503/,
  );
  assert.equal(fake.calls.length, 5);
});

test('HTTP-laag levert GET, HEAD, ETag, 405 en fail-closed 503 correct', async (t) => {
  await t.test('GET en ETag', async () => {
    const fake = createFakeFetch();
    const response = await handleMerchantFeedRequest(
      new Request('https://www.hlty.shop/merchant-feed.xml'),
      { config: TEST_CONFIG, dependencies: fake.dependencies },
    );
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type') ?? '', /application\/rss\+xml/);
    assert.match(response.headers.get('vercel-cdn-cache-control') ?? '', /stale-if-error=86400/);
    const etag = response.headers.get('etag');
    assert.ok(etag);

    const notModifiedFake = createFakeFetch();
    const notModified = await handleMerchantFeedRequest(
      new Request('https://www.hlty.shop/merchant-feed.xml', {
        headers: { 'If-None-Match': etag },
      }),
      { config: TEST_CONFIG, dependencies: notModifiedFake.dependencies },
    );
    assert.equal(notModified.status, 304);
    assert.equal(await notModified.text(), '');
  });

  await t.test('HEAD', async () => {
    const fake = createFakeFetch();
    const response = await handleMerchantFeedRequest(
      new Request('https://www.hlty.shop/merchant-feed.xml', { method: 'HEAD' }),
      { config: TEST_CONFIG, dependencies: fake.dependencies },
    );
    assert.equal(response.status, 200);
    assert.equal(await response.text(), '');
    assert.equal(fake.calls.length, 4);
  });

  await t.test('405', async () => {
    const response = await handleMerchantFeedRequest(
      new Request('https://www.hlty.shop/merchant-feed.xml', { method: 'POST' }),
    );
    assert.equal(response.status, 405);
    assert.equal(response.headers.get('allow'), 'GET, HEAD');
  });

  await t.test('503 bij blijvende Shopify-fout', async () => {
    const originalError = console.error;
    console.error = () => undefined;
    try {
      const fake = createFakeFetch({
        intercept() {
          return new Response('', { status: 503 });
        },
      });
      const response = await handleMerchantFeedRequest(
        new Request('https://www.hlty.shop/merchant-feed.xml'),
        {
          config: TEST_CONFIG,
          dependencies: {
            ...fake.dependencies,
            sleep: async () => undefined,
          },
        },
      );
      assert.equal(response.status, 503);
      assert.equal(response.headers.get('cache-control'), 'no-store');
      assert.equal(response.headers.get('retry-after'), '300');
      assert.equal(await response.text(), 'Merchant-feed tijdelijk niet beschikbaar.');
    } finally {
      console.error = originalError;
    }
  });
});

test('config ondersteunt servernamen en tijdelijke VITE-compatibiliteit', () => {
  assert.deepEqual(
    readFeedConfig({
      SHOPIFY_DOMAIN: 'server.myshopify.com',
      SHOPIFY_STOREFRONT_TOKEN: 'server-token',
      VITE_SHOPIFY_DOMAIN: 'vite.myshopify.com',
      VITE_STOREFRONT_TOKEN: 'vite-token',
    }),
    { domain: 'server.myshopify.com', storefrontToken: 'server-token' },
  );
  assert.deepEqual(
    readFeedConfig({
      VITE_SHOPIFY_DOMAIN: 'vite.myshopify.com',
      VITE_STOREFRONT_TOKEN: 'vite-token',
    }),
    { domain: 'vite.myshopify.com', storefrontToken: 'vite-token' },
  );
  assert.throws(() => readFeedConfig({}), /domein ontbreekt/);
});

test('Merchant-rewrite staat vóór de SPA-catch-all', async () => {
  const config = JSON.parse(await readFile(new URL('../vercel.json', import.meta.url), 'utf8')) as {
    rewrites: Array<{ source: string; destination: string }>;
  };
  const feedIndex = config.rewrites.findIndex((rewrite) => rewrite.source === '/merchant-feed.xml');
  const spaIndex = config.rewrites.findIndex((rewrite) => rewrite.destination === '/index.html');
  assert.notEqual(feedIndex, -1);
  assert.ok(feedIndex < spaIndex);
  assert.equal(config.rewrites[feedIndex].destination, '/api/merchant-feed');
});

test('Vercel-functie gebruikt Node-ESM-resolveerbare runtime-imports', async () => {
  for (const file of ['api/merchant-feed.ts', 'api/_merchant-feed.ts']) {
    const source = await readFile(new URL(`../${file}`, import.meta.url), 'utf8');
    const relativeImports = [...source.matchAll(/from\s+['"](\.{1,2}\/[^'"]+)['"]/g)]
      .map((match) => match[1]);
    assert.ok(relativeImports.length > 0, `Geen relatieve imports gevonden in ${file}`);
    for (const specifier of relativeImports) {
      assert.match(specifier, /\.js$/, `Node-ESM-import mist .js in ${file}: ${specifier}`);
    }
  }
});
