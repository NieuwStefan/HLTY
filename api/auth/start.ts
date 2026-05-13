// GET /api/auth/start
//
// Initiates the Customer Account API OAuth flow. Generates PKCE verifier,
// stores it server-side in a short-lived HTTP-only cookie, then redirects
// the browser to Shopify's hosted login page.
//
// Query params:
//   return_to: optional path on www.hlty.shop to send the user to after
//              login completes. Defaults to "/account".

import {
  CUSTOMER_AUTH,
  COOKIES,
  generateVerifier,
  generateState,
  challengeFor,
  serializeCookie,
  type VercelReq,
  type VercelRes,
} from '../_auth-helpers';

export default function handler(req: VercelReq, res: VercelRes) {
  if (req.method !== 'GET') {
    res.status(405).send('Method not allowed');
    return;
  }

  const verifier = generateVerifier();
  const challenge = challengeFor(verifier);
  const state = generateState();

  const returnTo = sanitizeReturnTo(req.query?.return_to);
  // Bundle the post-login destination into the state cookie so we can
  // restore it after the callback. Format: `<random>.<base64(returnTo)>`
  const fullState = `${state}.${Buffer.from(returnTo).toString('base64url')}`;

  const cookies = [
    serializeCookie(COOKIES.verifier, verifier, { maxAge: 600, httpOnly: true }),
    serializeCookie(COOKIES.state, fullState, { maxAge: 600, httpOnly: true }),
  ];

  const authorizeUrl = new URL(CUSTOMER_AUTH.authorizeUrl);
  authorizeUrl.searchParams.set('client_id', CUSTOMER_AUTH.clientId);
  authorizeUrl.searchParams.set('response_type', 'code');
  authorizeUrl.searchParams.set('scope', CUSTOMER_AUTH.scope);
  authorizeUrl.searchParams.set('redirect_uri', CUSTOMER_AUTH.redirectUri);
  authorizeUrl.searchParams.set('state', fullState);
  authorizeUrl.searchParams.set('code_challenge', challenge);
  authorizeUrl.searchParams.set('code_challenge_method', 'S256');

  res.setHeader('Set-Cookie', cookies);
  res.setHeader('Location', authorizeUrl.toString());
  res.status(302).end();
}

function sanitizeReturnTo(input: string | string[] | undefined): string {
  const raw = Array.isArray(input) ? input[0] : input;
  if (!raw) return '/account';
  // Only allow relative paths on our own site. Anything starting with //
  // or http:// would be an open-redirect vector.
  if (!raw.startsWith('/') || raw.startsWith('//')) return '/account';
  return raw;
}
