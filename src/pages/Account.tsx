import { motion, AnimatePresence } from 'framer-motion';
import { User, Package, LogOut, ShoppingBag, ExternalLink, Shield, Loader2, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCustomer } from '../context/CustomerContext';

export default function Account() {
  const { isLoggedIn, isLoading, popupOpen, openAccountPopup, openOrdersPopup, logout } = useCustomer();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-[var(--color-primary)] animate-spin" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[560px] px-4">
      <AnimatePresence mode="wait">
        {isLoggedIn ? (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25 }}
          >
            <Dashboard onOrdersPopup={openOrdersPopup} onLogout={logout} />
          </motion.div>
        ) : (
          <motion.div
            key="login"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25 }}
          >
            <LoginPrompt onLogin={openAccountPopup} popupOpen={popupOpen} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------- Login Prompt ----------

function LoginPrompt({ onLogin, popupOpen }: { onLogin: () => void; popupOpen: boolean }) {
  return (
    <>
      <div className="text-center mb-8">
        <motion.div
          animate={popupOpen ? { scale: [1, 1.08, 1] } : {}}
          transition={popupOpen ? { duration: 1.5, repeat: Infinity, ease: 'easeInOut' } : {}}
          className="w-16 h-16 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center mx-auto mb-4"
        >
          <User className="w-8 h-8 text-[var(--color-primary)]" />
        </motion.div>
        <h1
          className="text-3xl font-extrabold text-[var(--color-navy)]"
          style={{ fontFamily: 'Montserrat' }}
        >
          Mijn Account
        </h1>
        <p className="text-sm text-[var(--color-muted)] mt-2 max-w-sm mx-auto">
          Log in met een beveiligde code via e-mail. Geen wachtwoord nodig.
        </p>
      </div>

      <div className="card p-8 text-center">
        {popupOpen ? (
          <div className="py-4">
            <Loader2 className="w-6 h-6 text-[var(--color-primary)] animate-spin mx-auto mb-4" />
            <p className="text-sm font-semibold text-[var(--color-navy)] mb-1">
              Wacht op inloggen...
            </p>
            <p className="text-xs text-[var(--color-muted)]">
              Rond het inloggen af in het geopende venster.
            </p>
          </div>
        ) : (
          <>
            <button
              onClick={onLogin}
              className="btn-primary w-full py-4 text-sm gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Inloggen / Registreren
            </button>

            <div className="mt-5 flex items-start gap-2 text-left">
              <Shield className="w-4 h-4 text-[var(--color-primary)] flex-shrink-0 mt-0.5" />
              <p className="text-[11px] text-[var(--color-muted)] leading-relaxed">
                Een beveiligd venster opent van Shopify. Sluit dit venster na het inloggen.
              </p>
            </div>
          </>
        )}
      </div>

      <div className="mt-8 text-center">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-muted)] hover:text-[var(--color-navy)] transition-colors"
        >
          <ShoppingBag className="w-4 h-4" />
          Verder winkelen
        </Link>
      </div>
    </>
  );
}

// ---------- Dashboard ----------

function Dashboard({ onOrdersPopup, onLogout }: { onOrdersPopup: () => void; onLogout: () => void }) {
  return (
    <>
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          </motion.div>
        </motion.div>
        <h1
          className="text-3xl font-extrabold text-[var(--color-navy)]"
          style={{ fontFamily: 'Montserrat' }}
        >
          Welkom terug
        </h1>
        <p className="text-sm text-[var(--color-muted)] mt-2">
          Beheer je account en bestellingen
        </p>
      </div>

      <div className="space-y-3">
        <button
          onClick={onOrdersPopup}
          className="card p-5 w-full flex items-center gap-4 text-left hover:!shadow-lg"
        >
          <div className="w-11 h-11 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center flex-shrink-0">
            <Package className="w-5 h-5 text-[var(--color-primary)]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[var(--color-navy)]">Bekijk mijn bestellingen</p>
            <p className="text-xs text-[var(--color-muted)] mt-0.5">Ordergeschiedenis, tracking & retour</p>
          </div>
          <ExternalLink className="w-4 h-4 text-[var(--color-muted)] flex-shrink-0" />
        </button>

        <button
          onClick={onLogout}
          className="btn-secondary w-full py-3 text-sm gap-2"
        >
          <LogOut className="w-4 h-4" />
          Uitloggen
        </button>
      </div>

      <div className="mt-8 text-center">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-muted)] hover:text-[var(--color-navy)] transition-colors"
        >
          <ShoppingBag className="w-4 h-4" />
          Verder winkelen
        </Link>
      </div>
    </>
  );
}
