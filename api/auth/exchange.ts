// POST /api/auth/exchange
//
// Completes the OAuth flow. The React app's AuthCallback page calls this
// endpoint with the code+state it received from Shopify. We verify state
// against the cookie set by /api/auth/start, exchange the code for tokens
// using the PKCE verifier, and store the tokens in HTTP-only cookies.
//
// Body: { code: string, state: string }
// Response: { returnTo: string } — where the React app should navigate next

import {
  CUSTOMER_AUTH,
  COOKIES,
  parseCookies,
  clearCookie,
  callTokenEndpoint,
  buildAuthCookies,
  type VercelReq,
  type VercelRes,
} from '../_auth-helpers';

interface Body {
  code?: string;
  state?: string;
}

export default async function handler(req: VercelReq, res: VercelRes) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const body = (typeof req.body === 'string' ? safeJson(req.body) : req.body) as Body;
  const code = body?.code;
  const state = body?.state;
  if (!code || !state) {
    res.status(400).json({ error: 'Missing code or state' });
    return;
  }

  const cookies = parseCookies(req.headers.cookie as string | undefined);
  const cookieState = cookies[COOKIES.state];
  const verifier = cookies[COOKIES.verifier];

  if (!cookieState || !verifier) {
    res.status(400).json({ error: 'Session expired — please retry the login.' });
    return;
  }
  if (cookieState !== state) {
    res.status(400).json({ error: 'State mismatch — possible CSRF.' });
    return;
  }

  // The full state was `<random>.<base64(returnTo)>` — decode the path.
  const returnTo = decodeReturnTo(state);

  const tokenBody = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: CUSTOMER_AUTH.clientId,
    redirect_uri: CUSTOMER_AUTH.redirectUri,
    code,
    code_verifier: verifier,
  });

  try {
    const token = await callTokenEndpoint(tokenBody, CUSTOMER_AUTH.tokenUrl);
    const cookieHeaders = [
      ...buildAuthCookies(token),
      clearCookie(COOKIES.verifier),
      clearCookie(COOKIES.state),
    ];
    res.setHeader('Set-Cookie', cookieHeaders);
    res.status(200).json({ returnTo });
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : 'Token exchange failed' });
  }
}

function safeJson(s: string): Body | null {
  try {
    return JSON.parse(s) as Body;
  } catch {
    return null;
  }
}

function decodeReturnTo(fullState: string): string {
  const dot = fullState.indexOf('.');
  if (dot === -1) return '/account';
  try {
    const decoded = Buffer.from(fullState.slice(dot + 1), 'base64url').toString('utf-8');
    if (decoded.startsWith('/') && !decoded.startsWith('//')) return decoded;
  } catch {
    // fall through
  }
  return '/account';
}
