import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ShoppingBag, Menu, X, ChevronDown, ChevronRight, User, Loader2, Tag, FolderOpen } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useCustomer } from '../context/CustomerContext';
import {
  getMenu,
  menuItemToRoute,
  getAllBrands,
  predictiveSearch,
  formatPrice,
  BRAND_CATEGORIES,
  BRAND_CATEGORY_OTHER,
  type MenuItem,
  type Menu as MenuType,
  type BrandSummary,
  type PredictiveSearchResult,
} from '../lib/shopify';
import { formatProductTitle } from '../lib/product-title';

export default function Header() {
  const { cart, openCart } = useCart();
  const { session, customer } = useCustomer();
  const displayFirstName = session?.firstName || customer?.firstName || '';
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [expandedSub, setExpandedSub] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PredictiveSearchResult | null>(null);
  const [matchedBrands, setMatchedBrands] = useState<BrandSummary[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchSelectedIdx, setSearchSelectedIdx] = useState(-1);
  const [menu, setMenu] = useState<MenuType | null>(null);
  const [brands, setBrands] = useState<BrandSummary[]>([]);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const [mobileSubExpanded, setMobileSubExpanded] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const headerRef = useRef<HTMLDivElement>(null);

  const totalItems = cart?.totalQuantity || 0;

  useEffect(() => {
    getMenu('main-menu').then(setMenu).catch(console.error);
    getAllBrands().then(setBrands).catch(console.error);
  }, []);

  // Group brands by category for the dropdown.
  const brandGroups = (() => {
    const order = [
      ...BRAND_CATEGORIES.map((c) => ({ key: c.key, label: c.label })),
      BRAND_CATEGORY_OTHER,
    ];
    const map = new Map<string, { key: string; label: string; brands: BrandSummary[] }>();
    for (const { key, label } of order) map.set(key, { key, label, brands: [] });
    for (const b of brands) {
      const g = map.get(b.categoryKey) ?? map.get(BRAND_CATEGORY_OTHER.key)!;
      g.brands.push(b);
    }
    return [...map.values()].filter((g) => g.brands.length > 0);
  })();

  const isBrandsItem = (item: MenuItem) => item.title.trim().toLowerCase() === 'merken';

  // Close dropdown on route change
  useEffect(() => {
    setActiveDropdown(null);
    setExpandedSub(null);
  }, [location.pathname]);

  // Close desktop dropdown when clicking outside header
  useEffect(() => {
    if (!activeDropdown) return;
    const handleClick = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
        setExpandedSub(null);
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [activeDropdown]);

  // Vlakke lijst van alle suggesties in volgorde — gebruikt door pijltjes-
  // navigatie zodat ↑/↓ door alle secties heen werkt.
  const searchSuggestionTargets: { kind: 'product' | 'brand' | 'collection'; to: string }[] = (() => {
    const out: { kind: 'product' | 'brand' | 'collection'; to: string }[] = [];
    for (const p of searchResults?.products ?? []) {
      out.push({ kind: 'product', to: `/product/${p.handle}` });
    }
    for (const b of matchedBrands) {
      out.push({ kind: 'brand', to: `/merken/${b.handle}` });
    }
    for (const c of searchResults?.collections ?? []) {
      out.push({ kind: 'collection', to: `/collectie/${c.handle}` });
    }
    return out;
  })();

  const searchHasResults =
    searchSuggestionTargets.length > 0;
  const searchHasQuery = searchQuery.trim().length >= 2;
  const searchShowEmptyState = searchHasQuery && !searchLoading && !searchHasResults;

  const closeSearch = () => setSearchOpen(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    // Als een suggestie geselecteerd is via toetsenbord, navigeer daarheen.
    if (searchSelectedIdx >= 0 && searchSelectedIdx < searchSuggestionTargets.length) {
      navigate(searchSuggestionTargets[searchSelectedIdx].to);
      closeSearch();
      return;
    }
    navigate(`/zoeken?q=${encodeURIComponent(q)}`);
    closeSearch();
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!searchHasResults) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSearchSelectedIdx((i) =>
        i + 1 >= searchSuggestionTargets.length ? 0 : i + 1,
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSearchSelectedIdx((i) =>
        i <= 0 ? searchSuggestionTargets.length - 1 : i - 1,
      );
    } else if (e.key === 'Escape') {
      closeSearch();
    }
  };

  const SEARCH_QUICK_SUGGESTIONS = [
    'Vitamine D',
    'Magnesium',
    'Probiotica',
    'Herstel',
    'Omega-3',
  ];

  const hasChildren = (item: MenuItem) => item.items && item.items.length > 0;

  const toggleDropdown = (id: string) => {
    setActiveDropdown(activeDropdown === id ? null : id);
    setExpandedSub(null);
  };

  // Debounced predictive search — fires when query >= 2 chars. Also filters
  // brands locally (Shopify's predictiveSearch doesn't return vendors).
  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setSearchResults(null);
      setMatchedBrands([]);
      setSearchLoading(false);
      setSearchSelectedIdx(-1);
      return;
    }
    setSearchLoading(true);
    const lower = q.toLowerCase();
    setMatchedBrands(
      brands.filter((b) => b.name.toLowerCase().includes(lower)).slice(0, 3),
    );
    const timer = setTimeout(() => {
      predictiveSearch(q)
        .then((res) => {
          setSearchResults(res);
          setSearchSelectedIdx(-1);
        })
        .catch(() => setSearchResults({ products: [], collections: [] }))
        .finally(() => setSearchLoading(false));
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery, brands]);

  // Reset search state when modal closes
  useEffect(() => {
    if (!searchOpen) {
      setSearchQuery('');
      setSearchResults(null);
      setMatchedBrands([]);
      setSearchLoading(false);
      setSearchSelectedIdx(-1);
    }
  }, [searchOpen]);

  // Keep --header-h CSS var in sync with actual header height
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      document.documentElement.style.setProperty('--header-h', `${el.offsetHeight}px`);
    });
    observer.observe(el);
    // Set immediately
    document.documentElement.style.setProperty('--header-h', `${el.offsetHeight}px`);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <header ref={headerRef} className="fixed top-0 left-0 right-0 z-50">
        <div className="mx-auto max-w-[1400px] px-4 pt-3">
          {/* Main header bar */}
          <div className="glass rounded-[20px] px-6 py-3">
            <div className="flex items-center justify-between gap-6">
              {/* Logo */}
              <Link to="/" className="flex-shrink-0" onClick={() => setActiveDropdown(null)}>
                <img src="/logo.png" alt="HLTY" className="h-8" />
              </Link>

              {/* Desktop Nav Items */}
              <nav className="hidden lg:flex items-center gap-1">
                {menu?.items.map((topItem, idx, arr) => {
                  // Bepaal uitlijning van het uitvouw-paneel op basis van button-
                  // positie in de nav, zodat het paneel niet over viewport-randen
                  // valt. Eerste twee items → links, laatste twee → rechts, midden
                  // → centered onder de button.
                  const total = arr.length;
                  const align: 'left' | 'center' | 'right' =
                    idx < 2 ? 'left' : idx >= total - 2 ? 'right' : 'center';
                  return (
                  <div key={topItem.id} className="relative">
                    {isBrandsItem(topItem) ? (
                      <button
                        onClick={() => toggleDropdown(topItem.id)}
                        className={`flex items-center gap-1 px-3 py-2 text-sm font-medium transition-colors rounded-full ${
                          activeDropdown === topItem.id
                            ? 'text-[var(--color-navy)] bg-black/5'
                            : 'text-[var(--color-navy)]/80 hover:text-[var(--color-navy)] hover:bg-black/5'
                        }`}
                      >
                        {topItem.title}
                        <ChevronDown
                          className={`w-3.5 h-3.5 transition-transform duration-200 ${
                            activeDropdown === topItem.id ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                    ) : hasChildren(topItem) ? (
                      <button
                        onClick={() => toggleDropdown(topItem.id)}
                        className={`flex items-center gap-1 px-3 py-2 text-sm font-medium transition-colors rounded-full ${
                          activeDropdown === topItem.id
                            ? 'text-[var(--color-navy)] bg-black/5'
                            : 'text-[var(--color-navy)]/80 hover:text-[var(--color-navy)] hover:bg-black/5'
                        }`}
                      >
                        {topItem.title}
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${
                          activeDropdown === topItem.id ? 'rotate-180' : ''
                        }`} />
                      </button>
                    ) : (
                      <Link
                        to={menuItemToRoute(topItem) || '/'}
                        className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-[var(--color-navy)]/80 hover:text-[var(--color-navy)] transition-colors rounded-full hover:bg-black/5"
                        onClick={() => setActiveDropdown(null)}
                      >
                        {topItem.title}
                      </Link>
                    )}

                    {/* Unified mega-menu — works for brands and standard menu items */}
                    <AnimatePresence>
                      {activeDropdown === topItem.id &&
                        (hasChildren(topItem) || isBrandsItem(topItem)) && (
                          <DesktopMegaMenu
                            topItem={topItem}
                            isBrands={isBrandsItem(topItem)}
                            brandGroups={brandGroups}
                            brandsLoaded={brands.length > 0}
                            align={align}
                            onClose={() => {
                              setActiveDropdown(null);
                              setExpandedSub(null);
                            }}
                          />
                        )}
                    </AnimatePresence>
                  </div>
                  );
                })}
              </nav>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSearchOpen(true)}
                  className="p-2.5 rounded-full hover:bg-black/5 transition-colors"
                  aria-label="Zoeken"
                >
                  <Search className="w-5 h-5 text-[var(--color-navy)]" />
                </button>

                <Link
                  to="/account"
                  className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-full hover:bg-black/5 transition-colors"
                  aria-label="Account"
                  onClick={() => setActiveDropdown(null)}
                >
                  <User className="w-5 h-5 text-[var(--color-navy)]" />
                  {displayFirstName && (
                    <span className="text-sm font-medium text-[var(--color-navy)] max-w-[120px] truncate">
                      Hoi {displayFirstName}
                    </span>
                  )}
                </Link>

                <button
                  onClick={openCart}
                  className="relative p-2.5 rounded-full hover:bg-black/5 transition-colors"
                  aria-label="Winkelwagen"
                >
                  <ShoppingBag className="w-5 h-5 text-[var(--color-navy)]" />
                  {totalItems > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-[var(--color-primary)] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {totalItems}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setMobileOpen(true)}
                  className="p-2.5 rounded-full hover:bg-black/5 transition-colors lg:hidden"
                  aria-label="Menu"
                >
                  <Menu className="w-5 h-5 text-[var(--color-navy)]" />
                </button>
              </div>
            </div>
          </div>

        </div>
      </header>

      {/* Search Overlay */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex items-start justify-center pt-24 px-4"
            onClick={closeSearch}
          >
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="glass rounded-2xl w-full max-w-2xl max-h-[calc(100vh-8rem)] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <form onSubmit={handleSearch} className="flex-shrink-0 px-6 py-5 border-b border-black/5">
                <div className="flex items-center gap-3">
                  {searchLoading ? (
                    <Loader2 className="w-5 h-5 text-[var(--color-primary)] animate-spin" />
                  ) : (
                    <Search className="w-5 h-5 text-[var(--color-muted)]" />
                  )}
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleSearchKeyDown}
                    placeholder="Zoek producten, merken, ingrediënten..."
                    className="flex-1 bg-transparent text-lg font-medium text-[var(--color-navy)] placeholder:text-[var(--color-muted)] outline-none"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={closeSearch}
                    className="p-2 rounded-full hover:bg-black/5"
                    aria-label="Sluiten"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </form>

              <div className="flex-1 overflow-y-auto">
                {!searchHasQuery && (
                  <div className="px-6 py-5">
                    <h4 className="text-[11px] font-bold uppercase tracking-widest text-[var(--color-primary)] mb-3">
                      Probeer eens
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {SEARCH_QUICK_SUGGESTIONS.map((q) => (
                        <button
                          key={q}
                          type="button"
                          onClick={() => setSearchQuery(q)}
                          className="px-3 py-1.5 text-sm rounded-full bg-black/5 text-[var(--color-navy)]/80 hover:bg-[var(--color-primary)]/10 hover:text-[var(--color-navy)] transition-colors"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {searchShowEmptyState && (
                  <div className="px-6 py-8 text-center">
                    <p className="text-sm text-[var(--color-muted)]">
                      Geen resultaten voor <span className="font-semibold text-[var(--color-navy)]">"{searchQuery.trim()}"</span>.
                    </p>
                    <Link
                      to="/alle-producten"
                      onClick={closeSearch}
                      className="mt-3 inline-block text-sm font-semibold text-[var(--color-primary)] hover:underline"
                    >
                      Bekijk alle producten →
                    </Link>
                  </div>
                )}

                {searchHasQuery && searchHasResults && (
                  <div className="py-2">
                    {(searchResults?.products?.length ?? 0) > 0 && (
                      <section className="px-3 py-2">
                        <h4 className="px-3 mb-1.5 text-[11px] font-bold uppercase tracking-widest text-[var(--color-primary)]">
                          Producten
                        </h4>
                        <ul>
                          {searchResults!.products.map((p, i) => {
                            const idx = i;
                            const active = idx === searchSelectedIdx;
                            return (
                              <li key={p.id}>
                                <Link
                                  to={`/product/${p.handle}`}
                                  onClick={closeSearch}
                                  onMouseEnter={() => setSearchSelectedIdx(idx)}
                                  className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-colors ${
                                    active ? 'bg-[var(--color-primary)]/10' : 'hover:bg-black/[0.03]'
                                  }`}
                                >
                                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-white border border-[var(--color-border)] flex-shrink-0">
                                    {p.image ? (
                                      <img
                                        src={p.image.url}
                                        alt=""
                                        className="w-full h-full object-contain p-1"
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-[var(--color-muted)]">
                                        <ShoppingBag className="w-5 h-5 opacity-30" />
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-primary)]">
                                      {p.vendor}
                                    </p>
                                    <p className="text-sm font-medium text-[var(--color-navy)] truncate">
                                      {formatProductTitle(p.title, p.vendor)}
                                    </p>
                                  </div>
                                  <span className="text-sm font-bold text-[var(--color-navy)] flex-shrink-0">
                                    {formatPrice(p.price)}
                                  </span>
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      </section>
                    )}

                    {matchedBrands.length > 0 && (
                      <section className="px-3 py-2 border-t border-black/5">
                        <h4 className="px-3 mb-1.5 text-[11px] font-bold uppercase tracking-widest text-[var(--color-primary)]">
                          Merken
                        </h4>
                        <ul>
                          {matchedBrands.map((b, i) => {
                            const idx = (searchResults?.products?.length ?? 0) + i;
                            const active = idx === searchSelectedIdx;
                            return (
                              <li key={b.handle}>
                                <Link
                                  to={`/merken/${b.handle}`}
                                  onClick={closeSearch}
                                  onMouseEnter={() => setSearchSelectedIdx(idx)}
                                  className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-colors ${
                                    active ? 'bg-[var(--color-primary)]/10' : 'hover:bg-black/[0.03]'
                                  }`}
                                >
                                  <div className="w-10 h-10 rounded-lg bg-[var(--color-primary)]/10 flex items-center justify-center flex-shrink-0">
                                    <Tag className="w-4 h-4 text-[var(--color-primary)]" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-[var(--color-navy)] truncate">
                                      {b.name}
                                    </p>
                                    <p className="text-xs text-[var(--color-muted)]">
                                      {b.count} {b.count === 1 ? 'product' : 'producten'}
                                    </p>
                                  </div>
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      </section>
                    )}

                    {(searchResults?.collections?.length ?? 0) > 0 && (
                      <section className="px-3 py-2 border-t border-black/5">
                        <h4 className="px-3 mb-1.5 text-[11px] font-bold uppercase tracking-widest text-[var(--color-primary)]">
                          Categorieën
                        </h4>
                        <ul>
                          {searchResults!.collections.map((c, i) => {
                            const idx =
                              (searchResults?.products?.length ?? 0) +
                              matchedBrands.length +
                              i;
                            const active = idx === searchSelectedIdx;
                            return (
                              <li key={c.id}>
                                <Link
                                  to={`/collectie/${c.handle}`}
                                  onClick={closeSearch}
                                  onMouseEnter={() => setSearchSelectedIdx(idx)}
                                  className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-colors ${
                                    active ? 'bg-[var(--color-primary)]/10' : 'hover:bg-black/[0.03]'
                                  }`}
                                >
                                  <div className="w-10 h-10 rounded-lg bg-[var(--color-primary)]/10 flex items-center justify-center flex-shrink-0">
                                    <FolderOpen className="w-4 h-4 text-[var(--color-primary)]" />
                                  </div>
                                  <p className="text-sm font-medium text-[var(--color-navy)] truncate">
                                    {c.title}
                                  </p>
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      </section>
                    )}
                  </div>
                )}
              </div>

              {searchHasQuery && (
                <div className="flex-shrink-0 px-6 py-3 border-t border-black/5 bg-white/50">
                  <button
                    type="button"
                    onClick={(e) => handleSearch(e as unknown as React.FormEvent)}
                    className="w-full text-left text-xs text-[var(--color-muted)] hover:text-[var(--color-navy)] transition-colors flex items-center justify-between"
                  >
                    <span>
                      Druk <kbd className="px-1.5 py-0.5 rounded bg-black/5 font-mono text-[10px]">Enter</kbd> voor alle resultaten
                    </span>
                    <span className="text-[var(--color-primary)] font-semibold">→</span>
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileOpen(false)}
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute right-0 top-0 bottom-0 w-[320px] bg-white/95 backdrop-blur-xl p-6 overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-8">
                <img src="/logo.png" alt="HLTY" className="h-7" />
                <button onClick={() => setMobileOpen(false)} className="p-2 rounded-full hover:bg-black/5">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-1">
                {menu?.items.map((topItem) => (
                  <div key={topItem.id}>
                    {isBrandsItem(topItem) ? (
                      <>
                        <button
                          onClick={() => {
                            setMobileExpanded(mobileExpanded === topItem.id ? null : topItem.id);
                            setMobileSubExpanded(null);
                          }}
                          className="w-full flex items-center justify-between px-3 py-3 text-sm font-semibold text-[var(--color-navy)] hover:bg-black/5 rounded-xl transition-colors"
                        >
                          {topItem.title}
                          <ChevronDown
                            className={`w-4 h-4 text-[var(--color-muted)] transition-transform ${
                              mobileExpanded === topItem.id ? 'rotate-180' : ''
                            }`}
                          />
                        </button>
                        <AnimatePresence>
                          {mobileExpanded === topItem.id && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden ml-2"
                            >
                              {brandGroups.map((group) => (
                                <div key={group.key} className="mt-2">
                                  <button
                                    onClick={() =>
                                      setMobileSubExpanded(
                                        mobileSubExpanded === group.key ? null : group.key
                                      )
                                    }
                                    className="w-full flex items-center justify-between px-3 py-2 text-[11px] font-bold uppercase tracking-widest text-[var(--color-primary)] hover:bg-[var(--color-primary)]/5 rounded-lg transition-colors"
                                  >
                                    {group.label}
                                    <ChevronRight
                                      className={`w-3.5 h-3.5 transition-transform ${
                                        mobileSubExpanded === group.key ? 'rotate-90' : ''
                                      }`}
                                    />
                                  </button>
                                  <AnimatePresence>
                                    {mobileSubExpanded === group.key && (
                                      <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.15 }}
                                        className="overflow-hidden ml-3"
                                      >
                                        {group.brands.map((b) => (
                                          <Link
                                            key={b.handle}
                                            to={`/merken/${b.handle}`}
                                            onClick={() => setMobileOpen(false)}
                                            className="block px-3 py-2 text-sm text-[var(--color-navy)]/70 hover:text-[var(--color-navy)] hover:bg-[var(--color-primary)]/10 rounded-lg transition-colors"
                                          >
                                            {b.name}
                                          </Link>
                                        ))}
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </>
                    ) : hasChildren(topItem) ? (
                      <button
                        onClick={() => {
                          setMobileExpanded(mobileExpanded === topItem.id ? null : topItem.id);
                          setMobileSubExpanded(null);
                        }}
                        className="w-full flex items-center justify-between px-3 py-3 text-sm font-semibold text-[var(--color-navy)] hover:bg-black/5 rounded-xl transition-colors"
                      >
                        {topItem.title}
                        <ChevronDown
                          className={`w-4 h-4 text-[var(--color-muted)] transition-transform ${
                            mobileExpanded === topItem.id ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                    ) : (
                      <Link
                        to={menuItemToRoute(topItem) || '/'}
                        className="block px-3 py-3 text-sm font-semibold text-[var(--color-navy)] hover:bg-black/5 rounded-xl transition-colors"
                        onClick={() => setMobileOpen(false)}
                      >
                        {topItem.title}
                      </Link>
                    )}

                    <AnimatePresence>
                      {mobileExpanded === topItem.id && hasChildren(topItem) && !isBrandsItem(topItem) && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden ml-2"
                        >
                          {topItem.items.map((subItem) => (
                            <div key={subItem.id}>
                              {hasChildren(subItem) ? (
                                <>
                                  <button
                                    onClick={() =>
                                      setMobileSubExpanded(mobileSubExpanded === subItem.id ? null : subItem.id)
                                    }
                                    className="w-full flex items-center justify-between px-3 py-2.5 text-[11px] font-bold uppercase tracking-widest text-[var(--color-primary)] hover:bg-[var(--color-primary)]/5 rounded-lg transition-colors"
                                  >
                                    {subItem.title}
                                    <ChevronRight
                                      className={`w-3.5 h-3.5 transition-transform ${
                                        mobileSubExpanded === subItem.id ? 'rotate-90' : ''
                                      }`}
                                    />
                                  </button>

                                  <AnimatePresence>
                                    {mobileSubExpanded === subItem.id && (
                                      <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.15 }}
                                        className="overflow-hidden ml-3"
                                      >
                                        {subItem.items.map((child) => {
                                          const route = menuItemToRoute(child);
                                          return route ? (
                                            <Link
                                              key={child.id}
                                              to={route}
                                              className="block px-3 py-2 text-sm text-[var(--color-navy)]/70 hover:text-[var(--color-navy)] hover:bg-[var(--color-primary)]/10 rounded-lg transition-colors"
                                              onClick={() => setMobileOpen(false)}
                                            >
                                              {child.title}
                                            </Link>
                                          ) : null;
                                        })}
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </>
                              ) : (
                                (() => {
                                  const route = menuItemToRoute(subItem);
                                  return route ? (
                                    <Link
                                      key={subItem.id}
                                      to={route}
                                      className="block px-3 py-2 text-sm text-[var(--color-navy)]/70 hover:text-[var(--color-navy)] hover:bg-[var(--color-primary)]/10 rounded-lg transition-colors"
                                      onClick={() => setMobileOpen(false)}
                                    >
                                      {subItem.title}
                                    </Link>
                                  ) : null;
                                })()
                              )}
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-black/10">
                <Link
                  to="/account"
                  className="flex items-center gap-3 px-3 py-3 text-sm font-semibold text-[var(--color-navy)] hover:bg-black/5 rounded-xl transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  <User className="w-5 h-5" />
                  Mijn account
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ---------- Desktop Mega-menu ----------

type MegaLink = { id: string; title: string; to: string };
type MegaColumn = { key: string; label: string; items: MegaLink[] };

interface DesktopMegaMenuProps {
  topItem: MenuItem;
  isBrands: boolean;
  brandGroups: { key: string; label: string; brands: BrandSummary[] }[];
  brandsLoaded: boolean;
  align: 'left' | 'center' | 'right';
  onClose: () => void;
}

function DesktopMegaMenu({
  topItem,
  isBrands,
  brandGroups,
  brandsLoaded,
  align,
  onClose,
}: DesktopMegaMenuProps) {
  const columns: MegaColumn[] = [];
  const flatItems: MegaLink[] = [];

  if (isBrands) {
    for (const g of brandGroups) {
      columns.push({
        key: g.key,
        label: g.label,
        items: g.brands.map((b) => ({
          id: b.handle,
          title: b.name,
          to: `/merken/${b.handle}`,
        })),
      });
    }
  } else {
    for (const sub of topItem.items) {
      if (sub.items && sub.items.length > 0) {
        const subRoutes: MegaLink[] = sub.items
          .map((c) => {
            const route = menuItemToRoute(c);
            return route ? { id: c.id, title: c.title, to: route } : null;
          })
          .filter((x): x is MegaLink => x !== null);
        if (subRoutes.length > 0) {
          columns.push({ key: sub.id, label: sub.title, items: subRoutes });
        }
      } else {
        const route = menuItemToRoute(sub);
        if (route) flatItems.push({ id: sub.id, title: sub.title, to: route });
      }
    }
  }

  const isLoading = isBrands && !brandsLoaded;
  const isFlat = !isLoading && columns.length === 0 && flatItems.length > 0;
  // Merken houden we als breed mega-menu (5 kolommen op één regel) zodat alle
  // merken in één oogopslag zichtbaar zijn. Andere mega-menu's hebben max 3
  // kolommen per regel (wraps bij meer).
  const isWide = isBrands;
  const colCount = columns.length;
  const colsClass = isWide
    ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5'
    : colCount <= 1
      ? 'grid-cols-1'
      : colCount === 2
        ? 'grid-cols-1 sm:grid-cols-2'
        : 'grid-cols-2 sm:grid-cols-3';

  const panelWidth = isFlat
    ? 'w-[min(360px,calc(100vw-2rem))]'
    : isWide
      ? 'w-[min(1100px,calc(100vw-2rem))]'
      : colCount === 1
        ? 'w-[min(360px,calc(100vw-2rem))]'
        : colCount === 2
          ? 'w-[min(560px,calc(100vw-2rem))]'
          : 'w-[min(780px,calc(100vw-2rem))]';

  const alignClass =
    align === 'left'
      ? 'left-0'
      : align === 'right'
        ? 'right-0'
        : 'left-1/2 -translate-x-1/2';

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`absolute top-full ${alignClass} mt-2 ${panelWidth} rounded-[20px] p-4 max-h-[75vh] overflow-y-auto z-50 border border-white/40`}
      style={{
        background: 'rgba(255, 255, 255, 0.35)',
        backdropFilter: 'blur(28px) saturate(1.8)',
        WebkitBackdropFilter: 'blur(28px) saturate(1.8)',
        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.08)',
      }}
    >
      {isLoading ? (
        <div className="p-8 text-center text-sm text-[var(--color-muted)]">
          Merken laden…
        </div>
      ) : isFlat ? (
        <div
          className="rounded-2xl p-3 shadow-[0_4px_12px_rgba(0,0,0,0.05)]"
          style={{ backgroundColor: '#ffffff' }}
        >
          <ul className="space-y-0.5">
            {flatItems.map((item) => (
              <li key={item.id}>
                <Link
                  to={item.to}
                  onClick={onClose}
                  className="block px-3 py-2 text-sm text-[var(--color-navy)]/80 hover:text-[var(--color-navy)] hover:bg-[var(--color-primary)]/10 rounded-lg transition-colors"
                >
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className={`grid ${colsClass} gap-3`}>
          {columns.map((col) => (
            <div
              key={col.key}
              className="min-w-0 rounded-2xl p-4 shadow-[0_4px_12px_rgba(0,0,0,0.05)]"
              style={{ backgroundColor: '#ffffff' }}
            >
              <div className="min-h-[2.5rem] pb-2 mb-3 border-b border-[var(--color-primary)]/20">
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-[var(--color-primary)] leading-snug">
                  {col.label}
                </h3>
              </div>
              <ul className="space-y-1">
                {col.items.map((item) => (
                  <li key={item.id}>
                    <Link
                      to={item.to}
                      onClick={onClose}
                      className="block px-2 py-1.5 text-sm text-[var(--color-navy)]/70 hover:text-[var(--color-navy)] hover:bg-[var(--color-primary)]/10 rounded-lg transition-colors truncate"
                      title={item.title}
                    >
                      {item.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
