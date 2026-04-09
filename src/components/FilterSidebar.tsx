import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, X, SlidersHorizontal } from 'lucide-react';
import type { Product } from '../lib/shopify';

interface FilterSidebarProps {
  products: Product[];
  selectedBrands: string[];
  selectedIngredients: string[];
  onBrandsChange: (brands: string[]) => void;
  onIngredientsChange: (ingredients: string[]) => void;
  onClear: () => void;
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
    <label className="flex items-center gap-2 py-1 px-1 rounded-lg cursor-pointer hover:bg-black/[0.03] transition-colors group">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="w-4 h-4 rounded border-[var(--color-border)] text-[var(--color-primary)] accent-[var(--color-primary)] cursor-pointer"
      />
      <span className="text-sm text-[var(--color-navy)] flex-1 truncate group-hover:text-[var(--color-primary)] transition-colors">
        {label}
      </span>
      <span className="text-xs text-[var(--color-muted)] tabular-nums">{count}</span>
    </label>
  );
}

export default function FilterSidebar({
  products,
  selectedBrands,
  selectedIngredients,
  onBrandsChange,
  onIngredientsChange,
  onClear,
}: FilterSidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const hasFilters = selectedBrands.length > 0 || selectedIngredients.length > 0;

  const brands = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of products) {
      if (p.vendor) map.set(p.vendor, (map.get(p.vendor) ?? 0) + 1);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [products]);

  const ingredients = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of products) {
      for (const tag of p.tags) {
        if (tag.startsWith('INGR-')) {
          const name = tag.slice(5);
          map.set(name, (map.get(name) ?? 0) + 1);
        }
      }
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [products]);

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

      {brands.length > 0 && (
        <FilterSection title="Merk">
          {brands.map(([brand, count]) => (
            <CheckboxItem
              key={brand}
              label={brand}
              count={count}
              checked={selectedBrands.includes(brand)}
              onChange={() => toggleBrand(brand)}
            />
          ))}
        </FilterSection>
      )}

      {ingredients.length > 0 && (
        <FilterSection title="Ingrediënten">
          {ingredients.map(([ingredient, count]) => (
            <CheckboxItem
              key={ingredient}
              label={ingredient}
              count={count}
              checked={selectedIngredients.includes(ingredient)}
              onChange={() => toggleIngredient(ingredient)}
            />
          ))}
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
