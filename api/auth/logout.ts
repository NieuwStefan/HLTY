// GET /api/auth/logout
//
// Wipes the auth cookies and redirects the browser to Shopify's logout
// endpoint, which in turn redirects back to postLogoutUri once the
// Shopify session is gone.

import { CUSTOMER_AUTH, COOKIES } from '../../src/lib/customer-auth-shared';
import {
  clearCookie,
  parseCookies,
  type VercelReq,
  type VercelRes,
} from '../_auth-helpers';

export default function handler(req: VercelReq, res: VercelRes) {
  if (req.method !== 'GET') {
    res.status(405).send('Method not allowed');
    return;
  }

  const cookies = parseCookies(req.headers.cookie as string | undefined);
  const idToken = cookies[COOKIES.access]; // not the id_token but close enough — Shopify accepts the access token here too

  res.setHeader('Set-Cookie', [
    clearCookie(COOKIES.access),
    clearCookie(COOKIES.refresh),
    clearCookie(COOKIES.session),
    clearCookie(COOKIES.verifier),
    clearCookie(COOKIES.state),
  ]);

  // Build Shopify logout URL with post_logout_redirect_uri.
  const logoutUrl = new URL(CUSTOMER_AUTH.logoutUrl);
  if (idToken) {
    logoutUrl.searchParams.set('id_token_hint', idToken);
  }
  logoutUrl.searchParams.set('post_logout_redirect_uri', CUSTOMER_AUTH.postLogoutUri);

  res.setHeader('Location', logoutUrl.toString());
  res.status(302).end();
}
