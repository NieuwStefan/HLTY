import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  User,
  Package,
  LogOut,
  ShoppingBag,
  Shield,
  Loader2,
  CheckCircle2,
  Mail,
  Phone,
  MapPin,
  ExternalLink,
  X,
  Truck,
  RotateCcw,
  Pencil,
  Plus,
  Trash2,
  Star,
  Check,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { useCustomer, type Customer, type CustomerAddress } from '../context/CustomerContext';
import { useCart } from '../context/CartContext';
import { validatePhone, validateZip, validateRequired, normalizeZip } from '../lib/validators';
import { COUNTRIES, countryName } from '../lib/countries';

interface OrderLineItem {
  title: string;
  quantity: number;
  variantTitle: string | null;
  variantId: string | null;
  image: { url: string; altText: string | null } | null;
}

interface TrackingInfo {
  number: string | null;
  url: string | null;
  company: string | null;
}

interface Fulfillment {
  status: string;
  trackingInformation: TrackingInfo[];
}

interface Order {
  id: string;
  number: number;
  name: string;
  processedAt: string;
  financialStatus: string;
  fulfillmentStatus: string;
  totalPrice: { amount: string; currencyCode: string };
  shippingAddress: {
    formatted: string[];
    city: string;
    zip: string;
    country: string;
  } | null;
  fulfillments: { edges: { node: Fulfillment }[] };
  lineItems: { edges: { node: OrderLineItem }[] };
}

type Tab = 'overview' | 'orders' | 'profile';

export default function Account() {
  const { isLoggedIn, customer, isLoading, error, login, logout, switchUser } = useCustomer();

  if (!isLoggedIn) return <LoginPrompt onLogin={() => login('/account')} />;
  if (isLoading && !customer) return <FullPageLoader />;

  return (
    <Dashboard customer={customer} error={error} onLogout={logout} onSwitchUser={switchUser} />
  );
}

// ---------- Login Prompt ----------

function LoginPrompt({ onLogin }: { onLogin: () => void }) {
  // Wanneer de bezoeker net terugkomt van de Shopify-checkout — waar
  // hij mogelijk op "Inloggen" heeft geklikt en daar wel z'n Shopify-
  // session heeft, maar geen hlty_session bij ons — dan ergeren we hem
  // niet met de losse "Inloggen / Registreren"-knop. Eén stap aan onze
  // kant: meteen onze OAuth-flow starten. Shopify herkent de actieve
  // sessie → 1-staps terug. Zo niet → normale mailcode-flow.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const ref = document.referrer;
    const fromShopify = /^https:\/\/(checkout|inlog)\.hlty\.shop/.test(ref);
    if (fromShopify) onLogin();
  }, [onLogin]);

  return (
    <div className="mx-auto max-w-[480px] px-4">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center mx-auto mb-4">
          <User className="w-8 h-8 text-[var(--color-primary)]" />
        </div>
        <h1 className="text-3xl font-extrabold text-[var(--color-navy)]" style={{ fontFamily: 'Montserrat' }}>
          Mijn Account
        </h1>
        <p className="text-sm text-[var(--color-muted)] mt-2 max-w-sm mx-auto">
          Log in met een beveiligde code via e-mail of via Google. Geen wachtwoord nodig.
        </p>
      </div>

      <div className="card p-8 text-center">
        <button onClick={onLogin} className="btn-primary w-full py-4 text-sm gap-2">
          Inloggen / Registreren
        </button>

        <div className="mt-5 flex items-start gap-2 text-left">
          <Shield className="w-4 h-4 text-[var(--color-primary)] flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-[var(--color-muted)] leading-relaxed">
            Je wordt doorgestuurd naar het beveiligde Shopify-inlogscherm. Daarna kom je
            automatisch terug op je dashboard.
          </p>
        </div>
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
    </div>
  );
}

// ---------- Dashboard ----------

