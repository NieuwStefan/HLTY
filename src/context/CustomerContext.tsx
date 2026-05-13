import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { COOKIES, type SessionCookie } from '../lib/customer-auth-shared';
import { unbindStoredCart } from '../lib/cart-storage';

export interface CustomerAddress {
  id: string;
  firstName: string | null;
  lastName: string | null;
  company: string | null;
  address1: string | null;
  address2: string | null;
  city: string | null;
  zip: string | null;
  province: string | null;
  zoneCode: string | null;
  country: string | null;
  territoryCode: string | null;
  phoneNumber: string | null;
  formatted: string[];
}

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  displayName: string;
  emailAddress: { emailAddress: string } | null;
  phoneNumber: { phoneNumber: string } | null;
  defaultAddress: (Pick<
    CustomerAddress,
    'id' | 'address1' | 'address2' | 'city' | 'zip' | 'country' | 'formatted'
  >) | null;
  addresses: {
    edges: { node: CustomerAddress }[];
  };
}

interface CustomerContextType {
  // Lightweight session info from a non-HTTP-only cookie — available
  // instantly on every page load without a network call.
  session: SessionCookie | null;
  // Full customer profile from Customer Account API — loaded lazily.
  customer: Customer | null;
  isLoading: boolean;
  error: string | null;
  // Returns true if the user appears logged in (has a session cookie).
  isLoggedIn: boolean;
  // Triggers the OAuth redirect. `returnTo` is where to send the user
  // after successful login. Defaults to the current pathname.
  login: (returnTo?: string) => void;
  logout: () => Promise<void>;
  // Force-refresh the customer profile from the API.
  refresh: () => Promise<void>;
}

const CustomerContext = createContext<CustomerContextType | null>(null);

function readSessionCookie(): SessionCookie | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.split('; ').find((c) => c.startsWith(`${COOKIES.session}=`));
  if (!match) return null;
  try {
    const value = decodeURIComponent(match.slice(COOKIES.session.length + 1));
    // value is base64url(JSON)
    const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    return JSON.parse(atob(padded)) as SessionCookie;
  } catch {
    return null;
  }
}

export function CustomerProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SessionCookie | null>(() => readSessionCookie());
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Tracks whether we've already attempted to fetch the customer for the
  // current session. Prevents an infinite retry-loop when /api/customer/me
  // returns a non-401 error.
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);

  const isLoggedIn = session !== null;

  const fetchCustomer = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setHasAttemptedFetch(true);
    try {
      const res = await fetch('/api/customer/me', { credentials: 'same-origin' });
      if (res.status === 401) {
        setSession(null);
        setCustomer(null);
        return;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? `/api/customer/me returned ${res.status}`);
      }
      const data = (await res.json()) as Customer | null;
      setCustomer(data);
      setSession(readSessionCookie());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load customer');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Auto-load customer profile once when logged in. If it fails, the user
  // sees an error message instead of an infinite spinner — they can retry
  // by reloading.
  useEffect(() => {
    if (isLoggedIn && !customer && !isLoading && !hasAttemptedFetch) {
      void fetchCustomer();
    }
  }, [isLoggedIn, customer, isLoading, hasAttemptedFetch, fetchCustomer]);

  // Reset the attempt-tracker when the user logs out so a fresh login can refetch.
  useEffect(() => {
    if (!isLoggedIn) setHasAttemptedFetch(false);
  }, [isLoggedIn]);

  // Re-read session cookie on tab focus (handles login from another tab).
  useEffect(() => {
    const onFocus = () => setSession(readSessionCookie());
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  const login = useCallback((returnTo?: string) => {
    const target = returnTo ?? window.location.pathname + window.location.search;
    window.location.href = `/api/auth/start?return_to=${encodeURIComponent(target)}`;
  }, []);

  const logout = useCallback(async () => {
    // Drop Shopify's server-side customer-binding on the cart before
    // navigating away. Items stay (cart is re-created with same lines)
    // but the next visitor on this device won't see the previous user's
    // data on the Shopify checkout page.
    try {
      await unbindStoredCart();
    } catch {
      // Don't block logout on unbind failure — the auth cookies still
      // get cleared on the next request, which is the primary safety
      // mechanism.
    }
    window.location.href = '/api/auth/logout';
  }, []);

  const refresh = useCallback(async () => {
    setHasAttemptedFetch(false);
    await fetchCustomer();
  }, [fetchCustomer]);

  return (
    <CustomerContext.Provider
      value={{ session, customer, isLoading, error, isLoggedIn, login, logout, refresh }}
    >
      {children}
    </CustomerContext.Provider>
  );
}

export function useCustomer() {
  const ctx = useContext(CustomerContext);
  if (!ctx) throw new Error('useCustomer must be used within CustomerProvider');
  return ctx;
}
