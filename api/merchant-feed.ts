import {
  createMerchantFeed,
  readFeedConfig,
  type FeedConfig,
  type FeedDependencies,
} from './_merchant-feed.js';

const SUCCESS_HEADERS = {
  'Content-Type': 'application/rss+xml; charset=utf-8',
  'Cache-Control': 'public, max-age=0, must-revalidate',
  'Vercel-CDN-Cache-Control': 'public, s-maxage=900, stale-while-revalidate=3600, stale-if-error=86400',
  'X-Content-Type-Options': 'nosniff',
};

interface HandlerOptions {
  config?: FeedConfig;
  dependencies?: FeedDependencies;
}

/** Afzonderlijk exporteerbaar zodat HTTP-gedrag zonder live netwerk testbaar blijft. */
export async function handleMerchantFeedRequest(
  request: Request,
  options: HandlerOptions = {},
): Promise<Response> {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response('Method not allowed', {
      status: 405,
      headers: {
        Allow: 'GET, HEAD',
        'Cache-Control': 'no-store',
      },
    });
  }

  try {
    const payload = await createMerchantFeed(
      options.config ?? readFeedConfig(),
      options.dependencies,
    );
    const headers = new Headers(SUCCESS_HEADERS);
    headers.set('ETag', payload.etag);

    if (request.headers.get('if-none-match') === payload.etag) {
      return new Response(null, { status: 304, headers });
    }

    return new Response(request.method === 'HEAD' ? null : payload.xml, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('Merchant-feed geweigerd:', error);
    return new Response(request.method === 'HEAD' ? null : 'Merchant-feed tijdelijk niet beschikbaar.', {
      status: 503,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
        'Retry-After': '300',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  }
}

/** Publieke Vercel Web Handler volgens de actuele Request/Response-API. */
export default {
  fetch: handleMerchantFeedRequest,
};
