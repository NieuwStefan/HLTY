// Constants and helpers shared between the React app and the Vercel API
// routes for the Shopify Customer Account API OAuth flow.
//
// Nothing in this file is a secret: the client_id is the public OAuth
// public-client identifier, the endpoints are documented Shopify URLs.

export const CUSTOMER_AUTH = {
  clientId: 'e95f30c7-5193-4188-84a9-7328be328ec4',
  authorizeUrl: 'https://inlog.hlty.shop/authentication/oauth/authorize',
  tokenUrl: 'https://inlog.hlty.shop/authentication/oauth/token',
  logoutUrl: 'https://inlog.hlty.shop/authentication/logout',
  graphqlUrl: 'https://inlog.hlty.shop/customer/api/2026-04/graphql',
  scope: 'openid email customer-account-api:full',
  // Where Shopify sends the browser back after sign-in. Must match an
  // exact callback URI configured in the Shopify Headless app.
  redirectUri: 'https://www.hlty.shop/auth/callback',
  // Where the user lands after signing out.
  postLogoutUri: 'https://www.hlty.shop/',
} as const;

// Cookie names. Kept short and namespaced.
export const COOKIES = {
  // Short-lived (10 min) — only present during the OAuth round-trip.
  verifier: 'hlty_pkce_verifier',
  state: 'hlty_pkce_state',
  // Long-lived auth cookies.
  access: 'hlty_access',
  refresh: 'hlty_refresh',
  // Convenience cookie (non-HTTP-only) so the React app can render the
  // logged-in state without making a network request. Holds nothing
  // sensitive — just a flag and the customer's first name.
  session: 'hlty_session',
} as const;

export interface SessionCookie {
  firstName: string;
  // Unix timestamp (seconds) at which the access token expires. Used by
  // the client to decide if it should refresh proactively.
  expiresAt: number;
}
