import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import {
  type Cart,
  createCart,
  addToCart as addToCartApi,
  updateCartLine as updateCartLineApi,
  removeCartLine as removeCartLineApi,
  getCart,
} from '../lib/shopify';

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

const CART_ID_KEY = 'hlty-cart-id';

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Restore cart from localStorage on mount
  useEffect(() => {
    const cartId = localStorage.getItem(CART_ID_KEY);
    if (cartId) {
      getCart(cartId).then((existingCart) => {
        if (existingCart && existingCart.lines.length > 0) {
          setCart(existingCart);
        } else {
          localStorage.removeItem(CART_ID_KEY);
        }
      }).catch(() => {
        localStorage.removeItem(CART_ID_KEY);
      });
    }
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
