# Waar staan we — handover voor de volgende sessie

Laatst bijgewerkt: **28 mei 2026 (sessie 8 — Tracking-hardening + AEM domeinverificatie)**.

---

## Stand van zaken

**Fase 8 (SEO & GEO)** — ✅ live & gevalideerd.

**Fase 9 (Assortiment)** — ✅ afgerond (1.096 actieve producten).

**Fase 10 (Tracking-fundament + SEO/GEO content-pass)** — ✅ live op
https://www.hlty.shop. Zie [`10-fase-10-tracking-seo.md`](./10-fase-10-tracking-seo.md).
**Hardening (sessie 8)** is opgenomen in §9 van datzelfde verslag — kort:

- **GA4 client-side bug** ontdekt + gerepareerd. `gtag()` pushte een array
  i.p.v. het `arguments`-object; gtag.js negeerde alle commando's →
  GA4 configureerde nooit (géén `_ga`-cookie, géén hits sinds Fase 10).
  Nu live: page_view + add_to_cart + begin_checkout komen daadwerkelijk
  binnen in GA4 (Realtime bevestigd op productie).
- **EMQ-stitching**: storefront schrijft bij `begin_checkout`
  `_fbp` / `_fbc` / `_ga_client_id` / `_external_id` als cart-attributen
  (→ order `note_attributes`), consent-gated. Webhook hasht `external_id`
  in Meta `user_data` → hogere Event Match Quality voor de server-side
  Purchase.
- **GA4 server-side `purchase`** geactiveerd: `GA4_MEASUREMENT_ID` +
  `GA4_API_SECRET` als Vercel env-vars + redeploy uitgevoerd. Webhook
  stuurt nu naast Meta CAPI ook GA4 Measurement Protocol.
- **AEM-domeinverificatie**: `hlty.shop` geverifieerd in Meta Business via
  een `<meta name="facebook-domain-verification" …>` in `index.html`.
- **AEM-8-event-prioriteringstool**: niet zichtbaar voor dit account
  (geen lopende Meta-campagnes). Meta managet AEM-prioritering
  automatisch tot een campagne wordt aangemaakt — geen actie nu.

Live sinds Fase 10 (en sessie 8):
- Cookie-consent-banner (functioneel / analytisch / marketing).
- **GA4** (`G-WSSTFZQ6HX`): page_view, add_to_cart, begin_checkout
  (browser) + `purchase` (server-side via Measurement Protocol, sessie 8).
- **Meta browser-pixel** (`3516734115165173`): PageView, AddToCart,
  InitiateCheckout.
- **Meta Purchase** server-side: Shopify `orders/paid`-webhook → Vercel
  (`api/shopify-order-webhook.ts`) → Meta Conversions API, met
  EMQ-stitching (`_fbp`/`_fbc`/`_external_id`) en GA4-stitching
  (`_ga_client_id`).
- Privacyverklaring §6 herschreven; merk-/collectie-SEO + interne
  linking; SiteSchema `sameAs`.

**Vercel env-vars (production):** `VITE_GA4_ID`, `VITE_META_PIXEL_ID`,
`META_PIXEL_ID`, `META_CAPI_TOKEN`, `SHOPIFY_WEBHOOK_SECRET`,
**`GA4_MEASUREMENT_ID`**, **`GA4_API_SECRET`** (laatste twee toegevoegd
in sessie 8).

**Restore-punten (git-tags op GitHub):**
- `backup-pre-fase10` → commit `151ad96` (vóór Fase 10).
- `backup-pre-tracking-hardening` → commit `9cf24ec` (vóór sessie 8).

---

## Eerst even checken (begin volgende sessie)

- **GA4 → Realtime / Reports**: komen page_view + add_to_cart binnen?
  En na de eerste echte betaalde order: verschijnt `purchase` in GA4?
- **Meta Events Manager** → dataset HLTY: zijn de Purchase-events
  binnengekomen (incl. de match-parameters uit de EMQ-stitching)?
  Score voor Event Match Quality bekijken na enkele orders.
