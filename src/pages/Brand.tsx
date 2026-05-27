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
import SEO from '../components/SEO';
import JsonLd from '../components/JsonLd';
import { getBrand } from '../data/brands';
import { buildMetaDescription } from '../lib/seo';
import RelatedCategories from '../components/RelatedCategories';

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

  // Gecureerde merk-content (tagline/verhaal/pijlers) uit src/data/brands.ts.
  // Niet elk merk heeft een record — dan valt alles terug op generieke tekst.
  const content = getBrand(brand.handle);

  const fallbackDescription = `Ontdek het ${brand.name}-assortiment bij HLTY. Onze fysiotherapeuten selecteerden alleen wat écht werkt — helder, eerlijk en zonder marketingclaims.`;
  const seoDescription = content
    ? buildMetaDescription(
        `${brand.name} bij HLTY — ${content.tagline ? `${content.tagline}. ` : ''}${content.story}`,
      )
    : fallbackDescription;

  const brandUrl = `https://www.hlty.shop/merken/${brand.handle}`;
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.hlty.shop/' },
      { '@type': 'ListItem', position: 2, name: 'Merken', item: 'https://www.hlty.shop/' },
      { '@type': 'ListItem', position: 3, name: brand.name, item: brandUrl },
    ],
  };
  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${brand.name} bij HLTY`,
    ...(content ? { description: content.story } : {}),
    itemListOrder: 'https://schema.org/ItemListOrderAscending',
    numberOfItems: products.length,
    itemListElement: products.slice(0, 30).map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `https://www.hlty.shop/product/${p.handle}`,
    })),
  };

  return (
    <>
      <SEO
        title={`${brand.name} bij HLTY`}
        description={seoDescription}
        path={`/merken/${brand.handle}`}
      />
      <JsonLd data={[breadcrumbSchema, itemListSchema]} />
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

        {content?.tagline && (
          <p className="mt-2 text-base font-medium text-[var(--color-primary-dark)]">
            {content.tagline}
          </p>
        )}

        {content?.story && (
          <p className="mt-4 max-w-2xl text-[var(--color-muted)] leading-relaxed">
            {content.story}
          </p>
        )}

        {content?.whyHlty && (
          <p className="mt-3 max-w-2xl text-sm text-[var(--color-muted)] leading-relaxed">
            <span className="font-semibold text-[var(--color-navy)]">Waarom bij HLTY: </span>
            {content.whyHlty}
          </p>
        )}

        {content?.pillars && content.pillars.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2">
            {content.pillars.map((pillar) => (
              <span
                key={pillar.label}
                className="inline-flex items-center gap-1.5 text-sm text-[var(--color-navy)]"
              >
                <pillar.icon className="w-4 h-4 text-[var(--color-primary)]" />
                {pillar.label}
              </span>
            ))}
          </div>
        )}

        <p className="mt-6 text-sm text-[var(--color-muted)]">
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

      <RelatedCategories />
    </div>
    </>
  );
}
