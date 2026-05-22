import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Check, Plus, Minus, Loader2 } from 'lucide-react';
import {
  getProduct,
  getProductRecommendations,
  type Product as ProductType,
  type ProductVariant,
  formatPrice,
  brandSlug,
} from '../lib/shopify';
import { useCart } from '../context/CartContext';
import ProductCard from '../components/ProductCard';
import ProductDescription from '../components/ProductDescription';
import BrandSection from '../components/BrandSection';
import SEO from '../components/SEO';
import JsonLd from '../components/JsonLd';
import { getBrand } from '../data/brands';
import { findPrimaryCategory } from '../lib/categories';
import { formatProductTitle } from '../lib/product-title';

interface ProductLocationState {
  from?: {
    type: 'collection' | 'brand';
    handle: string;
    title: string;
  };
}

const HIDDEN_TAG_PREFIXES = ['DOEL-', 'INGR-', 'BEWUST-', 'BTW'];

function isVisibleTag(tag: string): boolean {
  const t = tag.trim();
  if (!t) return false;
  return !HIDDEN_TAG_PREFIXES.some((p) => t.toLowerCase().startsWith(p.toLowerCase()));
}

export default function Product() {
  const { handle } = useParams<{ handle: string }>();
  const location = useLocation();
  const { addItem, isLoading } = useCart();
  const [product, setProduct] = useState<ProductType | null>(null);
  const [recommendations, setRecommendations] = useState<ProductType[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const cartButtonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!handle) return;
    setLoading(true);
    setAdded(false);
    setSelectedImage(0);
    setQuantity(1);

    getProduct(handle)
      .then((p) => {
        setProduct(p);
        setSelectedVariant(p.variants[0] || null);
        getProductRecommendations(p.id)
          .then(setRecommendations)
          .catch(() => {});
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [handle]);

  // Show the floating mobile bar when the inline add-to-cart leaves the viewport
  useEffect(() => {
    const el = cartButtonRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setShowStickyBar(!entry.isIntersecting),
      { rootMargin: '-80px 0px 0px 0px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [product]);

  const handleAddToCart = async () => {
    if (!selectedVariant || !selectedVariant.availableForSale) return;
    await addItem(selectedVariant.id, quantity);
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
          <div className="card p-0 aspect-square bg-black/5" />
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
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <>
        <SEO
          title="Product niet gevonden"
          description="Dit product staat niet (meer) in het HLTY-assortiment."
          path={`/product/${handle ?? ''}`}
          noindex
        />
        <div className="mx-auto max-w-[1400px] px-4 text-center py-20">
          <h1 className="text-2xl font-bold">Product niet gevonden</h1>
        </div>
      </>
    );
  }

  const hasVariants = product.variants.length > 1;
  const inStock = !!selectedVariant?.availableForSale;
  const optionName =
    product.variants[0]?.selectedOptions?.[0]?.name &&
    product.variants[0].selectedOptions[0].name !== 'Title'
      ? product.variants[0].selectedOptions[0].name
      : 'Optie';
  const visibleTags = product.tags.filter(isVisibleTag).slice(0, 8);
  const brandHandle = brandSlug(product.vendor || '');
  const brand = brandHandle ? getBrand(brandHandle) : null;

  // Breadcrumb: gebruik herkomst-state als die er is, anders fallback op
  // primary-category-whitelist. Bij brand-herkomst geen tussenniveau tonen
  // (anders wordt het Home / Brand / Brand / Product).
  const locationState = (location.state ?? null) as ProductLocationState | null;
  const fromCollection =
    locationState?.from?.type === 'collection' ? locationState.from : null;
  const fromBrand = locationState?.from?.type === 'brand';
  // Breadcrumb-tussenniveau (categorie): toon alleen als klant van een
  // collectie komt of bij directe URL (whitelist-fallback). Bij brand-
  // herkomst geen tussenniveau (Brand is al de breadcrumb-context).
  let breadcrumbCategory: { handle: string; label: string } | null = null;
  if (fromCollection) {
    breadcrumbCategory = { handle: fromCollection.handle, label: fromCollection.title };
  } else if (!fromBrand) {
    const fb = findPrimaryCategory(product.collections ?? []);
    if (fb) breadcrumbCategory = { handle: fb.handle, label: fb.label };
  }

  const seoTitle = formatProductTitle(product.title);
  const seoDescription = (product.description || `${seoTitle} bij HLTY — door fysiotherapeuten geselecteerd assortiment.`)
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 160);

  // JSON-LD: Product schema + BreadcrumbList
  const productUrl = `https://www.hlty.shop/product/${product.handle}`;
  const variantPrices = product.variants
    .map((v) => parseFloat(v.price.amount))
    .filter((n) => Number.isFinite(n));
  const lowPrice = variantPrices.length ? Math.min(...variantPrices).toFixed(2) : undefined;
  const highPrice = variantPrices.length ? Math.max(...variantPrices).toFixed(2) : undefined;
  const currency = product.variants[0]?.price.currencyCode || 'EUR';
  const anyInStock = product.variants.some((v) => v.availableForSale);

  const productSchema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: seoTitle,
    description: seoDescription,
    image: product.images.map((i) => i.url).slice(0, 6),
    sku: product.variants[0]?.id,
    url: productUrl,
    ...(product.vendor ? { brand: { '@type': 'Brand', name: product.vendor } } : {}),
    ...(lowPrice && highPrice
      ? {
          offers: lowPrice === highPrice
            ? {
                '@type': 'Offer',
                url: productUrl,
                priceCurrency: currency,
                price: lowPrice,
                availability: anyInStock
                  ? 'https://schema.org/InStock'
                  : 'https://schema.org/OutOfStock',
              }
            : {
                '@type': 'AggregateOffer',
                url: productUrl,
                priceCurrency: currency,
                lowPrice,
                highPrice,
                offerCount: product.variants.length,
                availability: anyInStock
                  ? 'https://schema.org/InStock'
                  : 'https://schema.org/OutOfStock',
              },
        }
      : {}),
  };

  const breadcrumbItems: { name: string; url: string }[] = [
    { name: 'Home', url: 'https://www.hlty.shop/' },
  ];
  if (breadcrumbCategory) {
    breadcrumbItems.push({
      name: breadcrumbCategory.label,
      url: `https://www.hlty.shop/collectie/${breadcrumbCategory.handle}`,
    });
  } else if (fromBrand && brandHandle) {
    breadcrumbItems.push({
      name: product.vendor,
      url: `https://www.hlty.shop/merken/${brandHandle}`,
    });
  }
  breadcrumbItems.push({ name: seoTitle, url: productUrl });

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbItems.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: it.url,
    })),
  };

  return (
    <>
      <SEO
        title={seoTitle}
        description={seoDescription}
        path={`/product/${product.handle}`}
        image={product.images[0]?.url}
        type="product"
      />
      <JsonLd data={[productSchema, breadcrumbSchema]} />
      <div className="mx-auto max-w-[1400px] px-4 space-y-16">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-[var(--color-muted)]">
          <Link to="/" className="hover:text-[var(--color-navy)] transition-colors">
            Home
          </Link>
          <span>/</span>
          {breadcrumbCategory && (
            <>
              <Link
                to={`/collectie/${breadcrumbCategory.handle}`}
                className="hover:text-[var(--color-navy)] transition-colors"
              >
                {breadcrumbCategory.label}
              </Link>
              <span>/</span>
            </>
          )}
          {brandHandle && (
            <>
              <Link
                to={`/merken/${brandHandle}`}
                className="hover:text-[var(--color-navy)] transition-colors"
              >
                {product.vendor}
              </Link>
              <span>/</span>
            </>
          )}
          <span className="text-[var(--color-navy)] font-medium truncate">{formatProductTitle(product.title, product.vendor)}</span>
        </div>

        {/* Top: Image + Info */}
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
            {brandHandle ? (
              <Link
                to={`/merken/${brandHandle}`}
                className="inline-block text-xs font-bold uppercase tracking-widest text-[var(--color-primary)] mb-3 hover:underline"
              >
                {product.vendor}
              </Link>
            ) : (
              <p className="text-xs font-bold uppercase tracking-widest text-[var(--color-primary)] mb-3">
                {product.vendor}
              </p>
            )}

            <h1
              className="text-2xl sm:text-3xl font-extrabold text-[var(--color-navy)] tracking-tight leading-tight"
              style={{ fontFamily: 'Montserrat' }}
            >
              {formatProductTitle(product.title, product.vendor)}
            </h1>

            {/* Price + Stock */}
            <div className="mt-4 flex items-center gap-3 flex-wrap">
              <p className="text-2xl font-bold text-[var(--color-navy)]">
                {selectedVariant
                  ? formatPrice(selectedVariant.price)
                  : formatPrice(product.priceRange.minVariantPrice)}
              </p>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                  inStock
                    ? 'bg-[var(--color-primary-light)] text-[var(--color-primary-dark)]'
                    : 'bg-red-50 text-red-700'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    inStock ? 'bg-[var(--color-primary)]' : 'bg-red-500'
                  }`}
                />
                {inStock ? 'Op voorraad' : 'Uitverkocht'}
              </span>
            </div>

            {/* Variant Selector */}
            {hasVariants && (
              <div className="mt-6">
                <p className="text-sm font-semibold text-[var(--color-navy)] mb-3">
                  {optionName}
                </p>
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

            {/* Qty + Add to Cart */}
            <div ref={cartButtonRef} className="mt-8 flex items-stretch gap-3">
              <div className="inline-flex items-center rounded-full border border-[var(--color-border)] bg-white overflow-hidden">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={!inStock || quantity <= 1}
                  className="w-11 h-12 flex items-center justify-center text-[var(--color-navy)] disabled:text-[var(--color-muted)]/50 disabled:cursor-not-allowed hover:bg-black/[0.03] transition-colors"
                  aria-label="Aantal verlagen"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-8 text-center text-sm font-semibold tabular-nums text-[var(--color-navy)] select-none">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(99, q + 1))}
                  disabled={!inStock}
                  className="w-11 h-12 flex items-center justify-center text-[var(--color-navy)] disabled:text-[var(--color-muted)]/50 disabled:cursor-not-allowed hover:bg-black/[0.03] transition-colors"
                  aria-label="Aantal verhogen"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={isLoading || !inStock}
                className={`flex-1 h-12 rounded-full text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-300 ${
                  added
                    ? 'bg-green-500 text-white shadow-[0_4px_14px_rgba(34,197,94,0.3)]'
                    : inStock
                      ? 'btn-primary'
                      : 'bg-black/10 text-[var(--color-muted)] cursor-not-allowed'
                }`}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : added ? (
                  <>
                    <Check className="w-5 h-5" />
                    Toegevoegd
                  </>
                ) : inStock ? (
                  <>
                    <ShoppingBag className="w-5 h-5" />
                    In winkelwagen
                  </>
                ) : (
                  'Uitverkocht'
                )}
              </button>
            </div>

            {/* Description (accordion inside info column) */}
            {product.descriptionHtml && (
              <div className="mt-8">
                <ProductDescription
                  html={product.descriptionHtml}
                  productTitle={product.title}
                />
              </div>
            )}
          </motion.div>
        </div>

        {/* Brand section — hardcoded per merk via src/data/brands.ts */}
        {brand && (
          <BrandSection
            brand={brand}
            onAddToCart={handleAddToCart}
            canAddToCart={inStock}
            isLoading={isLoading}
            added={added}
          />
        )}

        {/* Tags (clickable) */}
        {visibleTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {visibleTags.map((tag) => (
              <Link
                key={tag}
                to={`/zoeken?q=${encodeURIComponent(tag)}`}
                className="px-3 py-1 text-xs font-medium bg-black/5 rounded-full text-[var(--color-muted)] hover:bg-black/10 hover:text-[var(--color-navy)] transition-colors"
              >
                {tag}
              </Link>
            ))}
          </div>
        )}

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <section>
            <h2
              className="text-2xl font-bold tracking-tight mb-8"
              style={{ fontFamily: 'Montserrat' }}
            >
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

      {/* Mobile sticky bottom bar */}
      <AnimatePresence>
        {showStickyBar && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed bottom-0 left-0 right-0 z-40 lg:hidden"
          >
            <div className="glass border-t border-white/60 px-4 py-3 flex items-center gap-3 shadow-[0_-8px_24px_rgba(0,0,0,0.06)]">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl overflow-hidden bg-white border border-[var(--color-border)]">
                <img
                  src={product.images[0]?.url}
                  alt=""
                  className="w-full h-full object-contain p-1"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-[var(--color-muted)] truncate">
                  {product.vendor}
                </p>
                <p className="text-sm font-bold text-[var(--color-navy)]">
                  {selectedVariant
                    ? formatPrice(selectedVariant.price)
                    : formatPrice(product.priceRange.minVariantPrice)}
                </p>
              </div>
              <button
                onClick={handleAddToCart}
                disabled={isLoading || !inStock}
                className={`h-11 px-5 rounded-full text-sm font-semibold flex items-center justify-center gap-2 ${
                  inStock ? 'btn-primary' : 'bg-black/10 text-[var(--color-muted)]'
                }`}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : inStock ? (
                  <>
                    <ShoppingBag className="w-4 h-4" />
                    Toevoegen
                  </>
                ) : (
                  'Uitverkocht'
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
