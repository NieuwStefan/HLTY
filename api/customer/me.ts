// GET /api/customer/me
//
// Returns the logged-in customer's profile (name, email, phone,
// default address) by querying the Customer Account API GraphQL endpoint.
//
// Auto-refreshes the access token on 401. Returns 401 to the client if
// not logged in.

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
  query Me {
    customer {
      id
      firstName
      lastName
      displayName
      emailAddress { emailAddress }
      phoneNumber { phoneNumber }
      defaultAddress {
        address1
        address2
        city
        zip
        country
        countryCodeV2
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

  // Try with the current access token first. If it's expired or missing,
  // attempt one refresh and retry.
  let response = accessToken ? await callGraphql(accessToken, QUERY) : null;
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
      response = await callGraphql(accessToken, QUERY);
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
    console.error('[customer/me] GraphQL failed', response?.status, detail);
    res.status(response?.status ?? 502).json({
      error: 'Customer Account API request failed',
      detail,
    });
    return;
  }

  const data = (await response.json()) as { data?: { customer?: unknown }; errors?: unknown };
  if (data.errors) {
    console.error('[customer/me] GraphQL errors', JSON.stringify(data.errors));
    res.status(502).json({ error: 'GraphQL error', detail: data.errors });
    return;
  }

  if (setCookies.length > 0) res.setHeader('Set-Cookie', setCookies);
  res.status(200).json(data.data?.customer ?? null);
}

function callGraphql(accessToken: string, query: string): Promise<Response> {
  return fetch(CUSTOMER_AUTH.graphqlUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ query }),
  });
}
