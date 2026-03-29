import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { getCollectionProducts, type Product, type Collection as CollectionType, type CollectionProductsResult } from '../lib/shopify';
import ProductCard from '../components/ProductCard';

export default function Collection() {
  const { handle } = useParams<{ handle: string }>();
  const [collection, setCollection] = useState<CollectionType | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pageInfo, setPageInfo] = useState<{ hasNextPage: boolean; endCursor: string } | null>(null);
  const [sortBy, setSortBy] = useState('BEST_SELLING');

  useEffect(() => {
    if (!handle) return;
    setLoading(true);
    setProducts([]);

    getCollectionProducts(handle, 24)
      .then((data: CollectionProductsResult) => {
        setCollection(data.collection);
        setProducts(data.products);
        setPageInfo(data.pageInfo);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [handle]);

  const loadMore = async () => {
    if (!handle || !pageInfo?.hasNextPage || loadingMore) return;
    setLoadingMore(true);
    try {
      const data = await getCollectionProducts(handle, 24, pageInfo.endCursor);
      setProducts((prev) => [...prev, ...data.products]);
      setPageInfo(data.pageInfo);
    } finally {
      setLoadingMore(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-[1400px] px-4">
        <div className="mb-10 animate-pulse">
          <div className="h-[36px] sm:h-[40px] bg-black/5 rounded-xl w-48 mb-3" />
          <div className="h-[20px] bg-black/5 rounded-xl w-80 max-w-full" />
          <div className="mt-6 flex items-center justify-between">
            <div className="h-[20px] bg-black/5 rounded-full w-28" />
          </div>
        </div>
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
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="mx-auto max-w-[1400px] px-4 text-center py-20">
        <h1 className="text-2xl font-bold text-[var(--color-navy)]">Collectie niet gevonden</h1>
        <p className="text-[var(--color-muted)] mt-2">Deze collectie bestaat niet of is verplaatst.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4">
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
          {collection.title}
        </h1>
        {collection.description && (
          <p className="mt-3 text-[var(--color-muted)] max-w-2xl">{collection.description}</p>
        )}

        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-[var(--color-muted)]">
            {products.length} product{products.length !== 1 ? 'en' : ''}
          </p>
        </div>
      </motion.div>

      {/* Products */}
      {products.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-lg font-semibold text-[var(--color-navy)]">Geen producten gevonden</p>
          <p className="text-[var(--color-muted)] mt-2">Er zijn nog geen producten in deze collectie.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product, i) => (
              <ProductCard key={product.id} product={product} index={i} />
            ))}
          </div>

          {pageInfo?.hasNextPage && (
            <div className="mt-12 text-center">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="btn-secondary px-8 py-3 text-sm gap-2"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Laden...
                  </>
                ) : (
                  'Meer producten laden'
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
