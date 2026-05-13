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
} from '../_auth-helpers.js';

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
    // Diagnostic: log the token prefix so we can confirm whether Shopify
    // hands us an `atkn_`-prefixed token (which needs a second token-
    // exchange step to become an `shcat_` token) or already an `shcat_`.
    console.log(
      '[auth/exchange] tokens received:',
      `access=${maskPrefix(token.access_token)}`,
      `refresh=${maskPrefix(token.refresh_token)}`,
      `expires_in=${token.expires_in}`,
      `scope=${token.scope ?? ''}`,
      `token_type=${token.token_type}`,
    );

    // Attempt the Customer Account API token-exchange to get an
    // `shcat_`-prefixed access token if we don't already have one.
    let finalToken = token;
    if (!token.access_token.startsWith('shcat_')) {
      try {
        const exchangeBody = new URLSearchParams({
          grant_type: 'urn:ietf:params:oauth:grant-type:token-exchange',
          client_id: CUSTOMER_AUTH.clientId,
          audience: '30243aa5-17c1-465a-8493-944bcc4e88aa',
          subject_token: token.access_token,
          subject_token_type: 'urn:ietf:params:oauth:token-type:access_token',
          scopes: 'https://api.customers.com/auth/customer.graphql',
        });
        const exchanged = await callTokenEndpoint(exchangeBody, CUSTOMER_AUTH.tokenUrl);
        console.log('[auth/exchange] post-exchange:', `access=${maskPrefix(exchanged.access_token)}`);
        finalToken = { ...token, ...exchanged };
      } catch (e) {
        console.error('[auth/exchange] token-exchange step failed:', e instanceof Error ? e.message : e);
        // Continue with the original token; /api/customer/me will surface
        // a clear error if that token doesn't work either.
      }
    }

    const cookieHeaders = [
      ...buildAuthCookies(finalToken),
      clearCookie(COOKIES.verifier),
      clearCookie(COOKIES.state),
    ];
    res.setHeader('Set-Cookie', cookieHeaders);
    res.status(200).json({ returnTo });
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : 'Token exchange failed' });
  }
}

function maskPrefix(s: string | undefined): string {
  if (!s) return '<none>';
  const dot = s.indexOf('_');
  if (dot >= 0 && dot < 12) return `${s.slice(0, dot + 1)}...(len=${s.length})`;
  return `${s.slice(0, 8)}...(len=${s.length})`;
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
