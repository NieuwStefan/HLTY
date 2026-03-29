import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search as SearchIcon } from 'lucide-react';
import { searchProducts, type Product } from '../lib/shopify';
import ProductCard from '../components/ProductCard';

export default function Search() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setProducts([]);
      return;
    }

    setLoading(true);
    searchProducts(query, 48)
      .then((data) => setProducts(data.products))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [query]);

  return (
    <div className="mx-auto max-w-[1400px] px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10"
      >
        <h1
          className="text-3xl sm:text-4xl font-extrabold text-[var(--color-navy)] tracking-tight"
          style={{ fontFamily: 'Montserrat' }}
        >
          {query ? `Resultaten voor "${query}"` : 'Zoeken'}
        </h1>
        {!loading && query && (
          <p className="mt-2 text-[var(--color-muted)]">
            {products.length} product{products.length !== 1 ? 'en' : ''} gevonden
          </p>
        )}
      </motion.div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
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
      ) : products.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((product, i) => (
            <ProductCard key={product.id} product={product} index={i} />
          ))}
        </div>
      ) : query ? (
        <div className="card p-12 text-center">
          <SearchIcon className="w-12 h-12 text-[var(--color-muted)]/30 mx-auto mb-4" />
          <p className="text-lg font-semibold text-[var(--color-navy)]">Geen resultaten</p>
          <p className="text-[var(--color-muted)] mt-2">
            Probeer een ander zoekwoord of bekijk onze categorieën.
          </p>
        </div>
      ) : (
        <div className="card p-12 text-center">
          <SearchIcon className="w-12 h-12 text-[var(--color-muted)]/30 mx-auto mb-4" />
          <p className="text-lg font-semibold text-[var(--color-navy)]">Waar ben je naar op zoek?</p>
          <p className="text-[var(--color-muted)] mt-2">
            Gebruik de zoekbalk bovenaan om producten te vinden.
          </p>
        </div>
      )}
    </div>
  );
}
