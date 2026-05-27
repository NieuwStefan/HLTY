import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import {
  type Cart,
  createCart,
  addToCart as addToCartApi,
  updateCartLine as updateCartLineApi,
  removeCartLine as removeCartLineApi,
  getCart,
  recreateCart,
  cartHasCustomerBinding,
} from '../lib/shopify';
import { CART_ID_KEY } from '../lib/cart-storage';
import { COOKIES } from '../lib/customer-auth-shared';
import { trackAddToCart } from '../lib/analytics';

interface CartContextType {
  cart: Cart | null;
  isOpen: boolean;
  isLoading: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (variantId: string, quantity?: number) => Promise<void>;
  updateItem: (lineId: string, quantity: number) => Promise<void>;
  removeItem: (lineId: string) => Promise<void>;
}

const CartContext = createContext<CartContextType | null>(null);

function hasSessionCookie(): boolean {
  if (typeof document === 'undefined') return false;
  return document.cookie.split('; ').some((c) => c.startsWith(`${COOKIES.session}=`));
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Restore cart from localStorage on mount. If the visitor is not
  // logged in but the stored cart still carries a customer-binding from
  // an earlier session, re-create the cart to drop that binding before
  // exposing it to this anonymous view (prevents checkout pre-fill of
  // the previous buyer's data — see docs/05).
  useEffect(() => {
    const cartId = localStorage.getItem(CART_ID_KEY);
    if (!cartId) return;
    let cancelled = false;

    (async () => {
      try {
        const existing = await getCart(cartId);
        if (cancelled) return;

        if (!existing || existing.lines.length === 0) {
          localStorage.removeItem(CART_ID_KEY);
          return;
        }

        if (!hasSessionCookie() && cartHasCustomerBinding(existing)) {
          const unbound = await recreateCart(cartId);
          if (cancelled) return;
          if (unbound) {
            localStorage.setItem(CART_ID_KEY, unbound.id);
            setCart(unbound);
          } else {
            localStorage.removeItem(CART_ID_KEY);
          }
          return;
        }

        setCart(existing);
      } catch {
        if (!cancelled) localStorage.removeItem(CART_ID_KEY);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const saveCart = useCallback((newCart: Cart) => {
    setCart(newCart);
    localStorage.setItem(CART_ID_KEY, newCart.id);
  }, []);

  const addItem = useCallback(async (variantId: string, quantity = 1) => {
    setIsLoading(true);
    try {
      let newCart: Cart;
      if (cart) {
        newCart = await addToCartApi(cart.id, variantId, quantity);
      } else {
        newCart = await createCart(variantId, quantity);
      }
      saveCart(newCart);
      setIsOpen(true);

      // Analytics — add_to_cart (no-op zonder consent, zie lib/analytics.ts).
      const line = newCart.lines.find((l) => l.merchandise.id === variantId);
      if (line) {
        trackAddToCart(
          {
            id: line.merchandise.id,
            name: line.merchandise.product.title,
            brand: line.merchandise.product.vendor,
            price: parseFloat(line.merchandise.price.amount),
            quantity,
          },
          line.merchandise.price.currencyCode,
        );
      }
    } finally {
      setIsLoading(false);
    }
  }, [cart, saveCart]);

  const updateItem = useCallback(async (lineId: string, quantity: number) => {
    if (!cart) return;
    setIsLoading(true);
    try {
      const newCart = await updateCartLineApi(cart.id, lineId, quantity);
      saveCart(newCart);
    } finally {
      setIsLoading(false);
    }
  }, [cart, saveCart]);

  const removeItem = useCallback(async (lineId: string) => {
    if (!cart) return;
    setIsLoading(true);
    try {
      const newCart = await removeCartLineApi(cart.id, lineId);
      saveCart(newCart);
    } finally {
      setIsLoading(false);
    }
  }, [cart, saveCart]);

  return (
    <CartContext.Provider
      value={{
        cart,
        isOpen,
        isLoading,
        openCart: () => setIsOpen(true),
        closeCart: () => setIsOpen(false),
        addItem,
        updateItem,
        removeItem,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
