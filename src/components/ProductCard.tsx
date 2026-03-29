import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingBag } from 'lucide-react';
import { type Product, formatPrice } from '../lib/shopify';
import { useCart } from '../context/CartContext';

interface Props {
  product: Product;
  index?: number;
}

export default function ProductCard({ product, index = 0 }: Props) {
  const { addItem, isLoading } = useCart();
  const image = product.images[0];
  const variant = product.variants[0];
  const price = product.priceRange.minVariantPrice;
  const available = variant?.availableForSale ?? false;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (variant && available) {
      await addItem(variant.id);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
    >
      <Link to={`/product/${product.handle}`} className="block group">
        <div className="card p-0">
          {/* Image */}
          <div className="relative aspect-square bg-white/50 overflow-hidden">
            {image ? (
              <img
                src={image.url}
                alt={image.altText || product.title}
                className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[var(--color-muted)]">
                <ShoppingBag className="w-12 h-12 opacity-20" />
              </div>
            )}

            {/* Quick add button */}
            {available && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleAddToCart}
                disabled={isLoading}
                className="absolute bottom-3 right-3 w-10 h-10 bg-[var(--color-primary)] text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              >
                <ShoppingBag className="w-4 h-4" />
              </motion.button>
            )}

            {!available && (
              <div className="absolute top-3 left-3 px-3 py-1 bg-black/60 text-white text-[11px] font-semibold uppercase tracking-wider rounded-full">
                Uitverkocht
              </div>
            )}
          </div>

          {/* Info */}
          <div className="p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-primary)] mb-1.5">
              {product.vendor}
            </p>
            <h3 className="text-sm font-semibold text-[var(--color-navy)] leading-snug line-clamp-2 min-h-[2.5rem]">
              {product.title}
            </h3>
            <p className="mt-2 text-base font-bold text-[var(--color-navy)]">
              {formatPrice(price)}
            </p>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