- **All-producten-pagina** — `/alle-producten` ligt eruit; door Stefan
  zelf opgepakt na sessie 8 (zie volgende sectie).

---

## Volgende stappen

### 1. All-producten-bug (in behandeling door Stefan)

`/alle-producten` toont *"0 producten / Geen producten gevonden"* door
een Shopify Storefront `INTERNAL_SERVER_ERROR`. Diagnose in sessie 8
afgerond:

- Boosdoener is `collections(first: 20)` in `PRODUCT_CARD_FRAGMENT`
  (`src/lib/shopify.ts` ~regel 213). Genest in een grote producten-query
  (`getAllProducts` → `products(first: 250)`) tikt Shopify's backend over
  een interne time-out (kosten 155–276, ruim onder het 1000-limiet —
  géén cost-limiet, wél flaky/intermittent).
- Sinds Fase 9 (1.096 producten in meer collecties) tikt het structureel
  over.
- **Veilig om te verkleinen:** producten zitten in max ~4 collecties
  (sample-bewijs). `collections(first: 5)` testte betrouwbaar bij
  `first:250` (kosten 232).
- **Aanbevolen fix:** `collections(first: 5)` + retry-vangnet op
  `INTERNAL_SERVER_ERROR` in `getProducts`. Eventueel page size 250 → 100
  voor extra marge.
- `getProducts`/`getAllProducts` worden ALLEEN door de all-producten-pagina
  gebruikt; impact afgebakend.

### 2. Fase 11 — Productadvisor post-live optimalisaties

Was geparkeerd, nu ontblokt doordat het GA4-fundament er staat (en
client-side daadwerkelijk werkt sinds sessie 8). Zie
[`11-fase-11-productadvisor-optimalisaties.md`](./11-fase-11-productadvisor-optimalisaties.md):
feedback verwerken, AI-fallback + stap 5 terug, doserings-keuze,
bundle-suggestie, en productadvisor-specifieke analytics-events bovenop
het GA4-fundament. ⚠️ Afhankelijkheid (uit projectgeheugen): de
productadvisor-mapping-invulling.

---

## Korte restpunten (niet-blokkerend)

- Oude test-`webhook.site`-webhook in Shopify kan opgeruimd.
- `VITE_OPENAI_API_KEY`-footgun in `.env` (secret met client-prefix; nu
  niet gebundeld) — staat als losse taak.
- `view_item` wiren op de productpagina (helper bestaat al).
- **AEM 8-event-prioriteit**: zodra Stefan zijn eerste Meta-campagne
  start, kan de prioriteringstool opduiken — vijf-minuten-klusje
  (`Purchase` #1 → InitiateCheckout → AddToCart → ViewContent → PageView).
- **AEM-domeinverificatie-meta-tag in `index.html` niet verwijderen!**
  (`facebook-domain-verification` content `3zui3j4tlf7hbdwfwq1hx9yyl3q3ny`).
  Net als de Google Search Console-tag.

---

## Werkwijze (vasthouden)

- Stap voor stap, lange-termijn oplossingen, geen quick fixes.
- Per onderdeel meerdere opties, Stefan kiest bij richtinggevende keuzes.
- Shopify-admin-acties: vraag akkoord; nieuw product activeren? ALTIJD ook de tag `HLTY`.
- Bij deploys: eerst back-up (git-tag), dan deploy (sessie 8 deed dit
  conform: `backup-pre-tracking-hardening` voor de hardening-commit).
- Per fase een verslag in `docs/0X-fase-X-onderwerp.md`; hardening
  binnen een bestaande fase wordt als sub-sectie aan dat verslag
  toegevoegd (zie Fase 10 §9).

**Productie-URL:** https://www.hlty.shop
**Webhook-endpoint:** https://hlty-storefront.vercel.app/api/shopify-order-webhook
**Localhost-dev:** `cd /Users/stefanritsema/Documents/VibeCode/HLTY && npm run dev`
**Repo:** github.com/NieuwStefan/HLTY (main), Vercel auto-deploy op push.
