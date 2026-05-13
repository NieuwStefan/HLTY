// GET /api/auth/logout
//
// Wipes the auth cookies and redirects the browser to Shopify's logout
// endpoint, which in turn redirects back to postLogoutUri once the
// Shopify session is gone.

import {
  CUSTOMER_AUTH,
  COOKIES,
  clearCookie,
  parseCookies,
  type VercelReq,
  type VercelRes,
} from '../_auth-helpers.js';

export default function handler(req: VercelReq, res: VercelRes) {
  if (req.method !== 'GET') {
    res.status(405).send('Method not allowed');
    return;
  }

  const cookies = parseCookies(req.headers.cookie as string | undefined);
  // Shopify's OIDC logout endpoint requires a real id_token (JWT) as
  // `id_token_hint`. The shcat_ access token does NOT work and returns
  // "Ongeldige id_token", which leaves the customer-account session
  // active on the checkout subdomain.
  const idToken = cookies[COOKIES.id];

  res.setHeader('Set-Cookie', [
    clearCookie(COOKIES.access),
    clearCookie(COOKIES.refresh),
    clearCookie(COOKIES.session),
    clearCookie(COOKIES.verifier),
    clearCookie(COOKIES.state),
    clearCookie(COOKIES.id),
  ]);

  const logoutUrl = new URL(CUSTOMER_AUTH.logoutUrl);
  if (idToken) {
    logoutUrl.searchParams.set('id_token_hint', idToken);
  }
  logoutUrl.searchParams.set('post_logout_redirect_uri', CUSTOMER_AUTH.postLogoutUri);

  res.setHeader('Location', logoutUrl.toString());
  res.status(302).end();
}
