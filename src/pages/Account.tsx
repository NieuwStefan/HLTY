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
} from 'lucide-react';
import { useCustomer } from '../context/CustomerContext';
import { useCart } from '../context/CartContext';

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
  const { isLoggedIn, customer, isLoading, error, login, logout } = useCustomer();

  if (!isLoggedIn) return <LoginPrompt onLogin={() => login('/account')} />;
  if (isLoading && !customer) return <FullPageLoader />;

  return <Dashboard customer={customer} error={error} onLogout={logout} />;
}

// ---------- Login Prompt ----------

function LoginPrompt({ onLogin }: { onLogin: () => void }) {
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
}: {
  customer: ReturnType<typeof useCustomer>['customer'];
  error: string | null;
  onLogout: () => void;
}) {
  const [tab, setTab] = useState<Tab>('overview');

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
          {customer?.firstName ? `Welkom terug, ${customer.firstName}` : 'Welkom terug'}
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
        <button onClick={onLogout} className="btn-secondary py-3 px-6 gap-2 text-sm">
          <LogOut className="w-4 h-4" />
          Uitloggen
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
  return (
    <div className="space-y-3">
      <InfoCard
        icon={<User className="w-5 h-5 text-[var(--color-primary)]" />}
        label="Naam"
        value={customer.displayName || `${customer.firstName} ${customer.lastName}`.trim() || '—'}
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

function ProfileTab({ customer }: { customer: ReturnType<typeof useCustomer>['customer'] }) {
  if (!customer) return null;
  return (
    <div className="card p-6">
      <p className="text-sm text-[var(--color-muted)] mb-4">
        Wijzigingen aan je profiel kun je doorvoeren via je Shopify klantaccount.
      </p>
      <a
        href="https://inlog.hlty.shop/profile"
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-primary)] hover:underline"
      >
        Profiel bewerken bij Shopify <ExternalLink className="w-3.5 h-3.5" />
      </a>
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
