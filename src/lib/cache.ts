// Two-tier cache: in-memory (per-tab, instant) + optional localStorage (per-origin,
// survives reload). Heavy reads like the full catalog and category-memberships are
// opt-in persisted so a first paint after refresh isn't blocked on Shopify, and
// the UI has a stale-but-usable fallback if Shopify's Storefront API flakes.

const store = new Map<string, { data: unknown; expiresAt: number }>();

export const TTL = {
  PRODUCTS: 5 * 60 * 1000,
  MENU: 60 * 1000,
};

// Keys whose data should additionally survive a page reload. Keep this list
// short — large blobs cost localStorage quota (~5 MB per origin).
const PERSIST_KEYS = new Set<string>(['all-products', 'category-memberships']);
const LS_PREFIX = 'hlty.cache.';
// Persisted entries can survive longer than the in-memory TTL: they only act
// as a fallback when the network can't refresh them. Foreground freshness is
// still governed by the per-call TTL.
const PERSIST_TTL_MS = 24 * 60 * 60 * 1000; // 24h

function hasLocalStorage(): boolean {
  try {
    return typeof localStorage !== 'undefined';
  } catch {
    return false;
  }
}

function readPersisted<T>(key: string): { data: T; expiresAt: number } | null {
  if (!PERSIST_KEYS.has(key) || !hasLocalStorage()) return null;
  try {
    const raw = localStorage.getItem(LS_PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { data: T; expiresAt: number };
    if (typeof parsed?.expiresAt !== 'number') return null;
    return parsed;
  } catch {
    return null;
  }
}

function writePersisted(key: string, data: unknown, ttlMs: number): void {
  if (!PERSIST_KEYS.has(key) || !hasLocalStorage()) return;
  try {
    const payload = JSON.stringify({ data, expiresAt: Date.now() + Math.max(ttlMs, PERSIST_TTL_MS) });
    localStorage.setItem(LS_PREFIX + key, payload);
  } catch {
    // QuotaExceededError or serialization issue — best-effort cache, drop silently.
  }
}

export function get<T>(key: string): T | null {
  const entry = store.get(key);
  if (entry) {
    if (Date.now() < entry.expiresAt) return entry.data as T;
    store.delete(key);
  }
  // Fall through to localStorage. Stale persisted entries are ignored here;
  // use getStale() to access them explicitly as a fallback.
  const persisted = readPersisted<T>(key);
  if (persisted && Date.now() < persisted.expiresAt) {
    store.set(key, { data: persisted.data, expiresAt: persisted.expiresAt });
    return persisted.data;
  }
  return null;
}

/**
 * Like `get`, but also returns a persisted entry whose TTL has expired —
 * useful as a UI fallback while a fresh fetch is still in flight or has
 * failed. Caller learns via `fresh` whether the data is current.
 */
export function getStale<T>(key: string): { data: T; fresh: boolean } | null {
  const fresh = get<T>(key);
  if (fresh !== null) return { data: fresh, fresh: true };
  const persisted = readPersisted<T>(key);
  if (persisted) return { data: persisted.data, fresh: false };
  return null;
}

export function set(key: string, data: unknown, ttlMs: number): void {
  store.set(key, { data, expiresAt: Date.now() + ttlMs });
  writePersisted(key, data, ttlMs);
}