function Dashboard({
  customer,
  error,
  onLogout,
  onSwitchUser,
}: {
  customer: ReturnType<typeof useCustomer>['customer'];
  error: string | null;
  onLogout: () => Promise<void>;
  onSwitchUser: () => Promise<void>;
}) {
  const [tab, setTab] = useState<Tab>('overview');
  const [loggingOut, setLoggingOut] = useState(false);
  const [switching, setSwitching] = useState(false);

  // "Echt nieuw" = nooit een profiel ingevuld, geen adresboek. Voor die
  // klanten is "Welkom terug" misleidend — een eerste-bezoek-tekst is
  // beter. Klanten die al ooit iets hebben ingevuld krijgen de
  // bekende terugkomst-begroeting.
  const isFreshCustomer =
    !!customer &&
    !customer.firstName &&
    !customer.lastName &&
    customer.addresses.edges.length === 0;
  const greeting = isFreshCustomer
    ? 'Welkom bij HLTY!'
    : customer?.firstName
    ? `Welkom terug, ${customer.firstName}`
    : 'Welkom terug';

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await onLogout();
    } catch {
      setLoggingOut(false);
    }
  }

  async function handleSwitchUser() {
    setSwitching(true);
    try {
      await onSwitchUser();
    } catch {
      setSwitching(false);
    }
  }

  return (
    <div className="mx-auto max-w-[820px] px-4">
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4"
        >
          <CheckCircle2 className="w-8 h-8 text-green-500" />
        </motion.div>
        <h1 className="text-3xl font-extrabold text-[var(--color-navy)]" style={{ fontFamily: 'Montserrat' }}>
          {greeting}
        </h1>
        <p className="text-sm text-[var(--color-muted)] mt-2">
          Beheer je account en bestellingen
        </p>
      </div>

      {error && (
        <div className="card p-4 mb-6 border border-red-200 bg-red-50">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="flex gap-2 mb-6 overflow-x-auto">
        <TabButton active={tab === 'overview'} onClick={() => setTab('overview')}>
          Overzicht
        </TabButton>
        <TabButton active={tab === 'orders'} onClick={() => setTab('orders')}>
          Bestellingen
        </TabButton>
        <TabButton active={tab === 'profile'} onClick={() => setTab('profile')}>
          Profiel
        </TabButton>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18 }}
        >
          {tab === 'overview' && <OverviewTab customer={customer} />}
          {tab === 'orders' && <OrdersTab />}
          {tab === 'profile' && <ProfileTab customer={customer} />}
        </motion.div>
      </AnimatePresence>

      <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
        <button
          onClick={handleLogout}
          disabled={loggingOut || switching}
          className="btn-secondary py-3 px-6 gap-2 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loggingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
          {loggingOut ? 'Uitloggen...' : 'Uitloggen'}
        </button>
        <button
          onClick={handleSwitchUser}
          disabled={loggingOut || switching}
          className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-muted)] hover:text-[var(--color-navy)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {switching ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          {switching ? 'Wisselen...' : 'Wissel van account'}
        </button>
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-muted)] hover:text-[var(--color-navy)] transition-colors"
        >
          <ShoppingBag className="w-4 h-4" />
          Verder winkelen
        </Link>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors whitespace-nowrap ${
        active
          ? 'bg-[var(--color-primary)] text-white'
          : 'text-[var(--color-navy)]/70 hover:bg-black/5'
      }`}
    >
      {children}
    </button>
  );
}

// ---------- Tabs ----------

function OverviewTab({ customer }: { customer: ReturnType<typeof useCustomer>['customer'] }) {
  if (!customer) return null;
  // Shopify zet `displayName` op het e-mailadres als er nog geen
  // firstName/lastName is. Dat ziet er raar uit in de "Naam"-card,
  // dus we negeren displayName en bouwen de naam zelf op.
  const fullName = [customer.firstName, customer.lastName].filter(Boolean).join(' ');
  return (
    <div className="space-y-3">
      <InfoCard
        icon={<User className="w-5 h-5 text-[var(--color-primary)]" />}
        label="Naam"
        value={fullName || '—'}
      />
      <InfoCard
        icon={<Mail className="w-5 h-5 text-[var(--color-primary)]" />}
        label="E-mail"
        value={customer.emailAddress?.emailAddress ?? '—'}
      />
      <InfoCard
        icon={<Phone className="w-5 h-5 text-[var(--color-primary)]" />}
        label="Telefoon"
        value={customer.phoneNumber?.phoneNumber ?? '—'}
      />
      {customer.defaultAddress && (
        <InfoCard
          icon={<MapPin className="w-5 h-5 text-[var(--color-primary)]" />}
          label="Bezorgadres"
          value={[
            customer.defaultAddress.address1,
            customer.defaultAddress.address2,
            `${customer.defaultAddress.zip} ${customer.defaultAddress.city}`,
            customer.defaultAddress.country,
          ]
            .filter(Boolean)
            .join(', ')}
        />
      )}
    </div>
  );
}

function OrdersTab() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/customer/orders?first=20', { credentials: 'same-origin' });
        if (!res.ok) throw new Error(`Kon bestellingen niet laden (${res.status})`);
        const data = (await res.json()) as Order[];
        if (!cancelled) setOrders(data);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Onbekende fout');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <SectionLoader />;
  if (error) return <p className="card p-4 text-sm text-red-700 bg-red-50 border border-red-200">{error}</p>;
  if (!orders || orders.length === 0) {
    return (
      <div className="card p-8 text-center">
        <Package className="w-10 h-10 text-[var(--color-muted)]/40 mx-auto mb-3" />
        <p className="text-sm text-[var(--color-muted)]">Je hebt nog geen bestellingen geplaatst.</p>
        <Link to="/" className="btn-primary py-2 px-4 text-xs mt-4 inline-flex">
          Bekijk producten
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {orders.map((order) => (
          <OrderCard key={order.id} order={order} onOpen={() => setSelectedOrder(order)} />
        ))}
      </div>
      <AnimatePresence>
        {selectedOrder && (
          <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
        )}
      </AnimatePresence>
    </>
  );
}

function OrderCard({ order, onOpen }: { order: Order; onOpen: () => void }) {
  const items = order.lineItems.edges.map((e) => e.node);
  const total = formatPrice(order.totalPrice.amount, order.totalPrice.currencyCode);
  const date = new Date(order.processedAt).toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <button
      onClick={onOpen}
      className="card p-5 w-full text-left hover:!shadow-lg transition-shadow"
    >
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <p className="text-xs uppercase tracking-wider text-[var(--color-muted)]">
            {order.name}
          </p>
          <p className="text-sm font-semibold text-[var(--color-navy)] mt-0.5">{date}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-sm font-bold text-[var(--color-navy)]">{total}</p>
          <p className="text-[11px] text-[var(--color-muted)] mt-0.5">
            {statusLabel(order.fulfillmentStatus, order.financialStatus)}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 mt-3">
        {items.slice(0, 4).map((item, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            {item.image?.url ? (
              <img
                src={item.image.url}
                alt={item.image.altText ?? item.title}
                className="w-10 h-10 rounded-lg object-cover bg-gray-50"
              />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-gray-100" />
            )}
            <span className="text-[var(--color-navy)]/70">
              {item.quantity}× {item.title}
            </span>
          </div>
        ))}
        {items.length > 4 && (
          <span className="text-xs text-[var(--color-muted)] self-center">
            +{items.length - 4} meer
          </span>
        )}
      </div>
    </button>
  );
}

function OrderDetailModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const { addItem, openCart } = useCart();
  const [reorderState, setReorderState] = useState<'idle' | 'busy' | 'done' | 'partial'>('idle');
  const [reorderMessage, setReorderMessage] = useState<string | null>(null);

  const items = useMemo(() => order.lineItems.edges.map((e) => e.node), [order]);
  const trackings = useMemo(
    () =>
      order.fulfillments.edges
        .flatMap((e) => e.node.trackingInformation)
        .filter((t) => t.url || t.number),
    [order],
  );
  const total = formatPrice(order.totalPrice.amount, order.totalPrice.currencyCode);
  const date = new Date(order.processedAt).toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const onReorder = async () => {
    setReorderState('busy');
    setReorderMessage(null);
    const reorderable = items.filter((i) => i.variantId);
    if (reorderable.length === 0) {
      setReorderState('done');
      setReorderMessage('Geen producten beschikbaar om opnieuw te bestellen.');
      return;
    }
    let added = 0;
    let failed = 0;
    for (const item of reorderable) {
      try {
        await addItem(item.variantId!, item.quantity);
        added++;
      } catch {
        failed++;
      }
    }
    if (added > 0) {
      setReorderState(failed > 0 ? 'partial' : 'done');
      setReorderMessage(
        failed > 0
          ? `${added} item(s) toegevoegd, ${failed} niet meer beschikbaar.`
          : 'Alles toegevoegd aan je winkelwagen.',
      );
      setTimeout(() => {
        onClose();
        openCart();
      }, 1200);
    } else {
      setReorderState('done');
      setReorderMessage('Geen van de items is meer op voorraad.');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.96 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-[640px] max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-black/5 px-6 py-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-[var(--color-muted)]">{order.name}</p>
            <p className="text-base font-bold text-[var(--color-navy)]" style={{ fontFamily: 'Montserrat' }}>
              Bestelling van {date}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-black/5">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          <div className="flex items-center justify-between gap-4">
            <p className="text-xs text-[var(--color-muted)]">
              {statusLabel(order.fulfillmentStatus, order.financialStatus)}
            </p>
            <p className="text-base font-bold text-[var(--color-navy)]">{total}</p>
          </div>

          {trackings.length > 0 && (
            <div className="card p-4 bg-[var(--color-primary)]/5 border-[var(--color-primary)]/30">
              <div className="flex items-center gap-2 mb-2">
                <Truck className="w-4 h-4 text-[var(--color-primary)]" />
                <p className="text-sm font-semibold text-[var(--color-navy)]">Verzending</p>
              </div>
              <div className="space-y-1">
                {trackings.map((t, i) => (
                  <div key={i} className="text-xs text-[var(--color-navy)]/80">
                    {t.company && <span className="font-medium">{t.company}: </span>}
                    {t.url ? (
                      <a
                        href={t.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[var(--color-primary)] hover:underline inline-flex items-center gap-1"
                      >
                        {t.number ?? 'Tracking openen'}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span>{t.number}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {order.shippingAddress && order.shippingAddress.formatted.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-wider text-[var(--color-muted)] mb-2">
                Bezorgadres
              </p>
              <p className="text-sm text-[var(--color-navy)]/80">
                {order.shippingAddress.formatted.join(', ')}
              </p>
            </div>
          )}

          <div>
            <p className="text-xs uppercase tracking-wider text-[var(--color-muted)] mb-2">
              Producten
            </p>
            <div className="space-y-2">
              {items.map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-xl">
                  {item.image?.url ? (
                    <img
                      src={item.image.url}
                      alt={item.image.altText ?? item.title}
                      className="w-12 h-12 rounded-lg object-cover bg-gray-50 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-gray-100 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--color-navy)] truncate">{item.title}</p>
                    {item.variantTitle && item.variantTitle !== 'Default Title' && (
                      <p className="text-[11px] text-[var(--color-muted)]">{item.variantTitle}</p>
                    )}
                  </div>
                  <p className="text-xs text-[var(--color-muted)] flex-shrink-0">
                    × {item.quantity}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {reorderMessage && (
            <p
              className={`text-xs text-center ${
                reorderState === 'done' ? 'text-green-600' : 'text-[var(--color-muted)]'
              }`}
            >
              {reorderMessage}
            </p>
          )}

          <button
            onClick={onReorder}
            disabled={reorderState === 'busy'}
            className="btn-primary w-full py-3 text-sm gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {reorderState === 'busy' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Toevoegen...
              </>
            ) : (
              <>
                <RotateCcw className="w-4 h-4" />
                Opnieuw bestellen
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ProfileTab({ customer }: { customer: Customer | null }) {
  if (!customer) return null;
  return (
    <div className="space-y-4">
      <PersonalInfoCard customer={customer} />
      <AddressBookCard customer={customer} />
    </div>
  );
}

// ---------- Persoonsgegevens-card ----------

function PersonalInfoCard({ customer }: { customer: Customer }) {
  const { refresh } = useCustomer();
  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState(customer.firstName ?? '');
  const [lastName, setLastName] = useState(customer.lastName ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);

  // Sync local form state when the upstream customer changes (e.g. after refresh).
  useEffect(() => {
    if (!editing) {
      setFirstName(customer.firstName ?? '');
      setLastName(customer.lastName ?? '');
    }
  }, [customer.firstName, customer.lastName, editing]);

  function cancelEdit() {
    setFirstName(customer.firstName ?? '');
    setLastName(customer.lastName ?? '');
    setEditing(false);
    setError(null);
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/customer/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ firstName: firstName.trim(), lastName: lastName.trim() }),
      });
      const body = (await res.json().catch(() => null)) as
        | { customer?: { firstName?: string; lastName?: string } }
        | { userErrors?: { message: string }[] }
        | { error?: string }
        | null;
      if (!res.ok) {
        const message =
          (body && 'userErrors' in body && body.userErrors?.[0]?.message) ||
          (body && 'error' in body && body.error) ||
          `Fout (${res.status})`;
        throw new Error(message);
      }
      await refresh();
      setEditing(false);
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2200);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Onbekende fout');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card p-6">
      <header className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--color-navy)]">
          Persoonsgegevens
        </h3>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-primary)] hover:underline"
          >
            <Pencil className="w-3.5 h-3.5" />
            Bewerken
          </button>
        )}
        {savedFlash && (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600">
            <Check className="w-3.5 h-3.5" /> Opgeslagen
          </span>
        )}
      </header>

      {editing ? (
        <div className="space-y-3">
          <FormField label="Voornaam" id="firstName">
            <input
              id="firstName"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="form-input"
              autoFocus
            />
          </FormField>
          <FormField label="Achternaam" id="lastName">
            <input
              id="lastName"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="form-input"
            />
          </FormField>
          {error && <FormError message={error} />}
          <div className="flex gap-2 pt-1">
            <button
              onClick={save}
              disabled={saving}
              className="btn-primary py-2 px-4 text-xs gap-2 disabled:opacity-60"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              Opslaan
            </button>
            <button onClick={cancelEdit} disabled={saving} className="btn-secondary py-2 px-4 text-xs">
              Annuleren
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <ReadOnlyRow label="Voornaam" value={customer.firstName || '—'} />
          <ReadOnlyRow label="Achternaam" value={customer.lastName || '—'} />
        </div>
      )}

      <div className="border-t border-black/5 my-4" />

      <div className="space-y-3">
        <ReadOnlyRow label="E-mail" value={customer.emailAddress?.emailAddress ?? '—'} />
        <ReadOnlyRow label="Telefoon" value={customer.phoneNumber?.phoneNumber ?? '—'} />
        <p className="text-[11px] text-[var(--color-muted)] leading-relaxed pt-1">
          E-mailadres of telefoonnummer wijzigen? Stuur een bericht naar{' '}
          <a
            href="mailto:info@hlty.shop?subject=Wijziging%20contactgegevens"
            className="text-[var(--color-primary)] font-medium hover:underline"
          >
            info@hlty.shop
          </a>
          .
        </p>
      </div>
    </div>
  );
}

// ---------- Adresboek-card ----------

function AddressBookCard({ customer }: { customer: Customer }) {
  const addresses = customer.addresses.edges.map((e) => e.node);
  const defaultId = customer.defaultAddress?.id ?? null;
  const [adding, setAdding] = useState(false);

  return (
    <div className="card p-6">
      <header className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--color-navy)]">
          Adressen
        </h3>
        {!adding && (
          <button
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-primary)] hover:underline"
          >
            <Plus className="w-3.5 h-3.5" />
            Adres toevoegen
          </button>
        )}
      </header>

      {addresses.length === 0 && !adding && (
        <p className="text-sm text-[var(--color-muted)] text-center py-4">
          Je hebt nog geen adressen.
        </p>
      )}

      <div className="space-y-3">
        {addresses.map((addr) => (
          <AddressItem
            key={addr.id}
            address={addr}
            isDefault={addr.id === defaultId}
            canDelete={!(addr.id === defaultId && addresses.length === 1)}
          />
        ))}
        {adding && (
          <AddressEditor
            mode="create"
            isOnlyAddress={addresses.length === 0}
            onCancel={() => setAdding(false)}
            onSaved={() => setAdding(false)}
          />
        )}
      </div>
    </div>
  );
}

function AddressItem({
  address,
  isDefault,
  canDelete,
}: {
  address: CustomerAddress;
  isDefault: boolean;
  canDelete: boolean;
}) {
  const { refresh } = useCustomer();
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState<'delete' | 'default' | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function makeDefault() {
    setBusy('default');
    setError(null);
    try {
      const res = await fetch(`/api/customer/address?id=${encodeURIComponent(address.id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ defaultAddress: true }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as
          | { userErrors?: { message: string }[] }
          | { error?: string }
          | null;
        const message =
          (body && 'userErrors' in body && body.userErrors?.[0]?.message) ||
          (body && 'error' in body && body.error) ||
          `Fout (${res.status})`;
        throw new Error(message);
      }
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Onbekende fout');
    } finally {
      setBusy(null);
    }
  }

  async function doDelete() {
    setBusy('delete');
    setError(null);
    try {
      const res = await fetch(`/api/customer/address?id=${encodeURIComponent(address.id)}`, {
        method: 'DELETE',
        credentials: 'same-origin',
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as
          | { userErrors?: { message: string }[] }
          | { error?: string }
          | null;
        const message =
          (body && 'userErrors' in body && body.userErrors?.[0]?.message) ||
          (body && 'error' in body && body.error) ||
          `Fout (${res.status})`;
        throw new Error(message);
      }
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Onbekende fout');
      setBusy(null);
    }
  }

  if (editing) {
    return (
      <AddressEditor
        mode="edit"
        initial={address}
        isDefault={isDefault}
        onCancel={() => setEditing(false)}
        onSaved={() => setEditing(false)}
      />
    );
  }

  return (
    <div className="rounded-2xl border border-black/5 bg-white p-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center flex-shrink-0">
          <MapPin className="w-4 h-4 text-[var(--color-primary)]" />
        </div>
        <div className="flex-1 min-w-0">
          {isDefault && (
            <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-[var(--color-primary)] bg-[var(--color-primary)]/10 rounded-full px-2 py-0.5 mb-1.5">
              <Star className="w-3 h-3 fill-current" />
              Standaard
            </span>
          )}
          <p className="text-sm font-semibold text-[var(--color-navy)]">
            {[address.firstName, address.lastName].filter(Boolean).join(' ') || '—'}
          </p>
          {address.company && (
            <p className="text-xs text-[var(--color-navy)]/70">{address.company}</p>
          )}
          <p className="text-xs text-[var(--color-navy)]/70 mt-0.5">
            {[address.address1, address.address2].filter(Boolean).join(' ')}
          </p>
          <p className="text-xs text-[var(--color-navy)]/70">
            {[address.zip, address.city].filter(Boolean).join(' ')}
          </p>
          <p className="text-xs text-[var(--color-navy)]/70">
            {address.country ?? countryName(address.territoryCode)}
          </p>
          {address.phoneNumber && (
            <p className="text-xs text-[var(--color-navy)]/60 mt-1">{address.phoneNumber}</p>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-3">
          <FormError message={error} />
        </div>
      )}

      {confirmDelete ? (
        <div className="mt-4 flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <p className="text-xs text-red-800 flex-1">Adres definitief verwijderen?</p>
          <button
            onClick={doDelete}
            disabled={busy === 'delete'}
            className="text-xs font-bold text-red-700 hover:text-red-900 disabled:opacity-50"
          >
            {busy === 'delete' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Verwijderen'}
          </button>
          <button
            onClick={() => setConfirmDelete(false)}
            disabled={busy === 'delete'}
            className="text-xs font-medium text-[var(--color-muted)] hover:text-[var(--color-navy)]"
          >
            Annuleren
          </button>
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {!isDefault && (
            <button
              onClick={makeDefault}
              disabled={busy !== null}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-primary)] hover:underline disabled:opacity-50"
            >
              {busy === 'default' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Star className="w-3.5 h-3.5" />
              )}
              Standaard maken
            </button>
          )}
          <button
            onClick={() => setEditing(true)}
            disabled={busy !== null}
            className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-navy)]/70 hover:text-[var(--color-navy)] disabled:opacity-50"
          >
            <Pencil className="w-3.5 h-3.5" />
            Bewerken
          </button>
          {canDelete && (
            <button
              onClick={() => setConfirmDelete(true)}
              disabled={busy !== null}
              className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-800 disabled:opacity-50 ml-auto"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Verwijderen
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ---------- Adres-formulier (create + edit) ----------

interface AddressEditorProps {
  mode: 'create' | 'edit';
  initial?: CustomerAddress;
  isDefault?: boolean;
  isOnlyAddress?: boolean;
  onCancel: () => void;
  onSaved: () => void;
}

function AddressEditor({
  mode,
  initial,
  isDefault = false,
  isOnlyAddress = false,
  onCancel,
  onSaved,
}: AddressEditorProps) {
  const { refresh } = useCustomer();
  const [firstName, setFirstName] = useState(initial?.firstName ?? '');
  const [lastName, setLastName] = useState(initial?.lastName ?? '');
  const [company, setCompany] = useState(initial?.company ?? '');
  const [address1, setAddress1] = useState(initial?.address1 ?? '');
  const [address2, setAddress2] = useState(initial?.address2 ?? '');
  const [zip, setZip] = useState(initial?.zip ?? '');
  const [city, setCity] = useState(initial?.city ?? '');
  const [territoryCode, setTerritoryCode] = useState(initial?.territoryCode ?? 'NL');
  const [phoneNumber, setPhoneNumber] = useState(initial?.phoneNumber ?? '');
  const [setAsDefault, setSetAsDefault] = useState(mode === 'create' && isOnlyAddress);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const errs: Record<string, string> = {};
    const r1 = validateRequired(firstName, 'Voornaam');
    if (r1) errs.firstName = r1;
    const r2 = validateRequired(lastName, 'Achternaam');
    if (r2) errs.lastName = r2;
    const r3 = validateRequired(address1, 'Straatnaam');
    if (r3) errs.address1 = r3;
    const r4 = validateRequired(city, 'Stad');
    if (r4) errs.city = r4;
    const r5 = validateZip(zip, territoryCode);
    if (r5) errs.zip = r5;
    const r6 = validatePhone(phoneNumber);
    if (r6) errs.phoneNumber = r6;
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function save() {
    if (!validate()) return;
    setSaving(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        company: company.trim(),
        address1: address1.trim(),
        address2: address2.trim(),
        city: city.trim(),
        zip: normalizeZip(zip, territoryCode),
        territoryCode,
        phoneNumber: phoneNumber.trim(),
      };
      if (setAsDefault) payload.defaultAddress = true;

      const url =
        mode === 'edit'
          ? `/api/customer/address?id=${encodeURIComponent(initial!.id)}`
          : '/api/customer/address';
      const method = mode === 'edit' ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(payload),
      });
      const body = (await res.json().catch(() => null)) as
        | { customerAddress?: unknown }
        | { userErrors?: { field?: string[] | null; message: string }[] }
        | { error?: string }
        | null;
      if (!res.ok) {
        if (body && 'userErrors' in body && Array.isArray(body.userErrors)) {
          const errs: Record<string, string> = {};
          let general = '';
          for (const u of body.userErrors) {
            const f = u.field && u.field.length > 0 ? u.field[u.field.length - 1] : null;
            if (f) errs[f] = u.message;
            else general = u.message;
          }
          setFieldErrors(errs);
          if (general) setError(general);
          return;
        }
        const message = (body && 'error' in body && body.error) || `Fout (${res.status})`;
        throw new Error(message);
      }
      await refresh();
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Onbekende fout');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5 p-4">
      <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-navy)] mb-3">
        {mode === 'create' ? 'Nieuw adres' : 'Adres bewerken'}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FormField label="Voornaam" id="addr-firstName" error={fieldErrors.firstName}>
          <input
            id="addr-firstName"
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="form-input"
          />
        </FormField>
        <FormField label="Achternaam" id="addr-lastName" error={fieldErrors.lastName}>
          <input
            id="addr-lastName"
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="form-input"
          />
        </FormField>
        <FormField label="Bedrijfsnaam (optioneel)" id="addr-company" className="sm:col-span-2">
          <input
            id="addr-company"
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="form-input"
          />
        </FormField>
        <FormField
          label="Straatnaam + huisnummer"
          id="addr-address1"
          error={fieldErrors.address1}
          className="sm:col-span-2"
        >
          <input
            id="addr-address1"
            type="text"
            value={address1}
            onChange={(e) => setAddress1(e.target.value)}
            className="form-input"
            placeholder="Bv. Hoofdstraat 12"
          />
        </FormField>
        <FormField label="Toevoeging (optioneel)" id="addr-address2" className="sm:col-span-2">
          <input
            id="addr-address2"
            type="text"
            value={address2}
            onChange={(e) => setAddress2(e.target.value)}
            className="form-input"
            placeholder="Bv. 2-hoog, app B"
          />
        </FormField>
        <FormField label="Postcode" id="addr-zip" error={fieldErrors.zip}>
          <input
            id="addr-zip"
            type="text"
            value={zip}
            onChange={(e) => setZip(e.target.value)}
            className="form-input"
            placeholder={territoryCode === 'NL' ? '1234 AB' : ''}
          />
        </FormField>
        <FormField label="Stad" id="addr-city" error={fieldErrors.city}>
          <input
            id="addr-city"
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="form-input"
          />
        </FormField>
        <FormField label="Land" id="addr-country">
          <select
            id="addr-country"
            value={territoryCode}
            onChange={(e) => setTerritoryCode(e.target.value)}
            className="form-input"
          >
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Telefoon (optioneel)" id="addr-phone" error={fieldErrors.phoneNumber}>
          <input
            id="addr-phone"
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="form-input"
            placeholder="+31612345678"
          />
        </FormField>
      </div>

      {!isDefault && (
        <label className="flex items-center gap-2 mt-3 cursor-pointer">
          <input
            type="checkbox"
            checked={setAsDefault}
            onChange={(e) => setSetAsDefault(e.target.checked)}
            className="rounded"
          />
          <span className="text-xs text-[var(--color-navy)]/80">Als standaard adres instellen</span>
        </label>
      )}

      {error && (
        <div className="mt-3">
          <FormError message={error} />
        </div>
      )}

      <div className="flex gap-2 mt-4">
        <button
          onClick={save}
          disabled={saving}
          className="btn-primary py-2 px-4 text-xs gap-2 disabled:opacity-60"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
          {mode === 'create' ? 'Adres opslaan' : 'Wijzigingen opslaan'}
        </button>
        <button onClick={onCancel} disabled={saving} className="btn-secondary py-2 px-4 text-xs">
          Annuleren
        </button>
      </div>
    </div>
  );
}

