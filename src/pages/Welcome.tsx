import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, Loader2, AlertCircle, User, MapPin, ShoppingBag } from 'lucide-react';
import { useCustomer } from '../context/CustomerContext';
import { validateZip, validateRequired, normalizeZip } from '../lib/validators';
import { COUNTRIES } from '../lib/countries';

// Onboarding-pagina voor net geregistreerde klanten.
//
// Trigger: AuthCallback detecteert na de OAuth-exchange dat de customer
// `firstName`, `lastName` én adresboek leeg zijn, en stuurt de browser
// hierheen i.p.v. naar /account.
//
// Doel: naam en bezorgadres invullen in één scherm zodat de eerste
// checkout vlot verloopt. Telefoonnummer ontbreekt bewust — de Customer
// Account API laat dat niet via klant-zelf-edit toe (zie docs/04 § 3.1).

export default function Welcome() {
  const { customer, isLoggedIn, isLoading, refresh } = useCustomer();
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [address1, setAddress1] = useState('');
  const [address2, setAddress2] = useState('');
  const [zip, setZip] = useState('');
  const [city, setCity] = useState('');
  const [territoryCode, setTerritoryCode] = useState('NL');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Niet ingelogd → terug naar account (toont login-prompt).
  useEffect(() => {
    if (!isLoading && !isLoggedIn) navigate('/account', { replace: true });
  }, [isLoading, isLoggedIn, navigate]);

  // Klant heeft al gegevens → /welkom is niet voor jou bedoeld.
  useEffect(() => {
    if (!customer) return;
    const hasName = !!(customer.firstName || customer.lastName);
    const hasAddress = customer.addresses.edges.length > 0;
    if (hasName || hasAddress) navigate('/account', { replace: true });
  }, [customer, navigate]);

  function validate(): boolean {
    const errs: Record<string, string> = {};
    const f = validateRequired(firstName, 'Voornaam');
    if (f) errs.firstName = f;
    const l = validateRequired(lastName, 'Achternaam');
    if (l) errs.lastName = l;
    // Adres is optioneel — alleen valideren als er IETS is ingevuld.
    const hasAddrInput =
      address1.trim() !== '' || zip.trim() !== '' || city.trim() !== '';
    if (hasAddrInput) {
      const a1 = validateRequired(address1, 'Straatnaam');
      if (a1) errs.address1 = a1;
      const c = validateRequired(city, 'Stad');
      if (c) errs.city = c;
      const z = validateZip(zip, territoryCode);
      if (z) errs.zip = z;
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function save() {
    if (!validate()) return;
    setSaving(true);
    setError(null);
    try {
      // 1) Naam opslaan
      const nameRes = await fetch('/api/customer/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ firstName: firstName.trim(), lastName: lastName.trim() }),
      });
      if (!nameRes.ok) {
        const body = (await nameRes.json().catch(() => null)) as
          | { userErrors?: { message: string }[] }
          | { error?: string }
          | null;
        throw new Error(
          (body && 'userErrors' in body && body.userErrors?.[0]?.message) ||
            (body && 'error' in body && body.error) ||
            `Naam opslaan mislukt (${nameRes.status})`,
        );
      }

      // 2) Adres opslaan (alleen als alle verplichte adresvelden ingevuld zijn)
      const hasFullAddress =
        address1.trim() !== '' && zip.trim() !== '' && city.trim() !== '';
      if (hasFullAddress) {
        const addrRes = await fetch('/api/customer/address', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            address1: address1.trim(),
            address2: address2.trim(),
            city: city.trim(),
            zip: normalizeZip(zip, territoryCode),
            territoryCode,
            defaultAddress: true,
          }),
        });
        if (!addrRes.ok) {
          const body = (await addrRes.json().catch(() => null)) as
            | { userErrors?: { field?: string[]; message: string }[] }
            | { error?: string }
            | null;
          if (body && 'userErrors' in body && Array.isArray(body.userErrors)) {
            const errs: Record<string, string> = {};
            let general = '';
            for (const u of body.userErrors) {
              const fld = u.field && u.field.length > 0 ? u.field[u.field.length - 1] : null;
              if (fld) errs[fld] = u.message;
              else general = u.message;
            }
            setFieldErrors((prev) => ({ ...prev, ...errs }));
            if (general) setError(general);
            return;
          }
          throw new Error(
            (body && 'error' in body && body.error) ||
              `Adres opslaan mislukt (${addrRes.status})`,
          );
        }
      }

      await refresh();
      navigate('/account?welkom=1', { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Onbekende fout');
    } finally {
      setSaving(false);
    }
  }

  function skip() {
    navigate('/account', { replace: true });
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-[var(--color-primary)] animate-spin" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[640px] px-4">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        className="w-16 h-16 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center mx-auto mb-4"
      >
        <CheckCircle2 className="w-8 h-8 text-[var(--color-primary)]" />
      </motion.div>

      <h1
        className="text-3xl font-extrabold text-[var(--color-navy)] text-center"
        style={{ fontFamily: 'Montserrat' }}
      >
        Welkom bij HLTY!
      </h1>
      <p className="text-sm text-[var(--color-muted)] text-center mt-2 mb-8 max-w-md mx-auto">
        Vul je naam en bezorgadres aan zodat je in één klik kunt afrekenen. Je kan
        dit later altijd aanpassen in je profiel.
      </p>

      {/* Persoonsgegevens */}
      <div className="card p-6 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <User className="w-4 h-4 text-[var(--color-primary)]" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--color-navy)]">
            Persoonsgegevens
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="Voornaam" id="welkom-firstName" error={fieldErrors.firstName}>
            <input
              id="welkom-firstName"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="form-input"
              autoFocus
            />
          </FormField>
          <FormField label="Achternaam" id="welkom-lastName" error={fieldErrors.lastName}>
            <input
              id="welkom-lastName"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="form-input"
            />
          </FormField>
        </div>
      </div>

      {/* Bezorgadres */}
      <div className="card p-6 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="w-4 h-4 text-[var(--color-primary)]" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--color-navy)]">
            Bezorgadres
          </h2>
          <span className="text-[11px] text-[var(--color-muted)] ml-auto">Optioneel</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField
            label="Straatnaam + huisnummer"
            id="welkom-address1"
            error={fieldErrors.address1}
            className="sm:col-span-2"
          >
            <input
              id="welkom-address1"
              type="text"
              value={address1}
              onChange={(e) => setAddress1(e.target.value)}
              className="form-input"
              placeholder="Bv. Hoofdstraat 12"
            />
          </FormField>
          <FormField label="Toevoeging (optioneel)" id="welkom-address2" className="sm:col-span-2">
            <input
              id="welkom-address2"
              type="text"
              value={address2}
              onChange={(e) => setAddress2(e.target.value)}
              className="form-input"
              placeholder="Bv. 2-hoog, app B"
            />
          </FormField>
          <FormField label="Postcode" id="welkom-zip" error={fieldErrors.zip}>
            <input
              id="welkom-zip"
              type="text"
              value={zip}
              onChange={(e) => setZip(e.target.value)}
              className="form-input"
              placeholder={territoryCode === 'NL' ? '1234 AB' : ''}
            />
          </FormField>
          <FormField label="Stad" id="welkom-city" error={fieldErrors.city}>
            <input
              id="welkom-city"
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="form-input"
            />
          </FormField>
          <FormField label="Land" id="welkom-country" className="sm:col-span-2">
            <select
              id="welkom-country"
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
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-800">{error}</p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 items-center mt-6">
        <button
          onClick={save}
          disabled={saving}
          className="btn-primary w-full sm:w-auto py-3 px-6 text-sm gap-2 disabled:opacity-60"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Opslaan...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              Mijn gegevens opslaan
            </>
          )}
        </button>
        <button
          onClick={skip}
          disabled={saving}
          className="text-sm font-medium text-[var(--color-muted)] hover:text-[var(--color-navy)] disabled:opacity-50"
        >
          Sla over
        </button>
      </div>

      <p className="text-[11px] text-[var(--color-muted)] text-center mt-6">
        <ShoppingBag className="w-3 h-3 inline mr-1" />
        Je gegevens worden alleen gebruikt voor de afhandeling van je bestellingen.
      </p>
    </div>
  );
}

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
