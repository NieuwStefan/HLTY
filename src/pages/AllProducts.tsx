import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Apple, Pill, Stethoscope, X } from 'lucide-react';
import { getAllProducts, type Product } from '../lib/shopify';
import {
  MAIN_CATEGORIES,
  getMainCategory,
  findMainBySubId,
  handlesForMainsAndSubs,
  productMatchesHandles,
} from '../lib/product-categories';
import ProductCard from '../components/ProductCard';
import FilterSidebar from '../components/FilterSidebar';
import SEO from '../components/SEO';
import JsonLd from '../components/JsonLd';
import { DIET_OPTIONS } from './Collection';

const PAGE_SIZE = 24;

const MAIN_META: Record<string, { icon: typeof Apple; color: string }> = {
  voeding: { icon: Apple, color: '#34C759' },
  supplementen: { icon: Pill, color: '#00D1A0' },
  'fysio-accessoires': { icon: Stethoscope, color: '#AF52DE' },
};

export default function AllProducts() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // URL-state → categorie-selectie
  const selectedMains = useMemo(() => {
    const raw = searchParams.get('cat');
    return raw ? raw.split(',').filter(Boolean) : [];
  }, [searchParams]);
  const selectedSubs = useMemo(() => {
    const raw = searchParams.get('sub');
    return raw ? raw.split(',').filter(Boolean) : [];
  }, [searchParams]);

  // Sidebar filters (lokaal state, geen URL)
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [selectedDiets, setSelectedDiets] = useState<string[]>([]);
  const [inStockOnly, setInStockOnly] = useState(false);

  // Laad alle producten éénmalig
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getAllProducts()
      .then((all) => {
        if (cancelled) return;
        setProducts(all);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [selectedMains, selectedSubs, selectedBrands, selectedIngredients, selectedDiets, inStockOnly]);

  // URL-helpers
  const updateUrl = (mains: string[], subs: string[]) => {
    const next = new URLSearchParams(searchParams);
    if (mains.length > 0) next.set('cat', mains.join(','));
    else next.delete('cat');
    if (subs.length > 0) next.set('sub', subs.join(','));
    else next.delete('sub');
    setSearchParams(next, { replace: false });
  };

  const setMains = (mains: string[]) => {
    // Bij verwijderen van een main: ook subs van die main verwijderen
    const allowedSubs = selectedSubs.filter((s) => {
      const m = findMainBySubId(s);
      return m ? mains.includes(m.id) : true;
    });
    updateUrl(mains, allowedSubs);
  };

  const toggleMain = (mainId: string) => {
    const next = selectedMains.includes(mainId)
      ? selectedMains.filter((m) => m !== mainId)
      : [...selectedMains, mainId];
    setMains(next);
  };

  const setSubs = (subs: string[]) => {
    updateUrl(selectedMains, subs);
  };

  const toggleSub = (subId: string) => {
    const next = selectedSubs.includes(subId)
      ? selectedSubs.filter((s) => s !== subId)
      : [...selectedSubs, subId];
    setSubs(next);
  };

  const clearAllSelections = () => {
    setSearchParams(new URLSearchParams(), { replace: false });
    setSelectedBrands([]);
    setSelectedIngredients([]);
    setSelectedDiets([]);
    setInStockOnly(false);
  };

  // Apply filters
  type FilterKey = 'brand' | 'ingredient' | 'diet' | 'stock' | 'category';
  const applyFilters = (input: Product[], skip?: FilterKey): Product[] => {
    let r = input;
    if (skip !== 'category') {
      const allowed = handlesForMainsAndSubs(selectedMains, selectedSubs);
      if (allowed.length > 0) {
        r = r.filter((p) => productMatchesHandles(p.collections ?? [], allowed));
      }
    }
    if (skip !== 'brand' && selectedBrands.length > 0) {
      r = r.filter((p) => selectedBrands.includes(p.vendor));
    }
    if (skip !== 'ingredient' && selectedIngredients.length > 0) {
      r = r.filter((p) =>
        selectedIngredients.some((ing) => p.tags.includes(`INGR-${ing}`)),
      );
    }
    if (skip !== 'diet' && selectedDiets.length > 0) {
      r = r.filter((p) =>
        selectedDiets.every((key) => {
          const opt = DIET_OPTIONS.find((d) => d.key === key);
          return opt ? opt.test(p.tags) : true;
        }),
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
    [products, selectedMains, selectedSubs, selectedBrands, selectedIngredients, selectedDiets, inStockOnly],
  );

  const facetProducts = useMemo(
    () => ({
      brand: applyFilters(products, 'brand'),
      ingredient: applyFilters(products, 'ingredient'),
      diet: applyFilters(products, 'diet'),
      stock: applyFilters(products, 'stock'),
      category: applyFilters(products, 'category'),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [products, selectedMains, selectedSubs, selectedBrands, selectedIngredients, selectedDiets, inStockOnly],
  );

  const visibleProducts = filteredProducts.slice(0, visibleCount);
  const hasMore = visibleCount < filteredProducts.length;

  // Chips: actieve filter-pillen
  const activeChips = useMemo(() => {
    const chips: { id: string; label: string; onRemove: () => void }[] = [];
    selectedMains.forEach((mainId) => {
      const m = getMainCategory(mainId);
      if (m) {
        chips.push({
          id: `m-${mainId}`,
          label: m.label,
          onRemove: () => toggleMain(mainId),
        });
      }
    });
    selectedSubs.forEach((subId) => {
      const m = findMainBySubId(subId);
      const sub = m?.subs.find((s) => s.id === subId);
      if (sub) {
        chips.push({
          id: `s-${subId}`,
          label: sub.label,
          onRemove: () => toggleSub(subId),
        });
      }
    });
    selectedBrands.forEach((b) =>
      chips.push({
        id: `b-${b}`,
        label: b,
        onRemove: () => setSelectedBrands(selectedBrands.filter((x) => x !== b)),
      }),
    );
    selectedIngredients.forEach((i) =>
      chips.push({
        id: `i-${i}`,
        label: i.replace(/-&-/g, ' & ').replace(/-/g, ' '),
        onRemove: () => setSelectedIngredients(selectedIngredients.filter((x) => x !== i)),
      }),
    );
    selectedDiets.forEach((d) => {
      const opt = DIET_OPTIONS.find((o) => o.key === d);
      if (opt) {
        chips.push({
          id: `d-${d}`,
          label: opt.label,
          onRemove: () => setSelectedDiets(selectedDiets.filter((x) => x !== d)),
        });
      }
    });
    if (inStockOnly) {
      chips.push({ id: 'stock', label: 'Alleen op voorraad', onRemove: () => setInStockOnly(false) });
    }
    return chips;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMains, selectedSubs, selectedBrands, selectedIngredients, selectedDiets, inStockOnly]);

  // Welke sub-tegels tonen (per geselecteerde main)
  const visibleSubGroups = useMemo(() => {
    return selectedMains
      .map((mainId) => getMainCategory(mainId))
      .filter((m): m is NonNullable<typeof m> => m !== null);
  }, [selectedMains]);

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.hlty.shop/' },
      { '@type': 'ListItem', position: 2, name: 'Alle producten', item: 'https://www.hlty.shop/alle-producten' },
    ],
  };
  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListOrder: 'https://schema.org/ItemListOrderAscending',
    numberOfItems: filteredProducts.length,
    itemListElement: filteredProducts.slice(0, 30).map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `https://www.hlty.shop/product/${p.handle}`,
    })),
  };

  return (
    <>
      <SEO
        title="Alle producten"
        description="Het volledige HLTY-assortiment: 900+ supplementen, voeding en fysio-accessoires, geselecteerd door fysiotherapeuten — helder, eerlijk en zonder marketingclaims."
        path="/alle-producten"
      />
      <JsonLd data={[breadcrumbSchema, itemListSchema]} />
    <div className="mx-auto max-w-[1400px] px-4 space-y-10">
      {/* Header */}
      <section>
        <nav className="text-xs text-[var(--color-muted)] mb-4">
          <Link to="/" className="hover:text-[var(--color-navy)] transition-colors">
            Home
          </Link>
          <span className="mx-2">/</span>
          <span className="text-[var(--color-navy)]">Alle producten</span>
        </nav>
        <h1
          className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-[var(--color-navy)]"
          style={{ fontFamily: 'Montserrat, sans-serif' }}
        >
          Alle producten
        </h1>
        <p className="mt-2 text-[var(--color-muted)] max-w-2xl">
          Het volledige HLTY-assortiment. Kies hieronder één of meerdere categorieën
          om sneller te vinden wat bij jou past.
        </p>
      </section>

      {/* Hoofdcategorie-tegels (multi-select) */}
      <section>
        <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--color-muted)] mb-4">
          Stap 1 — Kies één of meerdere hoofdcategorieën
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {MAIN_CATEGORIES.map((main) => {
            const meta = MAIN_META[main.id];
            const isActive = selectedMains.includes(main.id);
            const Icon = meta.icon;
            return (
              <button
                key={main.id}
                onClick={() => toggleMain(main.id)}
                className={`card p-6 text-left transition-all ${
                  isActive
                    ? 'ring-2 ring-[var(--color-primary)] shadow-lg'
                    : 'hover:shadow-md'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${meta.color}15` }}
                  >
                    <Icon className="w-6 h-6" style={{ color: meta.color }} />
                  </div>
                  <div className="flex-1">
                    <p
                      className={`text-lg font-bold ${
                        isActive ? 'text-[var(--color-primary-dark)]' : 'text-[var(--color-navy)]'
                      }`}
                      style={{ fontFamily: 'Montserrat, sans-serif' }}
                    >
                      {main.label}
                    </p>
                    <p className="text-xs text-[var(--color-muted)] mt-0.5">
                      {main.subs.length} sub-categorieën
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Sub-tegels (per geselecteerde main, gegroepeerd) */}
      <AnimatePresence initial={false}>
        {visibleSubGroups.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--color-muted)] mb-4">
              Stap 2 — Verfijn binnen je selectie (meerdere mogelijk)
            </h2>
            <div className="space-y-4">
              {visibleSubGroups.map((main) => (
                <div key={main.id}>
                  {visibleSubGroups.length > 1 && (
                    <p className="text-xs font-semibold text-[var(--color-muted)] mb-2">
                      Binnen {main.label}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {main.subs.map((sub) => {
                      const isOn = selectedSubs.includes(sub.id);
                      return (
                        <button
                          key={sub.id}
                          onClick={() => toggleSub(sub.id)}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                            isOn
                              ? 'bg-[var(--color-primary)] text-white shadow-md'
                              : 'glass text-[var(--color-navy)] hover:text-[var(--color-primary-dark)]'
                          }`}
                        >
                          {sub.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Mobile filter trigger */}
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
          onClear={clearAllSelections}
          dietOptions={DIET_OPTIONS}
          showCategoryFilter
          selectedMainCategories={selectedMains}
          selectedSubCategories={selectedSubs}
          onMainCategoriesChange={setMains}
          onSubCategoriesChange={setSubs}
        />
      </div>

      <div className="flex gap-8">
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
            onClear={clearAllSelections}
            dietOptions={DIET_OPTIONS}
            showCategoryFilter
            selectedMainCategories={selectedMains}
            selectedSubCategories={selectedSubs}
            onMainCategoriesChange={setMains}
            onSubCategoriesChange={setSubs}
          />
        </div>

        <div className="flex-1 min-w-0">
          {activeChips.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {activeChips.map((chip) => (
                <button
                  key={chip.id}
                  onClick={chip.onRemove}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary-dark)] text-xs font-medium hover:bg-[var(--color-primary)]/20 transition-colors"
                >
                  {chip.label}
                  <X className="w-3 h-3" />
                </button>
              ))}
              <button
                onClick={clearAllSelections}
                className="text-xs font-medium text-[var(--color-muted)] hover:text-[var(--color-navy)] transition-colors ml-1"
              >
                Wis alles
              </button>
            </div>
          )}

          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-[var(--color-muted)]">
              {loading
                ? 'Producten laden…'
                : `${filteredProducts.length} ${filteredProducts.length === 1 ? 'product' : 'producten'}`}
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="card p-0 animate-pulse">
                  <div className="aspect-square bg-[var(--color-muted)]/10" />
                  <div className="p-3 space-y-2">
                    <div className="h-3 w-1/3 bg-[var(--color-muted)]/15 rounded" />
                    <div className="h-4 w-3/4 bg-[var(--color-muted)]/15 rounded" />
                    <div className="h-4 w-1/4 bg-[var(--color-muted)]/15 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="card p-12 text-center">
              <p className="text-lg font-semibold text-[var(--color-navy)] mb-2">
                Geen producten gevonden
              </p>
              <p className="text-sm text-[var(--color-muted)] mb-6">
                Pas je selectie aan om meer producten te zien.
              </p>
              <button onClick={clearAllSelections} className="btn-secondary px-6 py-2 text-sm">
                Wis alle filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {visibleProducts.map((product, i) => (
                  <ProductCard key={product.id} product={product} index={i} />
                ))}
              </div>
              {hasMore && (
                <div className="mt-12 text-center">
                  <button
                    onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
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
    </div>
    </>
  );
}
