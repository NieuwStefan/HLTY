import { useState, useEffect, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Cookie, X, ShieldCheck, BarChart3, Megaphone } from 'lucide-react';
import { useConsent } from '../context/ConsentContext';

// Toggle-switch in de huisstijl. `locked` voor de functionele categorie
// die altijd aan staat.
function Toggle({
  checked,
  onChange,
  locked,
  label,
}: {
  checked: boolean;
  onChange?: (v: boolean) => void;
  locked?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={locked}
      onClick={() => onChange?.(!checked)}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
        checked ? 'bg-[var(--color-primary)]' : 'bg-black/15'
      } ${locked ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}

function Category({
  icon,
  title,
  description,
  checked,
  onChange,
  locked,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  checked: boolean;
  onChange?: (v: boolean) => void;
  locked?: boolean;
}) {
  return (
    <div className="flex items-start gap-4 py-4 border-b border-[var(--color-border)] last:border-b-0">
      <div className="mt-0.5 text-[var(--color-primary)]">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[var(--color-navy)]">{title}</p>
        <p className="text-xs text-[var(--color-muted)] mt-0.5 leading-relaxed">
          {description}
        </p>
      </div>
      <Toggle checked={checked} onChange={onChange} locked={locked} label={title} />
    </div>
  );
}

export default function CookieBanner() {
  const { consent, needsChoice, settingsOpen, openSettings, closeSettings, acceptAll, rejectAll, save } =
    useConsent();

  // Lokale toggle-state voor het instellingen-paneel.
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  // Synchroniseer met de huidige keuze zodra het paneel opent.
  useEffect(() => {
    if (settingsOpen) {
      setAnalytics(consent?.analytics ?? false);
      setMarketing(consent?.marketing ?? false);
    }
  }, [settingsOpen, consent]);

  const showBar = needsChoice && !settingsOpen;

  return (
    <>
      {/* Eerste-bezoek-balk */}
      <AnimatePresence>
        {showBar && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed inset-x-0 bottom-0 z-[90] px-4 pb-4 sm:px-6 sm:pb-6"
          >
            <div className="mx-auto max-w-3xl glass rounded-2xl p-5 sm:p-6 shadow-xl">
              <div className="flex items-start gap-3">
                <Cookie className="w-5 h-5 text-[var(--color-primary)] flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--color-navy)]">
                    We gebruiken cookies
                  </p>
                  <p className="text-xs text-[var(--color-muted)] mt-1 leading-relaxed">
                    Functionele cookies houden je winkelwagen en login werkend. Met jouw
                    toestemming gebruiken we ook analytische en marketingcookies om de site
                    te verbeteren. Lees meer in onze{' '}
                    <Link
                      to="/beleid/privacy"
                      className="text-[var(--color-primary-dark)] underline underline-offset-2 hover:text-[var(--color-primary)]"
                    >
                      privacyverklaring
                    </Link>
                    .
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-col sm:flex-row gap-2 sm:justify-end">
                <button
                  onClick={openSettings}
                  className="btn-secondary px-5 py-2.5 text-sm order-3 sm:order-1"
                >
                  Instellingen
                </button>
                <button
                  onClick={rejectAll}
                  className="btn-secondary px-5 py-2.5 text-sm order-2"
                >
                  Alleen noodzakelijk
                </button>
                <button
                  onClick={acceptAll}
                  className="btn-primary px-5 py-2.5 text-sm order-1 sm:order-3"
                >
                  Alles accepteren
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Instellingen-paneel (modal) */}
      <AnimatePresence>
        {settingsOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[95] bg-black/40 backdrop-blur-sm"
              onClick={needsChoice ? undefined : closeSettings}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              role="dialog"
              aria-modal="true"
              aria-label="Cookie-instellingen"
              className="fixed left-1/2 top-1/2 z-[100] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2"
            >
              <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--color-border)]">
                  <div className="flex items-center gap-2.5">
                    <Cookie className="w-5 h-5 text-[var(--color-primary)]" />
                    <h2
                      className="text-lg font-bold text-[var(--color-navy)]"
                      style={{ fontFamily: 'Montserrat' }}
                    >
                      Cookie-instellingen
                    </h2>
                  </div>
                  {!needsChoice && (
                    <button
                      onClick={closeSettings}
                      className="p-2 rounded-full hover:bg-black/5 transition-colors"
                      aria-label="Sluiten"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>

                <div className="px-6 py-2 max-h-[55vh] overflow-y-auto">
                  <Category
                    icon={<ShieldCheck className="w-5 h-5" />}
                    title="Functioneel (altijd aan)"
                    description="Noodzakelijk voor winkelwagen, inloggen en beveiliging. Deze kunnen niet worden uitgezet."
                    checked
                    locked
                  />
                  <Category
                    icon={<BarChart3 className="w-5 h-5" />}
                    title="Analytisch"
                    description="Google Analytics — anoniem meten hoe de site wordt gebruikt zodat we hem kunnen verbeteren."
                    checked={analytics}
                    onChange={setAnalytics}
                  />
                  <Category
                    icon={<Megaphone className="w-5 h-5" />}
                    title="Marketing"
                    description="Meta Pixel — meten welke advertenties tot een bezoek of aankoop leiden, voor relevantere advertenties."
                    checked={marketing}
                    onChange={setMarketing}
                  />
                </div>

                <div className="px-6 py-5 border-t border-[var(--color-border)] flex flex-col sm:flex-row gap-2 sm:justify-between sm:items-center">
                  <button
                    onClick={rejectAll}
                    className="btn-secondary px-5 py-2.5 text-sm"
                  >
                    Alleen noodzakelijk
                  </button>
                  <button
                    onClick={() => save({ analytics, marketing })}
                    className="btn-primary px-5 py-2.5 text-sm"
                  >
                    Keuze opslaan
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
