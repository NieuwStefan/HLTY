import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useCustomer } from '../context/CustomerContext';
import { formatPrice } from '../lib/shopify';
import { formatProductTitle } from '../lib/product-title';
import { trackBeginCheckout } from '../lib/analytics';

// Appends customer-data query params to the Shopify checkout URL so that
// e-mail and shipping fields are pre-filled when the buyer arrives. This
// is a workaround because the Customer Account API access token (shcat_)
// is not yet accepted by Storefront API's cart.buyerIdentity field
// (see github.com/Shopify/hydrogen/issues/2495).
function buildPrefilledCheckoutUrl(
  baseUrl: string,
  customer: ReturnType<typeof useCustomer>['customer'],
): string {
  if (!customer) return baseUrl;
  const url = new URL(baseUrl);
  const set = (k: string, v: string | null | undefined) => {
    if (v) url.searchParams.set(k, v);
  };
  set('checkout[email]', customer.emailAddress?.emailAddress);
  set('checkout[shipping_address][first_name]', customer.firstName);
  set('checkout[shipping_address][last_name]', customer.lastName);
  set('checkout[shipping_address][phone]', customer.phoneNumber?.phoneNumber);
  const addr = customer.defaultAddress;
  if (addr) {
    set('checkout[shipping_address][address1]', addr.address1);
    set('checkout[shipping_address][address2]', addr.address2);
    set('checkout[shipping_address][city]', addr.city);
    set('checkout[shipping_address][zip]', addr.zip);
    set('checkout[shipping_address][country]', addr.country);
  }
  return url.toString();
}

export default function CartDrawer() {
  const { cart, isOpen, closeCart, isLoading, updateItem, removeItem } = useCart();
  const { customer } = useCustomer();

  const lines = cart?.lines || [];
  const subtotal = cart?.cost?.subtotalAmount;
  const checkoutHref = cart?.checkoutUrl
    ? buildPrefilledCheckoutUrl(cart.checkoutUrl, customer)
    : '#';

  // Analytics — begin_checkout vlak vóór de navigatie naar Shopify-checkout.
  // (Het purchase-event valt buiten de SPA en wordt Shopify-zijdig getrackt.)
  const handleCheckoutClick = () => {
    if (!cart || lines.length === 0) return;
    const amount = cart.cost?.totalAmount ?? cart.cost?.subtotalAmount;
    trackBeginCheckout(
      amount ? parseFloat(amount.amount) : 0,
      lines.map((l) => ({
        id: l.merchandise.id,
        name: l.merchandise.product.title,
        brand: l.merchandise.product.vendor,
        price: parseFloat(l.merchandise.price.amount),
        quantity: l.quantity,
      })),
      amount?.currencyCode,
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-sm"
            onClick={closeCart}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 z-[80] w-full max-w-md bg-white/95 backdrop-blur-xl shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-[var(--color-border)]">
              <div className="flex items-center gap-3">
                <ShoppingBag className="w-5 h-5 text-[var(--color-primary)]" />
                <h2 className="text-lg font-bold text-[var(--color-navy)]" style={{ fontFamily: 'Montserrat' }}>
                  Winkelwagen
                </h2>
                {lines.length > 0 && (
                  <span className="px-2.5 py-0.5 bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-xs font-bold rounded-full">
                    {cart?.totalQuantity}
                  </span>
                )}
              </div>
              <button
                onClick={closeCart}
                className="p-2 rounded-full hover:bg-black/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-6">
              {lines.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <ShoppingBag className="w-16 h-16 text-[var(--color-muted)]/30 mb-4" />
                  <p className="text-lg font-semibold text-[var(--color-navy)] mb-2">
                    Je winkelwagen is leeg
                  </p>
                  <p className="text-sm text-[var(--color-muted)]">
                    Voeg producten toe om te beginnen
                  </p>
                  <button
                    onClick={closeCart}
                    className="mt-6 btn-primary px-6 py-3 text-sm"
                  >
                    Verder winkelen
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {lines.map((line) => {
                    const image = line.merchandise.image;
                    return (
                      <motion.div
                        key={line.id}
                        layout
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="flex gap-4 p-3 rounded-2xl bg-[var(--color-surface)] transition-colors"
                      >
                        {/* Image */}
                        <div className="w-20 h-20 rounded-xl bg-white flex-shrink-0 overflow-hidden">
                          {image && (
                            <img
                              src={image.url}
                              alt={image.altText || ''}
                              className="w-full h-full object-contain p-1"
                            />
                          )}
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          {line.merchandise.product.vendor && (
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-primary)]">
                              {line.merchandise.product.vendor}
                            </p>
                          )}
                          <h4 className="text-sm font-semibold text-[var(--color-navy)] line-clamp-2 mt-0.5">
                            {formatProductTitle(line.merchandise.product.title, line.merchandise.product.vendor)}
                          </h4>
                          <p className="text-sm font-bold text-[var(--color-navy)] mt-1">
                            {formatPrice(line.cost.totalAmount)}
                          </p>

                          {/* Quantity Controls */}
                          <div className="flex items-center gap-2 mt-2">
                            <button
                              onClick={() =>
                                line.quantity === 1
                                  ? removeItem(line.id)
                                  : updateItem(line.id, line.quantity - 1)
                              }
                              disabled={isLoading}
                              className="w-7 h-7 rounded-full bg-white border border-[var(--color-border)] flex items-center justify-center hover:bg-black/5 transition-colors disabled:opacity-50"
                            >
                              {line.quantity === 1 ? (
                                <Trash2 className="w-3 h-3 text-red-500" />
                              ) : (
                                <Minus className="w-3 h-3" />
                              )}
                            </button>
                            <span className="text-sm font-semibold w-6 text-center">
                              {line.quantity}
                            </span>
                            <button
                              onClick={() => updateItem(line.id, line.quantity + 1)}
                              disabled={isLoading}
                              className="w-7 h-7 rounded-full bg-white border border-[var(--color-border)] flex items-center justify-center hover:bg-black/5 transition-colors disabled:opacity-50"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {lines.length > 0 && (
              <div className="p-6 border-t border-[var(--color-border)] space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--color-muted)]">Subtotaal</span>
                  <span className="text-lg font-bold text-[var(--color-navy)]">
                    {subtotal ? formatPrice(subtotal) : '—'}
                  </span>
                </div>
                <p className="text-xs text-[var(--color-muted)]">
                  Verzendkosten worden berekend bij het afrekenen.
                </p>
                <a
                  href={checkoutHref}
                  onClick={handleCheckoutClick}
                  className="btn-primary w-full py-4 text-sm gap-2"
                >
                  Afrekenen
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
