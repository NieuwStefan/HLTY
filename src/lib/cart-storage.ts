// LocalStorage helpers voor de Shopify-cart-id.
//
// Bestaat als losse module zodat zowel CartContext (React state) als
// CustomerContext.logout (geen toegang tot useCart, want CustomerProvider
// is een grandparent van CartProvider) de cart kunnen ontkoppelen.
//
// Achtergrond: Shopify bindt een cart server-side aan een klant-account
// zodra de buyer voor het eerst op de checkout-page komt terwijl
// ingelogd. Die binding overleeft een gewone logout en zorgt ervoor dat
// de checkout van die cart de oorspronkelijke koper toont — een
// privacy-lek voor iedereen die daarna dezelfde cart-id laadt.

import { recreateCart } from './shopify';

export const CART_ID_KEY = 'hlty-cart-id';

// Ontkoppelt de cart in localStorage van een eventuele customer-binding.
// Concreet: maakt een nieuwe cart aan met dezelfde line items en schrijft
// die nieuwe cart-id terug. Items blijven dus behouden voor de gebruiker.
//
// No-op als er geen cart-id in localStorage staat. Bij API-fouten wordt
// de cart-id verwijderd — beter een lege cart dan een gebonden cart.
export async function unbindStoredCart(): Promise<void> {
  if (typeof localStorage === 'undefined') return;
  const cartId = localStorage.getItem(CART_ID_KEY);
  if (!cartId) return;
  try {
    const newCart = await recreateCart(cartId);
    if (newCart) {
      localStorage.setItem(CART_ID_KEY, newCart.id);
    } else {
      localStorage.removeItem(CART_ID_KEY);
    }
  } catch {
    localStorage.removeItem(CART_ID_KEY);
  }
}
