// Helper: run a GraphQL query/mutation against the Customer Account API
// with automatic token-refresh on 401.
//
// Underscore-prefixed: not exposed as a Vercel route. Imported by the
// /api/customer/* handlers (me, profile, address, introspect).

import {
  CUSTOMER_AUTH,
  COOKIES,
  parseCookies,
  callTokenEndpoint,
  buildAuthCookies,
  clearCookie,
  type VercelReq,
  type VercelRes,
} from './_auth-helpers.js';

export interface UserError {
  field?: string[] | null;
  message: string;
  code?: string | null;
}

export interface CustomerGraphqlResult<T> {
  // The handler should return after this is called: status + body have
  // already been written.
  responded?: true;
  data?: T;
  userErrors?: UserError[];
}

// Runs a Customer Account API GraphQL request. Handles cookie reading,
// token refresh, and error responses uniformly.
//
// On any error path (not logged in, refresh failed, GraphQL transport
// error, GraphQL `errors` array) this function calls res.status().json()
// itself and returns { responded: true }. The handler MUST return early
// in that case.
//
// On success the function returns the raw `data` payload. The handler
// is responsible for extracting the relevant subfield and checking
// `userErrors` from the mutation result.
export async function runCustomerGraphql<T = unknown>(
  req: VercelReq,
  res: VercelRes,
  query: string,
  variables?: Record<string, unknown>,
): Promise<CustomerGraphqlResult<T>> {
  const cookies = parseCookies(req.headers.cookie as string | undefined);
  let accessToken = cookies[COOKIES.access];
  const refreshToken = cookies[COOKIES.refresh];

  if (!accessToken && !refreshToken) {
    res.status(401).json({ error: 'Not logged in' });
    return { responded: true };
  }

  let response = accessToken ? await callGraphql(accessToken, query, variables) : null;
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
      response = await callGraphql(accessToken, query, variables);
    } catch {
      res.setHeader('Set-Cookie', [
        clearCookie(COOKIES.access),
        clearCookie(COOKIES.refresh),
        clearCookie(COOKIES.session),
      ]);
      res.status(401).json({ error: 'Session expired' });
      return { responded: true };
    }
  }

  if (!response || !response.ok) {
    const detail = response ? await response.text() : 'no response';
    console.error('[customer-graphql] transport failed', response?.status, detail);
    if (setCookies.length > 0) res.setHeader('Set-Cookie', setCookies);
    res.status(response?.status ?? 502).json({
      error: 'Customer Account API request failed',
      detail,
    });
    return { responded: true };
  }

  const body = (await response.json()) as { data?: T; errors?: unknown };
  if (body.errors) {
    console.error('[customer-graphql] GraphQL errors', JSON.stringify(body.errors));
    if (setCookies.length > 0) res.setHeader('Set-Cookie', setCookies);
    res.status(502).json({ error: 'GraphQL error', detail: body.errors });
    return { responded: true };
  }

  // Refresh cookies need to land alongside the success response. The
  // handler will call res.json() after this — set them here so the header
  // is part of the final response.
  if (setCookies.length > 0) res.setHeader('Set-Cookie', setCookies);
  return { data: body.data };
}

function callGraphql(
  accessToken: string,
  query: string,
  variables?: Record<string, unknown>,
): Promise<Response> {
  return fetch(CUSTOMER_AUTH.graphqlUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: accessToken,
    },
    body: JSON.stringify(variables ? { query, variables } : { query }),
  });
}
