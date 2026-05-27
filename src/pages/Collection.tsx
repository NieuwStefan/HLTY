import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { getAllCollectionProducts, getProductCategories, sortByBrandRelevance, type Product, type Collection as CollectionType } from '../lib/shopify';
import { handlesForMainsAndSubs, productMatchesHandles } from '../lib/product-categories';
import ProductCard from '../components/ProductCard';
import FilterSidebar from '../components/FilterSidebar';
import SEO from '../components/SEO';
import JsonLd from '../components/JsonLd';
import RelatedCategories from '../components/RelatedCategories';
import { buildMetaDescription } from '../lib/seo';

const PAGE_SIZE = 24;

type SortKey = 'recommended' | 'price-asc' | 'price-desc' | 'name';

export const DIET_OPTIONS = [
  { key: 'vegan', label: 'Vegan', test: (tags: string[]) => tags.some((t) => /vega/i.test(t)) },
  { key: 'bio', label: 'Biologisch', test: (tags: string[]) => tags.some((t) => /biolog/i.test(t)) },
  { key: 'suikervrij', label: 'Suikervrij', test: (tags: string[]) => tags.some((t) => /suikervr/i.test(t)) },
];

export default function Collection() {
  const { handle } = useParams<{ handle: string }>();
  const [collection, setCollection] = useState<CollectionType | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedDiets, setSelectedDiets] = useState<string[]>([]);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortKey>('recommended');
  const [selectedMainCategories, setSelectedMainCategories] = useState<string[]>([]);
  const [selectedSubCategories, setSelectedSubCategories] = useState<string[]>([]);

  useEffect(() => {
    if (!handle) return;
    setLoading(true);
    setProducts([]);
    setVisibleCount(PAGE_SIZE);
    setSelectedBrands([]);
    setSelectedIngredients([]);
    setSelectedCategories([]);
    setSelectedDiets([]);
    setInStockOnly(false);
    setSortBy('recommended');

    getAllCollectionProducts(handle)
      .then((data) => {
        setCollection(data.collection);
        setProducts(sortByBrandRelevance(data.products));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [handle]);

  // Pre-compute category memberships once per product set.
  const productCategoryKeys = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const p of products) {
      map.set(p.id, getProductCategories(p.productType).map((c) => c.key));
    }
    return map;
  }, [products]);

  // Category facets for the pill row: { key, label, count } sorted by count desc.
  // Counts are based on the full collection (not affected by other filters),
  // so the pills stay stable and predictable.
  const categoryFacets = useMemo(() => {
    const counts = new Map<string, { label: string; count: number }>();
    for (const p of products) {
      for (const cat of getProductCategories(p.productType)) {
        const entry = counts.get(cat.key);
        if (entry) entry.count += 1;
        else counts.set(cat.key, { label: cat.label, count: 1 });
      }
    }
    return [...counts.entries()]
      .map(([key, { label, count }]) => ({ key, label, count }))
      // Hide the "Overig" bucket unless it has meaningful volume.
      .filter((f) => f.key !== 'overig' || f.count >= 3)
      .sort((a, b) => b.count - a.count);
  }, [products]);

  /**
   * Apply all active filters, optionally skipping one. Used for live counts:
   * the count of a checkbox option inside section X reflects how many products
   * would remain if the user ticked that option, given all *other* active filters.
   * So when computing counts for section X, we exclude X itself.
   */
  type FilterKey = 'brand' | 'ingredient' | 'diet' | 'stock' | 'category';
  const applyFilters = (input: Product[], skip?: FilterKey) => {
    let r = input;
    if (selectedCategories.length > 0) {
      r = r.filter((p) => {
        const keys = productCategoryKeys.get(p.id) ?? [];
        return keys.some((k) => selectedCategories.includes(k));
      });
    }
    if (skip !== 'category') {
      const allowed = handlesForMainsAndSubs(selectedMainCategories, selectedSubCategories);
      if (allowed.length > 0) {
        r = r.filter((p) => productMatchesHandles(p.collections ?? [], allowed));
      }
    }
    if (skip !== 'brand' && selectedBrands.length > 0) {
      r = r.filter((p) => selectedBrands.includes(p.vendor));
    }
    if (skip !== 'ingredient' && selectedIngredients.length > 0) {
      r = r.filter((p) =>
        selectedIngredients.some((ingredient) => p.tags.includes(`INGR-${ingredient}`))
      );
    }
    if (skip !== 'diet' && selectedDiets.length > 0) {
      // AND across selected diets
      r = r.filter((p) =>
        selectedDiets.every((key) => {
          const opt = DIET_OPTIONS.find((d) => d.key === key);
          return opt ? opt.test(p.tags) : true;
        })
      );
    }
    if (skip !== 'stock' && inStockOnly) {
      r = r.filter((p) => p.variants.some((v) => v.availableForSale));
    }
    return r;
  };

  const filteredProducts = useMemo(
    () => applyFilters(products),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [products, productCategoryKeys, selectedCategories, selectedBrands, selectedIngredients, selectedDiets, inStockOnly, selectedMainCategories, selectedSubCategories]
  );

  // Candidate sets for live counts: products matching every filter except the section's own.
  const facetProducts = useMemo(
    () => ({
      brand: applyFilters(products, 'brand'),
      ingredient: applyFilters(products, 'ingredient'),
      diet: applyFilters(products, 'diet'),
      stock: applyFilters(products, 'stock'),
      category: applyFilters(products, 'category'),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [products, productCategoryKeys, selectedCategories, selectedBrands, selectedIngredients, selectedDiets, inStockOnly, selectedMainCategories, selectedSubCategories]
  );

  const sortedProducts = useMemo(() => {
    if (sortBy === 'recommended') return filteredProducts;
    const arr = [...filteredProducts];
    if (sortBy === 'price-asc') {
      arr.sort((a, b) =>
        parseFloat(a.priceRange.minVariantPrice.amount) -
        parseFloat(b.priceRange.minVariantPrice.amount)
      );
    } else if (sortBy === 'price-desc') {
      arr.sort((a, b) =>
        parseFloat(b.priceRange.minVariantPrice.amount) -
        parseFloat(a.priceRange.minVariantPrice.amount)
      );
    } else if (sortBy === 'name') {
      arr.sort((a, b) => a.title.localeCompare(b.title, 'nl'));
    }
    return arr;
  }, [filteredProducts, sortBy]);

  // Reset visible count when filters or sort change so user starts fresh
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [selectedCategories, selectedBrands, selectedIngredients, selectedDiets, inStockOnly, sortBy, selectedMainCategories, selectedSubCategories]);

  const toggleCategory = (key: string) => {
    setSelectedCategories((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  // Flatten all active filters into one removable list for the chip-row above the grid.
  const activeFilters = useMemo(() => {
    const list: { id: string; label: string; onRemove: () => void }[] = [];
    selectedCategories.forEach((k) => {
      const facet = categoryFacets.find((f) => f.key === k);
      if (facet) list.push({ id: `c-${k}`, label: facet.label, onRemove: () => toggleCategory(k) });
    });
    selectedBrands.forEach((b) => {
      list.push({
        id: `b-${b}`,
        label: b,
        onRemove: () => setSelectedBrands(selectedBrands.filter((x) => x !== b)),
      });
    });
    selectedIngredients.forEach((i) => {
      list.push({
        id: `i-${i}`,
        label: i.replace(/-&-/g, ' & ').replace(/-/g, ' '),
        onRemove: () => setSelectedIngredients(selectedIngredients.filter((x) => x !== i)),
      });
    });
    selectedDiets.forEach((d) => {
      const opt = DIET_OPTIONS.find((o) => o.key === d);
      if (opt) {
        list.push({
          id: `d-${d}`,
          label: opt.label,
          onRemove: () => setSelectedDiets(selectedDiets.filter((x) => x !== d)),
        });
      }
    });
    if (inStockOnly) {
      list.push({ id: 'stock', label: 'Alleen op voorraad', onRemove: () => setInStockOnly(false) });
    }
    return list;
  }, [selectedCategories, selectedBrands, selectedIngredients, selectedDiets, inStockOnly, categoryFacets]);

  const visibleProducts = useMemo(
    () => sortedProducts.slice(0, visibleCount),
    [sortedProducts, visibleCount]
  );
  const hasMore = visibleCount < sortedProducts.length;

  const loadMore = () => {
    setVisibleCount((c) => Math.min(c + PAGE_SIZE, sortedProducts.length));
  };

  const clearFilters = () => {
    setSelectedBrands([]);
    setSelectedIngredients([]);
    setSelectedCategories([]);
    setSelectedDiets([]);
    setInStockOnly(false);
    setSelectedMainCategories([]);
    setSelectedSubCategories([]);
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
      <>
        <SEO
          title="Collectie niet gevonden"
          description="Deze collectie bestaat niet of is verplaatst."
          path={`/collectie/${handle ?? ''}`}
          noindex
        />
        <div className="mx-auto max-w-[1400px] px-4 text-center py-20">
          <h1 className="text-2xl font-bold text-[var(--color-navy)]">Collectie niet gevonden</h1>
          <p className="text-[var(--color-muted)] mt-2">Deze collectie bestaat niet of is verplaatst.</p>
        </div>
      </>
    );
  }

  const seoDescription = buildMetaDescription(
    collection.description ||
      `${collection.title} bij HLTY — door fysiotherapeuten geselecteerd uit duizenden producten. Helder, eerlijk en zonder marketingclaims.`,
  );

  const collectionUrl = `https://www.hlty.shop/collectie/${collection.handle}`;
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.hlty.shop/' },
      { '@type': 'ListItem', position: 2, name: collection.title, item: collectionUrl },
    ],
  };
  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListOrder: 'https://schema.org/ItemListOrderAscending',
    numberOfItems: sortedProducts.length,
    itemListElement: sortedProducts.slice(0, 30).map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `https://www.hlty.shop/product/${p.handle}`,
    })),
  };

  return (
    <>
      <SEO
        title={collection.title}
        description={seoDescription}
        path={`/collectie/${collection.handle}`}
      />
      <JsonLd data={[breadcrumbSchema, itemListSchema]} />
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

        <div className="mt-6 flex items-center justify-between gap-4">
          <p className="text-sm text-[var(--color-muted)]">
            {filteredProducts.length} product{filteredProducts.length !== 1 ? 'en' : ''}
            {filteredProducts.length !== products.length && (
              <span className="text-[var(--color-muted)]"> van {products.length}</span>
            )}
          </p>
          <label className="flex items-center gap-2 text-sm text-[var(--color-muted)]">
            <span className="hidden sm:inline">Sorteer op</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortKey)}
              className="rounded-full border border-[var(--color-border)] bg-white px-3 py-1.5 pr-8 text-sm font-medium text-[var(--color-navy)] cursor-pointer hover:border-[var(--color-primary)] focus:border-[var(--color-primary)] focus:outline-none transition-colors"
            >
              <option value="recommended">Aanbevolen</option>
              <option value="price-asc">Prijs &uarr;</option>
              <option value="price-desc">Prijs &darr;</option>
              <option value="name">Naam A&ndash;Z</option>
            </select>
          </label>
        </div>

        {categoryFacets.length >= 2 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {categoryFacets.map(({ key, label, count }) => {
              const active = selectedCategories.includes(key);
              return (
                <button
                  key={key}
                  onClick={() => toggleCategory(key)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                    active
                      ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
                      : 'bg-white text-[var(--color-navy)] border-[var(--color-border)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]'
                  }`}
                >
                  <span>{label}</span>
                  <span
                    className={`text-xs tabular-nums ${
                      active ? 'text-white/80' : 'text-[var(--color-muted)]'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Mobile filter */}
      <div className="lg:hidden">
        <FilterSidebar
          products={products}
          facetProducts={facetProducts}
          selectedBrands={selectedBrands}
          selectedIngredients={selectedIngredients}
          selectedDiets={selectedDiets}
          inStockOnly={inStockOnly}
          onBrandsChange={setSelectedBrands}
          onIngredientsChange={setSelectedIngredients}
          onDietsChange={setSelectedDiets}
          onInStockChange={setInStockOnly}
          onClear={clearFilters}
          dietOptions={DIET_OPTIONS}
          showCategoryFilter
          selectedMainCategories={selectedMainCategories}
          selectedSubCategories={selectedSubCategories}
          onMainCategoriesChange={setSelectedMainCategories}
          onSubCategoriesChange={setSelectedSubCategories}
        />
      </div>

      {/* Content with sidebar */}
      <div className="flex gap-8">
        {/* Desktop sidebar */}
        <div className="hidden lg:block">
          <FilterSidebar
            products={products}
            facetProducts={facetProducts}
            selectedBrands={selectedBrands}
            selectedIngredients={selectedIngredients}
            selectedDiets={selectedDiets}
            inStockOnly={inStockOnly}
            onBrandsChange={setSelectedBrands}
            onIngredientsChange={setSelectedIngredients}
            onDietsChange={setSelectedDiets}
            onInStockChange={setInStockOnly}
            onClear={clearFilters}
            dietOptions={DIET_OPTIONS}
            showCategoryFilter
            selectedMainCategories={selectedMainCategories}
            selectedSubCategories={selectedSubCategories}
            onMainCategoriesChange={setSelectedMainCategories}
            onSubCategoriesChange={setSelectedSubCategories}
          />
        </div>

        {/* Products */}
        <div className="flex-1 min-w-0">
          {filteredProducts.length === 0 ? (
            <div className="card p-12 text-center">
              <p className="text-lg font-semibold text-[var(--color-navy)]">Geen producten gevonden</p>
              <p className="text-[var(--color-muted)] mt-2">
                {products.length > 0
                  ? 'Probeer andere filters of wis je selectie.'
                  : 'Er zijn nog geen producten in deze collectie.'}
              </p>
              {products.length > 0 && (
                <button onClick={clearFilters} className="btn-primary mt-4 px-6 py-2 text-sm">
                  Wis filters
                </button>
              )}
            </div>
          ) : (
            <>
              {activeFilters.length > 0 && (
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  {activeFilters.map((f) => (
                    <button
                      key={f.id}
                      onClick={f.onRemove}
                      className="inline-flex items-center gap-1.5 pl-3 pr-2 py-1 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-xs font-medium hover:bg-[var(--color-primary)]/15 transition-colors"
                    >
                      <span>{f.label}</span>
                      <X className="w-3 h-3" />
                    </button>
                  ))}
                  {activeFilters.length >= 2 && (
                    <button
                      onClick={clearFilters}
                      className="text-xs font-medium text-[var(--color-muted)] hover:text-[var(--color-navy)] transition-colors ml-1"
                    >
                      Wis alles
                    </button>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {visibleProducts.map((product, i) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    index={i}
                    from={
                      collection
                        ? { type: 'collection', handle: collection.handle, title: collection.title }
                        : undefined
                    }
                  />
                ))}
              </div>

              {hasMore && (
                <div className="mt-12 text-center">
                  <button
                    onClick={loadMore}
                    className="btn-secondary px-8 py-3 text-sm gap-2"
                  >
                    Meer producten laden
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <RelatedCategories excludeHandle={collection.handle} />
    </div>
    </>
  );
}
