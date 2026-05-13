// GET /api/customer/orders?first=10
//
// Returns the logged-in customer's recent orders.

import {
  CUSTOMER_AUTH,
  COOKIES,
  parseCookies,
  callTokenEndpoint,
  buildAuthCookies,
  clearCookie,
  type VercelReq,
  type VercelRes,
} from '../_auth-helpers.js';

const QUERY = `
  query Orders($first: Int!) {
    customer {
      orders(first: $first, sortKey: PROCESSED_AT, reverse: true) {
        edges {
          node {
            id
            number
            name
            processedAt
            financialStatus
            fulfillmentStatus
            totalPrice { amount currencyCode }
            shippingAddress {
              formatted
              city
              zip
              country
            }
            fulfillments(first: 5) {
              edges {
                node {
                  status
                  trackingInformation {
                    number
                    url
                    company
                  }
                }
              }
            }
            lineItems(first: 25) {
              edges {
                node {
                  title
                  quantity
                  image { url altText }
                  variantTitle
                  variantId
                }
              }
            }
          }
        }
      }
    }
  }
`;

export default async function handler(req: VercelReq, res: VercelRes) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const cookies = parseCookies(req.headers.cookie as string | undefined);
  let accessToken = cookies[COOKIES.access];
  const refreshToken = cookies[COOKIES.refresh];

  if (!accessToken && !refreshToken) {
    res.status(401).json({ error: 'Not logged in' });
    return;
  }

  const firstRaw = req.query?.first;
  const first = clampInt(Array.isArray(firstRaw) ? firstRaw[0] : firstRaw, 10, 1, 50);

  let response = accessToken ? await graphql(accessToken, QUERY, { first }) : null;
  let setCookies: string[] = [];

  if ((!response || response.status === 401) && refreshToken) {
    try {
      const fresh = await callTokenEndpoint(
        new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: CUSTOMER_AUTH.clientId,
          refresh_token: refreshToken,
        }),
        CUSTOMER_AUTH.tokenUrl,
      );
      accessToken = fresh.access_token;
      setCookies = buildAuthCookies(fresh);
      response = await graphql(accessToken, QUERY, { first });
    } catch {
      res.setHeader('Set-Cookie', [
        clearCookie(COOKIES.access),
        clearCookie(COOKIES.refresh),
        clearCookie(COOKIES.session),
      ]);
      res.status(401).json({ error: 'Session expired' });
      return;
    }
  }

  if (!response || !response.ok) {
    const detail = response ? await response.text() : 'no response';
    console.error('[customer/orders] GraphQL failed', response?.status, detail);
    res.status(response?.status ?? 502).json({
      error: 'Customer Account API request failed',
      detail,
    });
    return;
  }

  const data = (await response.json()) as {
    data?: { customer?: { orders?: { edges: { node: unknown }[] } } };
    errors?: unknown;
  };
  if (data.errors) {
    console.error('[customer/orders] GraphQL errors', JSON.stringify(data.errors));
    res.status(502).json({ error: 'GraphQL error', detail: data.errors });
    return;
  }

  if (setCookies.length > 0) res.setHeader('Set-Cookie', setCookies);
  const orders = (data.data?.customer?.orders?.edges ?? []).map((e) => e.node);
  res.status(200).json(orders);
}

function graphql(accessToken: string, query: string, variables: Record<string, unknown>): Promise<Response> {
  return fetch(CUSTOMER_AUTH.graphqlUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Customer Account API expects the raw shcat_-prefixed token in
      // the Authorization header (no "Bearer " prefix).
      Authorization: accessToken,
    },
    body: JSON.stringify({ query, variables }),
  });
}

function clampInt(raw: string | undefined, def: number, min: number, max: number): number {
  const n = raw ? parseInt(raw, 10) : NaN;
  if (Number.isNaN(n)) return def;
  return Math.max(min, Math.min(max, n));
}
