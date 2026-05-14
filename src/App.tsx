import { useEffect } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CustomerProvider } from './context/CustomerContext';
import { CartProvider } from './context/CartContext';
import Header from './components/Header';
import Footer from './components/Footer';
import CartDrawer from './components/CartDrawer';
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

  return (
    <CustomerProvider>
      <CartProvider>
        <div className="min-h-screen flex flex-col">
          <Header />
          <CartDrawer />

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

                  {/* Shopify-legacy URLs → eigen routes */}
                  <Route path="/account/login" element={<Navigate to="/account" replace />} />
                  <Route path="/account/register" element={<Navigate to="/account" replace />} />
                  <Route path="/account/orders" element={<Navigate to="/account" replace />} />
                  <Route path="/pages/contact" element={<Navigate to="/contact" replace />} />

                  {/* Catch-all 404 */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </motion.div>
            </AnimatePresence>
          </main>

          <Footer />
        </div>
      </CartProvider>
    </CustomerProvider>
  );
}
