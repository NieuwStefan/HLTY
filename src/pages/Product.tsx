import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Check, ChevronLeft, Truck, Shield, RefreshCw } from 'lucide-react';
import {
  getProduct,
  getProductRecommendations,
  type Product as ProductType,
  type ProductVariant,
  formatPrice,
} from '../lib/shopify';
import { useCart } from '../context/CartContext';
import ProductCard from '../components/ProductCard';

export default function Product() {
  const { handle } = useParams<{ handle: string }>();
  const { addItem, isLoading } = useCart();
  const [product, setProduct] = useState<ProductType | null>(null);
  const [recommendations, setRecommendations] = useState<ProductType[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!handle) return;
    setLoading(true);
    setAdded(false);
    setSelectedImage(0);

    getProduct(handle)
      .then((p) => {
        setProduct(p);
        setSelectedVariant(p.variants[0] || null);
        // Load recommendations
        getProductRecommendations(p.id)
          .then(setRecommendations)
          .catch(() => {});
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [handle]);

  const handleAddToCart = async () => {
    if (!selectedVariant || !selectedVariant.availableForSale) return;
    await addItem(selectedVariant.id);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-[1400px] px-4 space-y-16">
        <div className="flex items-center gap-2">
          <div className="h-[20px] bg-black/5 rounded-full w-12 animate-pulse" />
          <span className="text-[var(--color-muted)]">/</span>
          <div className="h-[20px] bg-black/5 rounded-full w-40 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 animate-pulse">
          <div className="space-y-4">
            <div className="card p-0 aspect-square bg-black/5" />
          </div>
          <div className="py-2 space-y-4">
            <div className="h-[13px] bg-black/5 rounded-full w-24" />
            <div className="h-[32px] bg-black/5 rounded-full w-3/4" />
            <div className="h-[28px] bg-black/5 rounded-full w-20 mt-4" />
            <div className="h-[52px] bg-black/5 rounded-full w-full mt-8" />
            <div className="grid grid-cols-3 gap-3 mt-8">
              <div className="h-[72px] bg-black/5 rounded-2xl" />
              <div className="h-[72px] bg-black/5 rounded-2xl" />
              <div className="h-[72px] bg-black/5 rounded-2xl" />
            </div>
            <div className="h-[160px] bg-black/5 rounded-2xl mt-8" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-[1400px] px-4 text-center py-20">
        <h1 className="text-2xl font-bold">Product niet gevonden</h1>
      </div>
    );
  }

  const hasVariants = product.variants.length > 1;

  return (
    <div className="mx-auto max-w-[1400px] px-4 space-y-16">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-[var(--color-muted)]">
        <Link to="/" className="hover:text-[var(--color-navy)] transition-colors">Home</Link>
        <span>/</span>
        <span className="text-[var(--color-navy)] font-medium truncate">{product.title}</span>
      </div>

      {/* Product */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
        {/* Images */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-4"
        >
          <div className="card p-0 aspect-square overflow-hidden bg-white">
            <AnimatePresence mode="wait">
              <motion.img
                key={selectedImage}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                src={product.images[selectedImage]?.url}
                alt={product.images[selectedImage]?.altText || product.title}
                className="w-full h-full object-contain p-8"
              />
            </AnimatePresence>
          </div>

          {product.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto no-scrollbar">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all ${
                    i === selectedImage
                      ? 'border-[var(--color-primary)] shadow-md'
                      : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img.url} alt="" className="w-full h-full object-contain p-1 bg-white" />
                </button>
              ))}
            </div>
          )}
        </motion.div>

        {/* Info */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="py-2"
        >
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--color-primary)] mb-3">
            {product.vendor}
          </p>

          <h1
            className="text-2xl sm:text-3xl font-extrabold text-[var(--color-navy)] tracking-tight leading-tight"
            style={{ fontFamily: 'Montserrat' }}
          >
            {product.title}
          </h1>

          <p className="mt-4 text-2xl font-bold text-[var(--color-navy)]">
            {selectedVariant ? formatPrice(selectedVariant.price) : formatPrice(product.priceRange.minVariantPrice)}
          </p>

          {/* Variant Selector */}
          {hasVariants && (
            <div className="mt-6">
              <p className="text-sm font-semibold text-[var(--color-navy)] mb-3">Kies een optie</p>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVariant(v)}
                    disabled={!v.availableForSale}
                    className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                      selectedVariant?.id === v.id
                        ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                        : v.availableForSale
                          ? 'border-[var(--color-border)] text-[var(--color-navy)] hover:border-[var(--color-primary)]'
                          : 'border-[var(--color-border)] text-[var(--color-muted)] opacity-50 line-through cursor-not-allowed'
                    }`}
                  >
                    {v.title}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Add to Cart */}
          <div className="mt-8">
            <button
              onClick={handleAddToCart}
              disabled={isLoading || !selectedVariant?.availableForSale}
              className={`w-full py-4 rounded-full text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-300 ${
                added
                  ? 'bg-green-500 text-white shadow-[0_4px_14px_rgba(34,197,94,0.3)]'
                  : selectedVariant?.availableForSale
                    ? 'btn-primary'
                    : 'bg-black/10 text-[var(--color-muted)] cursor-not-allowed'
              }`}
            >
              {added ? (
                <>
                  <Check className="w-5 h-5" />
                  Toegevoegd aan winkelwagen
                </>
              ) : selectedVariant?.availableForSale ? (
                <>
                  <ShoppingBag className="w-5 h-5" />
                  In winkelwagen
                </>
              ) : (
                'Uitverkocht'
              )}
            </button>
          </div>

          {/* USPs */}
          <div className="mt-8 grid grid-cols-3 gap-3">
            {[
              { icon: Truck, label: 'Gratis verzending*' },
              { icon: Shield, label: 'Veilig betalen' },
              { icon: RefreshCw, label: '30 dagen retour' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-[var(--color-surface)] text-center">
                <Icon className="w-4 h-4 text-[var(--color-primary)]" />
                <span className="text-[11px] font-medium text-[var(--color-muted)]">{label}</span>
              </div>
            ))}
          </div>

          {/* Description */}
          {product.description && (
            <div className="mt-8 p-6 rounded-2xl bg-[var(--color-surface)]">
              <h3 className="text-sm font-bold text-[var(--color-navy)] mb-3" style={{ fontFamily: 'Montserrat' }}>
                Beschrijving
              </h3>
              <div className="text-sm text-[var(--color-navy)]/70 leading-relaxed whitespace-pre-line">
                {product.description}
              </div>
            </div>
          )}

          {/* Tags */}
          {product.tags.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {product.tags
                .filter((t) => !t.startsWith('DOEL-') && !t.startsWith('INGR-') && !t.startsWith('BEWUST-'))
                .slice(0, 8)
                .map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 text-xs font-medium bg-black/5 rounded-full text-[var(--color-muted)]"
                  >
                    {tag}
                  </span>
                ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold tracking-tight mb-8" style={{ fontFamily: 'Montserrat' }}>
            Gerelateerde producten
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {recommendations.slice(0, 4).map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
