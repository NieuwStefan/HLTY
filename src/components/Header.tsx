import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ShoppingBag, Menu, X, ChevronDown, ChevronRight, User } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { getMenu, menuItemToRoute, type MenuItem, type Menu as MenuType } from '../lib/shopify';

export default function Header() {
  const { cart, openCart } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [expandedSub, setExpandedSub] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [menu, setMenu] = useState<MenuType | null>(null);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const [mobileSubExpanded, setMobileSubExpanded] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const headerRef = useRef<HTMLDivElement>(null);

  const totalItems = cart?.totalQuantity || 0;

  useEffect(() => {
    getMenu('main-menu').then(setMenu).catch(console.error);
  }, []);

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
                    {hasChildren(topItem) ? (
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

                    {/* Dropdown for this specific item */}
                    <AnimatePresence>
                      {activeDropdown === topItem.id && hasChildren(topItem) && (
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
                  className="p-2.5 rounded-full hover:bg-black/5 transition-colors hidden sm:flex"
                  aria-label="Account"
                  onClick={() => setActiveDropdown(null)}
                >
                  <User className="w-5 h-5 text-[var(--color-navy)]" />
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
                    {hasChildren(topItem) ? (
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
                      {mobileExpanded === topItem.id && hasChildren(topItem) && (
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