// ---------- Form helpers ----------

function FormField({
  label,
  id,
  error,
  className,
  children,
}: {
  label: string;
  id: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-[11px] uppercase tracking-wider text-[var(--color-muted)] mb-1">
        {label}
      </label>
      {children}
      {error && <p className="text-[11px] text-red-600 mt-1">{error}</p>}
    </div>
  );
}

function FormError({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3">
      <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
      <p className="text-xs text-red-800">{message}</p>
    </div>
  );
}

function ReadOnlyRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-3">
      <span className="text-[11px] uppercase tracking-wider text-[var(--color-muted)] w-24 flex-shrink-0">
        {label}
      </span>
      <span className="text-sm font-medium text-[var(--color-navy)] break-words">{value}</span>
    </div>
  );
}

// ---------- Bits ----------

function InfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="card p-5 flex items-start gap-4">
      <div className="w-11 h-11 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs uppercase tracking-wider text-[var(--color-muted)]">{label}</p>
        <p className="text-sm font-semibold text-[var(--color-navy)] mt-0.5 break-words">
          {value}
        </p>
      </div>
    </div>
  );
}

function FullPageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <Loader2 className="w-8 h-8 text-[var(--color-primary)] animate-spin" />
    </div>
  );
}

function SectionLoader() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="w-6 h-6 text-[var(--color-primary)] animate-spin" />
    </div>
  );
}

function formatPrice(amount: string, currencyCode: string): string {
  try {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: currencyCode,
    }).format(parseFloat(amount));
  } catch {
    return `${currencyCode} ${amount}`;
  }
}

function statusLabel(fulfillment: string, financial: string): string {
  if (fulfillment === 'FULFILLED') return 'Geleverd';
  if (fulfillment === 'IN_PROGRESS' || fulfillment === 'PARTIALLY_FULFILLED') return 'Onderweg';
  if (financial === 'PAID') return 'Betaald';
  if (financial === 'PENDING') return 'Wacht op betaling';
  return financial.toLowerCase();
}
