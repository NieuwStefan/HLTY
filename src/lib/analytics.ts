// Consent-gated analytics voor HLTY (Fase 10).
//
// GA4 (gtag) en Meta Pixel (fbq) worden PAS geladen nádat de bezoeker
// toestemming heeft gegeven via de cookiebanner. Vóór consent gebeurt er
// niets: geen script-injectie, geen netwerk-call, geen event. De
// ConsentContext is de enige bron van waarheid en roept `applyConsent`
// aan zodra de keuze verandert.
//
// ID's komen uit env-vars (lokaal .env + Vercel):
//   VITE_GA4_ID         = "G-XXXXXXXXXX"
//   VITE_META_PIXEL_ID  = "1234567890123456"
// Ontbreekt een ID, dan wordt die tracker niet geladen (handig in dev).
// In dev loggen we events naar de console zodat de wiring + consent-gating
// te verifiëren is zónder echte ID's.

const GA4_ID = import.meta.env.VITE_GA4_ID;
const META_PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID;

type GtagFn = (...args: unknown[]) => void;
type FbqFn = ((...args: unknown[]) => void) & {
  callMethod?: (...a: unknown[]) => void;
  queue?: unknown[];
  loaded?: boolean;
  version?: string;
  push?: unknown;
};

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: GtagFn;
    fbq?: FbqFn;
    _fbq?: FbqFn;
  }
}

export interface ConsentState {
  /** Analytische cookies — GA4 */
  analytics: boolean;
  /** Marketing-/advertentiecookies — Meta Pixel */
  marketing: boolean;
}

export interface AnalyticsItem {
  /** Shopify variant- of product-id */
  id: string;
  name: string;
  brand?: string;
  /** prijs per stuk in hele euro's/centen als number */
  price: number;
  quantity: number;
}

let currentConsent: ConsentState = { analytics: false, marketing: false };
let gaLoaded = false;
let metaLoaded = false;

const DEFAULT_CURRENCY = 'EUR';

function devLog(event: string, params?: unknown) {
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.debug(`[analytics] ${event}`, params ?? '');
  }
}

// ---------------------------------------------------------------------------
// Tracker-loaders (idempotent, draaien alleen ná consent)
// ---------------------------------------------------------------------------

function gtag(...args: unknown[]) {
  window.dataLayer = window.dataLayer || [];
  // GA verwacht het letterlijke `arguments`-object, niet een array.
  window.dataLayer.push(args);
}

