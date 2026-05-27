import { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CustomerProvider } from './context/CustomerContext';
import { CartProvider } from './context/CartContext';
import { ConsentProvider } from './context/ConsentContext';
import { trackPageView } from './lib/analytics';
import Header from './components/Header';
import Footer from './components/Footer';
import CartDrawer from './components/CartDrawer';
import CookieBanner from './components/CookieBanner';
import SiteSchema from './components/SiteSchema';
import Home from './pages/Home';
import Collection from './pages/Collection';
import Product from './pages/Product';
import Search from './pages/Search';
import Account from './pages/Account';
import AuthCallback from './pages/AuthCallback';
import Brand from './pages/Brand';
import Welcome from './pages/Welcome';
import Policy from './pages/Policy';
import Contact from './pages/Contact';
import NotFound from './pages/NotFound';
import AllProducts from './pages/AllProducts';
import Faq from './pages/Faq';

const pageTransition = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.18, ease: 'easeOut' as const },
};

export default function App() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [location.pathname]);

  // SPA-pageview op elke route-change. No-op tot er analytics-consent is
  // (zie lib/analytics.ts); de eerste pageview ná consent wordt door
  // applyConsent ingehaald.
  useEffect(() => {
    trackPageView(location.pathname + location.search);
  }, [location.pathname, location.search]);

  return (
    <ConsentProvider>
      <CustomerProvider>
        <CartProvider>
          <SiteSchema />
          <div className="min-h-screen flex flex-col">
            <Header />
            <CartDrawer />
            <CookieBanner />

            <main className="flex-1 pb-12 pt-8" style={{ paddingTop: 'calc(var(--header-h, 96px) + 2rem)' }}>
              <AnimatePresence mode="wait">
                <motion.div key={location.pathname} {...pageTransition}>
                  <Routes location={location}>
                    <Route path="/" element={<Home />} />
                    <Route path="/collectie/:handle" element={<Collection />} />
                    <Route path="/merken/:brand" element={<Brand />} />
                    <Route path="/product/:handle" element={<Product />} />
                    <Route path="/zoeken" element={<Search />} />
                    <Route path="/account" element={<Account />} />
                    <Route path="/welkom" element={<Welcome />} />
                    <Route path="/auth/callback" element={<AuthCallback />} />
                    <Route path="/beleid/:slug" element={<Policy />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/alle-producten" element={<AllProducts />} />
                    <Route path="/veelgestelde-vragen" element={<Faq />} />

                    {/* Catch-all 404 — Shopify-legacy URLs (/account/login etc.)
                        worden door Vercel server-side 301-geredirect, zie vercel.json */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </motion.div>
              </AnimatePresence>
            </main>

            <Footer />
          </div>
        </CartProvider>
      </CustomerProvider>
    </ConsentProvider>
  );
}
