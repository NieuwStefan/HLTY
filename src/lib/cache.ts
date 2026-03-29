const store = new Map<string, { data: unknown; expiresAt: number }>();

export const TTL = {
  PRODUCTS: 5 * 60 * 1000,
  MENU: 60 * 1000,
};

export function get<T>(key: string): T | null {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.data as T;
}

export function set(key: string, data: unknown, ttlMs: number): void {
  store.set(key, { data, expiresAt: Date.now() + ttlMs });
}
