import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';

const ACCOUNT_URL = 'https://inlog.hlty.shop';
const STORAGE_KEY = 'hlty-logged-in';

interface CustomerContextType {
  isLoggedIn: boolean;
  isLoading: boolean;
  popupOpen: boolean;
  openAccountPopup: () => void;
  openOrdersPopup: () => void;
  logout: () => void;
}

const CustomerContext = createContext<CustomerContextType | null>(null);

export function CustomerProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem(STORAGE_KEY) === 'true');
  const [isLoading, setIsLoading] = useState(false);
  const [popupOpen, setPopupOpen] = useState(false);
  const popupRef = useRef<Window | null>(null);
  const intervalRef = useRef<number | null>(null);

  const stopPolling = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setPopupOpen(false);
    popupRef.current = null;
  }, []);

  const startPolling = useCallback(() => {
    intervalRef.current = window.setInterval(() => {
      try {
        const closed = popupRef.current?.closed;
        if (closed) {
          stopPolling();
          // Small delay to let Shopify session settle
          setTimeout(() => {
            localStorage.setItem(STORAGE_KEY, 'true');
            setIsLoggedIn(true);
            setIsLoading(false);
          }, 500);
        }
      } catch {
        // Cross-origin error = popup still on Shopify domain — keep waiting
      }
    }, 800);
  }, [stopPolling]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current !== null) clearInterval(intervalRef.current);
    };
  }, []);

  // Window focus: sync from localStorage
  useEffect(() => {
    const onFocus = () => {
      const stored = localStorage.getItem(STORAGE_KEY) === 'true';
      setIsLoggedIn(stored);
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  const openAccountPopup = useCallback(() => {
    const w = 480;
    const h = 640;
    const left = Math.round((screen.width - w) / 2);
    const top = Math.round((screen.height - h) / 2);

    popupRef.current = window.open(
      ACCOUNT_URL,
      'hlty_account',
      `width=${w},height=${h},left=${left},top=${top}`
    );
    setPopupOpen(true);
    setIsLoading(true);
    startPolling();
  }, [startPolling]);

  const openOrdersPopup = useCallback(() => {
    const w = 480;
    const h = 640;
    const left = Math.round((screen.width - w) / 2);
    const top = Math.round((screen.height - h) / 2);

    window.open(
      `${ACCOUNT_URL}/account`,
      'hlty_account',
      `width=${w},height=${h},left=${left},top=${top}`
    );
  }, []);

  const logout = useCallback(() => {
    // Open logout URL in hidden iframe, then remove it
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = `${ACCOUNT_URL}/account/logout`;
    document.body.appendChild(iframe);
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 3000);

    setIsLoggedIn(false);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <CustomerContext.Provider
      value={{ isLoggedIn, isLoading, popupOpen, openAccountPopup, openOrdersPopup, logout }}
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
