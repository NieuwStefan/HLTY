import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { applyConsent, type ConsentState } from '../lib/analytics';

// Versie in de key: verhoog naar _v2 als het cookiebeleid wezenlijk wijzigt,
// dan wordt iedereen opnieuw om toestemming gevraagd.
const STORAGE_KEY = 'hlty_consent_v1';

interface StoredConsent {
  analytics: boolean;
  marketing: boolean;
  ts: string; // ISO-tijdstip van de keuze
}

interface ConsentContextType {
  /** null = nog geen keuze gemaakt → banner tonen */
  consent: ConsentState | null;
  /** true zolang de bezoeker nog geen keuze maakte */
  needsChoice: boolean;
  /** instellingen-paneel geopend? */
  settingsOpen: boolean;
  openSettings: () => void;
  closeSettings: () => void;
  acceptAll: () => void;
  rejectAll: () => void;
  /** fijnmazig opslaan vanuit het instellingen-paneel */
  save: (consent: ConsentState) => void;
}

const ConsentContext = createContext<ConsentContextType | null>(null);

function readStored(): StoredConsent | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed.analytics === 'boolean' &&
      typeof parsed.marketing === 'boolean'
    ) {
      return parsed as StoredConsent;
    }
    return null;
  } catch {
    return null;
  }
}

export function ConsentProvider({ children }: { children: ReactNode }) {
  const [consent, setConsent] = useState<ConsentState | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Opgeslagen keuze laden + direct toepassen (laadt GA/Meta indien geconsent).
  useEffect(() => {
    const stored = readStored();
    if (stored) {
      const c: ConsentState = {
        analytics: stored.analytics,
        marketing: stored.marketing,
      };
      setConsent(c);
      applyConsent(c);
    }
  }, []);

  const persist = useCallback((c: ConsentState) => {
    const payload: StoredConsent = { ...c, ts: new Date().toISOString() };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      /* localStorage geblokkeerd — keuze geldt dan alleen deze sessie */
    }
    setConsent(c);
    applyConsent(c);
    setSettingsOpen(false);
  }, []);

  const acceptAll = useCallback(
    () => persist({ analytics: true, marketing: true }),
    [persist],
  );
  const rejectAll = useCallback(
    () => persist({ analytics: false, marketing: false }),
    [persist],
  );
  const save = useCallback((c: ConsentState) => persist(c), [persist]);

  return (
    <ConsentContext.Provider
      value={{
        consent,
        needsChoice: consent === null,
        settingsOpen,
        openSettings: () => setSettingsOpen(true),
        closeSettings: () => setSettingsOpen(false),
        acceptAll,
        rejectAll,
        save,
      }}
    >
      {children}
    </ConsentContext.Provider>
  );
}

export function useConsent() {
  const ctx = useContext(ConsentContext);
  if (!ctx) throw new Error('useConsent must be used within ConsentProvider');
  return ctx;
}
