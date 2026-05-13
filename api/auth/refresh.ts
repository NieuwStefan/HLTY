// POST /api/auth/refresh
//
// Uses the refresh-token cookie to get a fresh access token. Called by
// the React app when it knows the access token is near expiry, and
// internally by other api/ routes when they get a 401 from Shopify.
//
// Response: { ok: true } if refreshed, 401 if no refresh token or
// Shopify rejected it (caller should redirect to /api/auth/start).

import {
  CUSTOMER_AUTH,
  COOKIES,
  parseCookies,
  callTokenEndpoint,
  buildAuthCookies,
  clearCookie,
  type VercelReq,
  type VercelRes,
} from '../_auth-helpers';

export default async function handler(req: VercelReq, res: VercelRes) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const cookies = parseCookies(req.headers.cookie as string | undefined);
  const refresh = cookies[COOKIES.refresh];
  if (!refresh) {
    res.status(401).json({ error: 'No refresh token' });
    return;
  }

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: CUSTOMER_AUTH.clientId,
    refresh_token: refresh,
  });

  try {
    const token = await callTokenEndpoint(body, CUSTOMER_AUTH.tokenUrl);
    res.setHeader('Set-Cookie', buildAuthCookies(token));
    res.status(200).json({ ok: true });
  } catch {
    // Refresh failed — clear cookies so the client starts fresh.
    res.setHeader('Set-Cookie', [
      clearCookie(COOKIES.access),
      clearCookie(COOKIES.refresh),
      clearCookie(COOKIES.session),
    ]);
    res.status(401).json({ error: 'Refresh failed' });
  }
}
