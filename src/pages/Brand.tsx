import { useEffect, useState } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import {
  getAllBrands,
  getProductsByBrand,
  type BrandSummary,
  type Product,
} from '../lib/shopify';
import ProductCard from '../components/ProductCard';

export default function Brand() {
  const { brand: brandParam } = useParams<{ brand: string }>();
  const [brand, setBrand] = useState<BrandSummary | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!brandParam) return;
    let cancelled = false;
    setLoading(true);
    setNotFound(false);

    (async () => {
      try {
        const brands = await getAllBrands();
        const match = brands.find((b) => b.handle === brandParam);
        if (!match) {
          if (!cancelled) {
            setNotFound(true);
            setLoading(false);
          }
          return;
        }
        const prods = await getProductsByBrand(match.name);
        if (!cancelled) {
          setBrand(match);
          setProducts(prods);
          setLoading(false);
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [brandParam]);

  if (notFound) return <Navigate to="/" replace />;

  if (loading) {
    return (
      <div className="mx-auto max-w-[1400px] px-4">
        <div className="mb-10 animate-pulse">
          <div className="h-[16px] bg-black/5 rounded-full w-48 mb-4" />
          <div className="h-[36px] sm:h-[40px] bg-black/5 rounded-xl w-64 mb-3" />
          <div className="h-[20px] bg-black/5 rounded-xl w-32" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card p-0 animate-pulse">
              <div className="aspect-square bg-black/5" />
              <div className="p-4">
                <div className="h-[15px] bg-black/5 rounded-full w-16 mb-1.5" />
                <div className="min-h-[2.5rem] space-y-1.5">
                  <div className="h-[14px] bg-black/5 rounded-full w-full" />
                  <div className="h-[14px] bg-black/5 rounded-full w-2/3" />
                </div>
                <div className="h-[20px] bg-black/5 rounded-full w-20 mt-2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!brand) return null;

  return (
    <div className="mx-auto max-w-[1400px] px-4">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-1.5 text-sm text-[var(--color-muted)]">
        <Link to="/" className="hover:text-[var(--color-navy)] transition-colors">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-[var(--color-muted)]">Merken</span>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-[var(--color-navy)]">{brand.name}</span>
      </nav>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10"
      >
        <h1
          className="text-3xl sm:text-4xl font-extrabold text-[var(--color-navy)] tracking-tight"
          style={{ fontFamily: 'Montserrat' }}
        >
          {brand.name}
        </h1>
        <p className="mt-3 text-sm text-[var(--color-muted)]">
          {products.length} product{products.length !== 1 ? 'en' : ''}
        </p>
      </motion.div>

      {/* Products */}
      {products.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-lg font-semibold text-[var(--color-navy)]">Geen producten gevonden</p>
          <p className="text-[var(--color-muted)] mt-2">
            Er zijn op dit moment geen producten van {brand.name} beschikbaar.
          </p>
          <Link to="/" className="btn-primary mt-4 inline-flex px-6 py-2 text-sm">
            Terug naar home
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {products.map((product, i) => (
            <ProductCard
              key={product.id}
              product={product}
              index={i}
              from={{ type: 'brand', handle: brand.handle, title: brand.name }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
