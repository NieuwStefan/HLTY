import { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
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
                  <Route path="/product/:handle" element={<Product />} />
                  <Route path="/zoeken" element={<Search />} />
                  <Route path="/account" element={<Account />} />
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
