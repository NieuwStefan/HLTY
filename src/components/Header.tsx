import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ShoppingBag, Menu, X, ChevronDown, ChevronRight, User } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useCustomer } from '../context/CustomerContext';
import {
  getMenu,
  menuItemToRoute,
  getAllBrands,
  BRAND_CATEGORIES,
  BRAND_CATEGORY_OTHER,
  type MenuItem,
  type Menu as MenuType,
  type BrandSummary,
} from '../lib/shopify';

export default function Header() {
  const { cart, openCart } = useCart();
  const { session, customer } = useCustomer();
  const displayFirstName = session?.firstName || customer?.firstName || '';
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [expandedSub, setExpandedSub] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/zoeken?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const hasChildren = (item: MenuItem) => item.items && item.items.length > 0;

  const toggleDropdown = (id: string) => {
    setActiveDropdown(activeDropdown === id ? null : id);
    setExpandedSub(null);
  };

  const toggleSub = (id: string) => {
    setExpandedSub(expandedSub === id ? null : id);
  };

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
                {menu?.items.map((topItem) => (
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

                    {/* Brands custom dropdown — same style as other dropdowns */}
                    <AnimatePresence>
                      {activeDropdown === topItem.id && isBrandsItem(topItem) && (
                        <motion.div
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 4 }}
                          transition={{ duration: 0.2, ease: 'easeOut' }}
                          className="absolute top-full left-0 mt-2 w-64 bg-white rounded-2xl shadow-lg border border-gray-100 p-3 max-h-[70vh] overflow-y-auto z-50"
                        >
                          <div className="space-y-0.5">
                            {brandGroups.map((group) => (
                              <div key={group.key}>
                                <button
                                  onClick={() => toggleSub(group.key)}
                                  className="w-full flex items-center justify-between px-3 py-2 text-[11px] font-bold uppercase tracking-widest text-[var(--color-primary)] hover:bg-[var(--color-primary)]/5 rounded-xl transition-colors"
                                >
                                  {group.label}
                                  <ChevronDown
                                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                                      expandedSub === group.key ? 'rotate-180' : ''
                                    }`}
                                  />
                                </button>

                                <AnimatePresence>
                                  {expandedSub === group.key && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: 'auto', opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      transition={{ duration: 0.2 }}
                                      className="overflow-hidden"
                                    >
                                      <div className="ml-2 pb-1 space-y-0.5">
                                        {group.brands.map((brand) => (
                                          <Link
                                            key={brand.handle}
                                            to={`/merken/${brand.handle}`}
                                            className="block px-3 py-1.5 text-sm text-[var(--color-navy)]/70 hover:text-[var(--color-navy)] hover:bg-[var(--color-primary)]/10 rounded-lg transition-colors"
                                            onClick={() => {
                                              setActiveDropdown(null);
                                              setExpandedSub(null);
                                            }}
                                          >
                                            {brand.name}
                                          </Link>
                                        ))}
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            ))}
                          </div>
                          {brands.length === 0 && (
                            <div className="p-4 text-center text-sm text-[var(--color-muted)]">
                              Merken laden…
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Dropdown for this specific item */}
                    <AnimatePresence>
                      {activeDropdown === topItem.id && hasChildren(topItem) && !isBrandsItem(topItem) && (
                        <motion.div
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 4 }}
                          transition={{ duration: 0.2, ease: 'easeOut' }}
                          className="absolute top-full left-0 mt-2 w-64 bg-white rounded-2xl shadow-lg border border-gray-100 p-3 max-h-[70vh] overflow-y-auto z-50"
                        >
                          <div className="space-y-0.5">
                            {topItem.items.map((subItem) => (
                              <div key={subItem.id}>
                                {hasChildren(subItem) ? (
                                  <>
                                    <button
                                      onClick={() => toggleSub(subItem.id)}
                                      className="w-full flex items-center justify-between px-3 py-2 text-[11px] font-bold uppercase tracking-widest text-[var(--color-primary)] hover:bg-[var(--color-primary)]/5 rounded-xl transition-colors"
                                    >
                                      {subItem.title}
                                      <ChevronDown
                                        className={`w-3.5 h-3.5 transition-transform duration-200 ${
                                          expandedSub === subItem.id ? 'rotate-180' : ''
                                        }`}
                                      />
                                    </button>

                                    <AnimatePresence>
                                      {expandedSub === subItem.id && (
                                        <motion.div
                                          initial={{ height: 0, opacity: 0 }}
                                          animate={{ height: 'auto', opacity: 1 }}
                                          exit={{ height: 0, opacity: 0 }}
                                          transition={{ duration: 0.2 }}
                                          className="overflow-hidden"
                                        >
                                          <div className="ml-2 pb-1 space-y-0.5">
                                            {subItem.items.map((child) => {
                                              const route = menuItemToRoute(child);
                                              return route ? (
                                                <Link
                                                  key={child.id}
                                                  to={route}
                                                  className="block px-3 py-1.5 text-sm text-[var(--color-navy)]/70 hover:text-[var(--color-navy)] hover:bg-[var(--color-primary)]/10 rounded-lg transition-colors"
                                                  onClick={() => {
                                                    setActiveDropdown(null);
                                                    setExpandedSub(null);
                                                  }}
                                                >
                                                  {child.title}
                                                </Link>
                                              ) : null;
                                            })}
                                          </div>
                                        </motion.div>
                                      )}
                                    </AnimatePresence>
                                  </>
                                ) : (
                                  (() => {
                                    const route = menuItemToRoute(subItem);
                                    return route ? (
                                      <Link
                                        to={route}
                                        className="block px-3 py-2 text-sm text-[var(--color-navy)]/70 hover:text-[var(--color-navy)] hover:bg-[var(--color-primary)]/10 rounded-xl transition-colors"
                                        onClick={() => {
                                          setActiveDropdown(null);
                                          setExpandedSub(null);
                                        }}
                                      >
                                        {subItem.title}
                                      </Link>
                                    ) : null;
                                  })()
                                )}
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
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
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex items-start justify-center pt-32"
            onClick={() => setSearchOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="glass rounded-2xl p-6 w-full max-w-xl mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <form onSubmit={handleSearch}>
                <div className="flex items-center gap-3">
                  <Search className="w-5 h-5 text-[var(--color-muted)]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Zoek producten, merken, ingrediënten..."
                    className="flex-1 bg-transparent text-lg font-medium text-[var(--color-navy)] placeholder:text-[var(--color-muted)] outline-none"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setSearchOpen(false)}
                    className="p-2 rounded-full hover:bg-black/5"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </form>
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