function loadGA() {
  if (gaLoaded || !GA4_ID) return;
  gaLoaded = true;

  window.dataLayer = window.dataLayer || [];
  window.gtag = gtag;

  // Consent Mode v2 — defaults op basis van de huidige keuze. We komen hier
  // alleen ná analytics-consent, dus analytics_storage = granted.
  gtag('consent', 'default', {
    analytics_storage: 'granted',
    ad_storage: currentConsent.marketing ? 'granted' : 'denied',
    ad_user_data: currentConsent.marketing ? 'granted' : 'denied',
    ad_personalization: currentConsent.marketing ? 'granted' : 'denied',
  });

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`;
  document.head.appendChild(script);

  gtag('js', new Date());
  // SPA: page_view's sturen we handmatig op route-change (zie trackPageView).
  gtag('config', GA4_ID, { send_page_view: false });
  devLog('GA4 geladen', GA4_ID);
}

function loadMeta() {
  if (metaLoaded || !META_PIXEL_ID) return;
  metaLoaded = true;

  /* eslint-disable */
  (function (f: any, b: Document, e: string, v: string, n?: any, t?: any, s?: any) {
    if (f.fbq) return;
    n = f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = '2.0';
    n.queue = [];
    t = b.createElement(e);
    t.async = true;
    t.src = v;
    s = b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t, s);
  })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
  /* eslint-enable */

  window.fbq?.('init', META_PIXEL_ID);
  devLog('Meta Pixel geladen', META_PIXEL_ID);
}

// ---------------------------------------------------------------------------
// Consent toepassen (aangeroepen door ConsentContext)
// ---------------------------------------------------------------------------

export function applyConsent(consent: ConsentState) {
  const prev = currentConsent;
  currentConsent = consent;
  const gaWasLoaded = gaLoaded;
  const metaWasLoaded = metaLoaded;

  // --- Analytics (GA4) ---
  if (consent.analytics) {
    if (!gaLoaded) {
      loadGA();
    } else {
      window.gtag?.('consent', 'update', {
        analytics_storage: 'granted',
        ad_storage: consent.marketing ? 'granted' : 'denied',
        ad_user_data: consent.marketing ? 'granted' : 'denied',
        ad_personalization: consent.marketing ? 'granted' : 'denied',
      });
    }
  } else if (gaLoaded) {
    window.gtag?.('consent', 'update', {
      analytics_storage: 'denied',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
    });
  }

  // --- Marketing (Meta Pixel) ---
  if (consent.marketing) {
    if (!metaLoaded) loadMeta();
    else window.fbq?.('consent', 'grant');
  } else if (metaLoaded) {
    window.fbq?.('consent', 'revoke');
  }

  // Catch-up page_view: de route-change-hook draaide al toen er nog geen
  // consent was (en no-opte). Vuur er één voor de huidige pagina zodra een
  // tracker net geladen is óf de bezoeker net voor het eerst opt-in geeft.
  const gaNewlyLoaded = gaLoaded && !gaWasLoaded;
  const metaNewlyLoaded = metaLoaded && !metaWasLoaded;
  const justOptedIn =
    !prev.analytics && !prev.marketing && (consent.analytics || consent.marketing);
  if (gaNewlyLoaded || metaNewlyLoaded || justOptedIn) {
    trackPageView(window.location.pathname + window.location.search);
  }
}

// ---------------------------------------------------------------------------
// Event-helpers — no-op tenzij de relevante tracker geladen + geconsent is
// ---------------------------------------------------------------------------

export function trackPageView(path: string, title?: string) {
  if (!currentConsent.analytics && !currentConsent.marketing) return;
  devLog('page_view', path);

  if (gaLoaded) {
    window.gtag?.('event', 'page_view', {
      page_path: path,
      page_location: window.location.origin + path,
      page_title: title ?? document.title,
    });
  }
  if (metaLoaded && currentConsent.marketing) {
    window.fbq?.('track', 'PageView');
  }
}

export function trackAddToCart(item: AnalyticsItem, currency = DEFAULT_CURRENCY) {
  if (!currentConsent.analytics && !currentConsent.marketing) return;
  const value = round(item.price * item.quantity);
  devLog('add_to_cart', { item, value, currency });

  if (gaLoaded) {
    window.gtag?.('event', 'add_to_cart', {
      currency,
      value,
      items: [toGaItem(item)],
    });
  }
  if (metaLoaded && currentConsent.marketing) {
    window.fbq?.('track', 'AddToCart', {
      content_ids: [item.id],
      content_name: item.name,
      content_type: 'product',
      value,
      currency,
    });
  }
}

export function trackBeginCheckout(
  value: number,
  items: AnalyticsItem[],
  currency = DEFAULT_CURRENCY,
) {
  if (!currentConsent.analytics && !currentConsent.marketing) return;
  devLog('begin_checkout', { value, currency, items });

  if (gaLoaded) {
    window.gtag?.('event', 'begin_checkout', {
      currency,
      value: round(value),
      items: items.map(toGaItem),
    });
  }
  if (metaLoaded && currentConsent.marketing) {
    window.fbq?.('track', 'InitiateCheckout', {
      content_ids: items.map((i) => i.id),
      content_type: 'product',
      value: round(value),
      currency,
      num_items: items.reduce((n, i) => n + i.quantity, 0),
    });
  }
}

export function trackViewItem(item: AnalyticsItem, currency = DEFAULT_CURRENCY) {
  if (!currentConsent.analytics && !currentConsent.marketing) return;
  devLog('view_item', item);

  if (gaLoaded) {
    window.gtag?.('event', 'view_item', {
      currency,
      value: round(item.price),
      items: [toGaItem(item)],
    });
  }
  if (metaLoaded && currentConsent.marketing) {
    window.fbq?.('track', 'ViewContent', {
      content_ids: [item.id],
      content_name: item.name,
      content_type: 'product',
      value: round(item.price),
      currency,
    });
  }
}

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

function toGaItem(item: AnalyticsItem) {
  return {
    item_id: item.id,
    item_name: item.name,
    item_brand: item.brand,
    price: round(item.price),
    quantity: item.quantity,
  };
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
