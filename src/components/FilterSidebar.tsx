import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, X, SlidersHorizontal, Plus, Minus } from 'lucide-react';
import type { Product } from '../lib/shopify';
import Checkbox from './Checkbox';
import {
  MAIN_CATEGORIES,
  getMainCategory,
  handlesForMain,
  handlesForSubs,
  productMatchesHandles,
} from '../lib/product-categories';

const VISIBLE_ITEMS = 6;

function prettyLabel(s: string) {
  return s.replace(/-&-/g, ' & ').replace(/-/g, ' ');
}

interface FilterSidebarProps {
  products: Product[];
  /**
   * Per-section candidate sets for live counts. Each is the result of applying
   * every active filter *except* the section's own — so counts reflect "how many
   * remain if you tick this option, given everything else you've already chosen".
   */
  facetProducts: {
    brand: Product[];
    ingredient: Product[];
    diet: Product[];
    stock: Product[];
    category?: Product[];
  };
  selectedBrands: string[];
  selectedIngredients: string[];
  selectedDiets: string[];
  inStockOnly: boolean;
  onBrandsChange: (brands: string[]) => void;
  onIngredientsChange: (ingredients: string[]) => void;
  onDietsChange: (diets: string[]) => void;
  onInStockChange: (v: boolean) => void;
  onClear: () => void;
  dietOptions: { key: string; label: string; test: (tags: string[]) => boolean }[];

  // Optionele categorie-filter (niet aanwezig op alle pagina's)
  showCategoryFilter?: boolean;
  selectedMainCategories?: string[];
  selectedSubCategories?: string[];
  onMainCategoriesChange?: (mains: string[]) => void;
  onSubCategoriesChange?: (subs: string[]) => void;
}

