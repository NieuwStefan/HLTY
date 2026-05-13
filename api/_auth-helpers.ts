// Server-side helpers for the Customer Account API auth flow.
//
// Underscore-prefixed filenames in api/ are not exposed as Vercel routes,
// so this file is safe to import from other api/ handlers.

import crypto from 'node:crypto';
import { COOKIES, type SessionCookie } from '../src/lib/customer-auth-shared';

// ---------- PKCE ----------

function base64Url(buf: Buffer): string {
  return buf
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export function generateVerifier(): string {
  return base64Url(crypto.randomBytes(32));
}

export function challengeFor(verifier: string): string {
  return base64Url(crypto.createHash('sha256').update(verifier).digest());
}

export function generateState(): string {
  return base64Url(crypto.randomBytes(16));
}

// ---------- Cookies ----------

export function parseCookies(header: string | undefined | null): Record<string, string> {
  if (!header) return {};
  const result: Record<string, string> = {};
  for (const part of header.split(';')) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    const name = part.slice(0, eq).trim();
    const value = part.slice(eq + 1).trim();
    if (name) result[name] = decodeURIComponent(value);
  }
  return result;
}

interface CookieOptions {
  maxAge?: number;
  httpOnly?: boolean;
  path?: string;
}

export function serializeCookie(name: string, value: string, opts: CookieOptions = {}): string {
  const parts = [`${name}=${encodeURIComponent(value)}`];
  parts.push(`Path=${opts.path ?? '/'}`);
  parts.push('Secure');
  parts.push('SameSite=Lax');
  if (opts.httpOnly !== false) parts.push('HttpOnly');
  if (opts.maxAge !== undefined) parts.push(`Max-Age=${opts.maxAge}`);
  return parts.join('; ');
}

export function clearCookie(name: string): string {
  return serializeCookie(name, '', { maxAge: 0 });
}

// ---------- Session helpers ----------

export function encodeSession(s: SessionCookie): string {
  // Tiny payload; just base64-encoded JSON. Not signed because it's
  // purely advisory — the real auth is in the HTTP-only access cookie.
  return base64Url(Buffer.from(JSON.stringify(s)));
}

// ---------- Minimal Vercel handler types ----------

export interface VercelReq {
  method?: string;
  url?: string;
  headers: Record<string, string | string[] | undefined>;
  query?: Record<string, string | string[]>;
  body?: unknown;
}

export interface VercelRes {
  status: (code: number) => VercelRes;
  setHeader: (name: string, value: string | string[]) => VercelRes;
  json: (body: unknown) => void;
  send: (body?: string) => void;
  end: (body?: string) => void;
}

// ---------- Token endpoint client ----------

export interface TokenResponse {
  access_token: string;
  expires_in: number;
  id_token?: string;
  refresh_token?: string;
  scope?: string;
  token_type: string;
}

export async function callTokenEndpoint(body: URLSearchParams, tokenUrl: string): Promise<TokenResponse> {
  const res = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token endpoint returned ${res.status}: ${text}`);
  }
  return res.json() as Promise<TokenResponse>;
}

// Builds the Set-Cookie header values for a fresh token response.
// id_token (a JWT) is decoded just to extract the customer's first name
// for the convenience session cookie. We don't validate it here because
// the server got it directly from Shopify over TLS — trust is fine.
export function buildAuthCookies(token: TokenResponse): string[] {
  const headers: string[] = [];
  headers.push(
    serializeCookie(COOKIES.access, token.access_token, {
      maxAge: token.expires_in,
      httpOnly: true,
    }),
  );
  if (token.refresh_token) {
    headers.push(
      serializeCookie(COOKIES.refresh, token.refresh_token, {
        // Refresh tokens are valid for ~24h on Shopify Customer Account API;
        // we keep the cookie for a week so it survives across visits but
        // older tokens will fail and trigger a re-login (acceptable).
        maxAge: 60 * 60 * 24 * 7,
        httpOnly: true,
      }),
    );
  }
  const firstName = extractFirstName(token.id_token);
  const session: SessionCookie = {
    firstName,
    expiresAt: Math.floor(Date.now() / 1000) + token.expires_in,
  };
  headers.push(
    serializeCookie(COOKIES.session, encodeSession(session), {
      maxAge: 60 * 60 * 24 * 7,
      httpOnly: false, // readable by the React app
    }),
  );
  return headers;
}

function extractFirstName(idToken: string | undefined): string {
  if (!idToken) return '';
  try {
    const payload = idToken.split('.')[1];
    if (!payload) return '';
    const decoded = Buffer.from(
      payload.replace(/-/g, '+').replace(/_/g, '/'),
      'base64',
    ).toString('utf-8');
    const json = JSON.parse(decoded) as Record<string, unknown>;
    const given = typeof json.given_name === 'string' ? json.given_name : '';
    const name = typeof json.name === 'string' ? json.name : '';
    return given || (name ? name.split(' ')[0] : '');
  } catch {
    return '';
  }
}
