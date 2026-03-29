import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { formatPrice } from '../lib/shopify';

export default function CartDrawer() {
  const { cart, isOpen, closeCart, isLoading, updateItem, removeItem } = useCart();

  const lines = cart?.lines || [];
  const subtotal = cart?.cost?.subtotalAmount;

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
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-primary)]">
                            {line.merchandise.product.title.split(' | ')[0]?.slice(0, 30)}
                          </p>
                          <h4 className="text-sm font-semibold text-[var(--color-navy)] truncate mt-0.5">
                            {line.merchandise.product.title}
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
                  href={cart?.checkoutUrl || '#'}
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