function FilterSection({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-[var(--color-border)] pb-4">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full py-2 text-sm font-semibold text-[var(--color-navy)] hover:text-[var(--color-primary)] transition-colors"
      >
        {title}
        <ChevronDown
          className={`w-4 h-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pt-1 pb-1 space-y-1">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CheckboxItem({
  label,
  count,
  checked,
  onChange,
}: {
  label: string;
  count: number;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex items-center gap-2.5 py-1 px-1 rounded-lg cursor-pointer hover:bg-black/[0.03] transition-colors group">
      <Checkbox checked={checked} onChange={() => onChange()} />
      <span className="text-sm text-[var(--color-navy)] flex-1 truncate group-hover:text-[var(--color-primary)] transition-colors">
        {label}
      </span>
      <span className="text-xs text-[var(--color-muted)] tabular-nums">{count}</span>
    </label>
  );
}

export default function FilterSidebar({
  products,
  facetProducts,
  selectedBrands,
  selectedIngredients,
  selectedDiets,
  inStockOnly,
  onBrandsChange,
  onIngredientsChange,
  onDietsChange,
  onInStockChange,
  onClear,
  dietOptions,
  showCategoryFilter = false,
  selectedMainCategories = [],
  selectedSubCategories = [],
  onMainCategoriesChange,
  onSubCategoriesChange,
}: FilterSidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [brandsExpanded, setBrandsExpanded] = useState(false);
  const [ingredientsExpanded, setIngredientsExpanded] = useState(false);
  const hasFilters =
    selectedBrands.length > 0 ||
    selectedIngredients.length > 0 ||
    selectedDiets.length > 0 ||
    inStockOnly ||
    selectedMainCategories.length > 0 ||
    selectedSubCategories.length > 0;

  // Categorie-counts: aantal producten in het facet-set dat in elke main valt
  const mainCounts = useMemo(() => {
    const candidates = facetProducts.category ?? products;
    return MAIN_CATEGORIES.map((main) => {
      const handles = handlesForMain(main.id);
      const count = candidates.filter((p) =>
        productMatchesHandles(p.collections ?? [], handles),
      ).length;
      return { main, count };
    });
  }, [facetProducts.category, products]);

  const toggleMain = (mainId: string) => {
    if (!onMainCategoriesChange) return;
    const next = selectedMainCategories.includes(mainId)
      ? selectedMainCategories.filter((m) => m !== mainId)
      : [...selectedMainCategories, mainId];
    onMainCategoriesChange(next);
    // Bij uitzetten van een main: ook diens subs verwijderen
    if (selectedMainCategories.includes(mainId) && onSubCategoriesChange) {
      const main = getMainCategory(mainId);
      if (main) {
        const subIdsToRemove = new Set(main.subs.map((s) => s.id));
        onSubCategoriesChange(
          selectedSubCategories.filter((s) => !subIdsToRemove.has(s)),
        );
      }
    }
  };

  const toggleSub = (subId: string) => {
    if (!onSubCategoriesChange) return;
    onSubCategoriesChange(
      selectedSubCategories.includes(subId)
        ? selectedSubCategories.filter((s) => s !== subId)
        : [...selectedSubCategories, subId],
    );
  };

  // Sub-counts per main: hoeveel producten matchen een specifieke sub
  const subCountsByMain = useMemo(() => {
    const candidates = facetProducts.category ?? products;
    const map = new Map<string, Map<string, number>>();
    for (const main of MAIN_CATEGORIES) {
      const inner = new Map<string, number>();
      for (const sub of main.subs) {
        const count = candidates.filter((p) =>
          productMatchesHandles(p.collections ?? [], handlesForSubs(main.id, [sub.id])),
        ).length;
        inner.set(sub.id, count);
      }
      map.set(main.id, inner);
    }
    return map;
  }, [facetProducts.category, products]);

  const brands = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of facetProducts.brand) {
      if (p.vendor) map.set(p.vendor, (map.get(p.vendor) ?? 0) + 1);
    }
    // Keep already-selected brands visible even if their candidate count is 0
    for (const b of selectedBrands) if (!map.has(b)) map.set(b, 0);
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [facetProducts.brand, selectedBrands]);

  const ingredients = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of facetProducts.ingredient) {
      for (const tag of p.tags) {
        if (tag.startsWith('INGR-')) {
          const name = tag.slice(5);
          map.set(name, (map.get(name) ?? 0) + 1);
        }
      }
    }
    for (const i of selectedIngredients) if (!map.has(i)) map.set(i, 0);
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [facetProducts.ingredient, selectedIngredients]);

  const inStockCount = useMemo(
    () => facetProducts.stock.filter((p) => p.variants.some((v) => v.availableForSale)).length,
    [facetProducts.stock]
  );
  const hasOutOfStock = useMemo(
    () => products.some((p) => !p.variants.some((v) => v.availableForSale)),
    [products]
  );

  const dietCounts = useMemo(() => {
    return dietOptions.map((opt) => ({
      ...opt,
      count: facetProducts.diet.filter((p) => opt.test(p.tags)).length,
    }));
  }, [facetProducts.diet, dietOptions]);

  const toggleBrand = (brand: string) => {
    onBrandsChange(
      selectedBrands.includes(brand)
        ? selectedBrands.filter((b) => b !== brand)
        : [...selectedBrands, brand]
    );
  };

  const toggleIngredient = (ingredient: string) => {
    onIngredientsChange(
      selectedIngredients.includes(ingredient)
        ? selectedIngredients.filter((i) => i !== ingredient)
        : [...selectedIngredients, ingredient]
    );
  };

  const toggleDiet = (key: string) => {
    onDietsChange(
      selectedDiets.includes(key)
        ? selectedDiets.filter((d) => d !== key)
        : [...selectedDiets, key]
    );
  };

  const visibleDiets = dietCounts.filter((d) => d.count > 0);

  const filterContent = (
    <div className="space-y-2">
      {hasFilters && (
        <button
          onClick={onClear}
          className="flex items-center gap-1.5 text-xs font-medium text-[var(--color-primary)] hover:text-[var(--color-primary-dark)] transition-colors mb-2"
        >
          <X className="w-3.5 h-3.5" />
          Wis alle filters
        </button>
      )}

      {showCategoryFilter && (
        <FilterSection title="Categorie">
          {/* Hoofdcategorieën */}
          {mainCounts.map(({ main, count }) => (
            <CheckboxItem
              key={main.id}
              label={main.label}
              count={count}
              checked={selectedMainCategories.includes(main.id)}
              onChange={() => toggleMain(main.id)}
            />
          ))}

          {/* Sub-categorieën per geselecteerde main */}
          {selectedMainCategories.map((mainId) => {
            const main = getMainCategory(mainId);
            if (!main) return null;
            const counts = subCountsByMain.get(mainId);
            return (
              <div key={mainId} className="mt-3 pl-3 border-l-2 border-[var(--color-primary)]/30">
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)] mb-1.5">
                  Binnen {main.label}
                </p>
                {main.subs.map((sub) => (
                  <CheckboxItem
                    key={sub.id}
                    label={sub.label}
                    count={counts?.get(sub.id) ?? 0}
                    checked={selectedSubCategories.includes(sub.id)}
                    onChange={() => toggleSub(sub.id)}
                  />
                ))}
              </div>
            );
          })}
        </FilterSection>
      )}

      {brands.length > 0 && (
        <FilterSection title="Merk">
          {(brandsExpanded ? brands : brands.slice(0, VISIBLE_ITEMS)).map(([brand, count]) => (
            <CheckboxItem
              key={brand}
              label={prettyLabel(brand)}
              count={count}
              checked={selectedBrands.includes(brand)}
              onChange={() => toggleBrand(brand)}
            />
          ))}
          {brands.length > VISIBLE_ITEMS && (
            <button
              onClick={() => setBrandsExpanded(!brandsExpanded)}
              className="flex items-center gap-1 px-1 mt-1 text-xs font-medium text-[var(--color-primary)] hover:text-[var(--color-primary-dark)] transition-colors"
            >
              {brandsExpanded ? (
                <>
                  <Minus className="w-3 h-3" /> Toon minder
                </>
              ) : (
                <>
                  <Plus className="w-3 h-3" /> Toon {brands.length - VISIBLE_ITEMS} meer
                </>
              )}
            </button>
          )}
        </FilterSection>
      )}

      {hasOutOfStock && (
        <FilterSection title="Beschikbaarheid">
          <CheckboxItem
            label="Alleen op voorraad"
            count={inStockCount}
            checked={inStockOnly}
            onChange={() => onInStockChange(!inStockOnly)}
          />
        </FilterSection>
      )}

      {visibleDiets.length > 0 && (
        <FilterSection title="Dieet & Lifestyle">
          {visibleDiets.map(({ key, label, count }) => (
            <CheckboxItem
              key={key}
              label={label}
              count={count}
              checked={selectedDiets.includes(key)}
              onChange={() => toggleDiet(key)}
            />
          ))}
        </FilterSection>
      )}

      {ingredients.length > 0 && (
        <FilterSection title="Ingrediënten">
          {(ingredientsExpanded ? ingredients : ingredients.slice(0, VISIBLE_ITEMS)).map(([ingredient, count]) => (
            <CheckboxItem
              key={ingredient}
              label={prettyLabel(ingredient)}
              count={count}
              checked={selectedIngredients.includes(ingredient)}
              onChange={() => toggleIngredient(ingredient)}
            />
          ))}
          {ingredients.length > VISIBLE_ITEMS && (
            <button
              onClick={() => setIngredientsExpanded(!ingredientsExpanded)}
              className="flex items-center gap-1 px-1 mt-1 text-xs font-medium text-[var(--color-primary)] hover:text-[var(--color-primary-dark)] transition-colors"
            >
              {ingredientsExpanded ? (
                <>
                  <Minus className="w-3 h-3" /> Toon minder
                </>
              ) : (
                <>
                  <Plus className="w-3 h-3" /> Toon {ingredients.length - VISIBLE_ITEMS} meer
                </>
              )}
            </button>
          )}
        </FilterSection>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <div className="lg:hidden mb-4">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="btn-secondary px-4 py-2.5 text-sm gap-2 w-full justify-center"
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters
          {hasFilters && (
            <span className="ml-1 px-1.5 py-0.5 bg-[var(--color-primary)] text-white text-[10px] font-bold rounded-full leading-none">
              {selectedBrands.length + selectedIngredients.length}
            </span>
          )}
        </button>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="card mt-3 p-4">{filterContent}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-60 shrink-0">
        <div className="card p-4 sticky top-[calc(var(--header-h,80px)+1rem)]">
          <h3
            className="text-sm font-bold text-[var(--color-navy)] uppercase tracking-wider mb-3"
            style={{ fontFamily: 'Montserrat' }}
          >
            Filters
          </h3>
          {filterContent}
        </div>
      </aside>
    </>
  );
}
