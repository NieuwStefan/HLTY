# Fase 10 — Tracking-fundament (GA4 + Meta) & SEO/GEO content-pass

**Datum:** 27 mei 2026 — hardening 28 mei 2026 (sessie 8, zie §9)
**Status:** ✅ afgerond + gehardend (live op https://www.hlty.shop)

---

## 1. Doel & scope

Twee onderdelen:

- **A — Tracking-fundament (consent-proof):** GA4 + Meta Pixel site-breed
  opzetten, alleen ná cookietoestemming, plus een server-side Purchase-event
  voor conversie-/ROAS-meting.
- **B — SEO/GEO content-pass:** SEO-verbeteringen op de plekken die Fase 9
  (assortiment) raakte — merk-pagina's, collectie-meta, interne linking.

---

## 2. Initial state

- Geen cookiebanner / consent-mechanisme aanwezig.
- Geen enkele analytics of pixel geïnstalleerd.
- Privacyverklaring §6 stelde letterlijk *"Geen tracking voor advertenties"*.
- Architectuur: React 19 + Vite SPA op `www.hlty.shop` (storefront), Shopify-
  gehoste checkout op `checkout.hlty.shop` (zelfde hoofddomein), Vercel-hosting
  met serverless functies in `api/`. Shopify Basic-plan.
- Belangrijk gevolg van de architectuur: de **checkout draait buiten de SPA**
  (`cart.checkoutUrl` → Shopify). Het `purchase`-event bestaat dus alleen aan
  Shopify-kant en kan niet in React getrackt worden.

---

## 3. Beslissingen

1. **Consent-proof = niets laden vóór consent.** GA4 (gtag) en Meta (fbq)
   worden pas geïnjecteerd nádat de bezoeker toestemming geeft. Dit is feitelijk
   "Basic" Google Consent Mode v2 (tags geblokkeerd tot consent). Privacy-veilig;
   zie §7 voor de "Advanced"-afweging.
2. **Drie consent-categorieën:** functioneel (altijd aan), analytisch (GA4),
   marketing (Meta). Keuze opgeslagen in `localStorage` (`hlty_consent_v1`, met
   versienummer voor toekomstige her-consent).
3. **Purchase server-side, niet client-side.** Omdat de checkout buiten de SPA
   valt, vuren we de aankoop via een **Shopify `orders/paid`-webhook → Vercel-
   functie → Meta Conversions API**. Geen pixel-code in de Shopify-checkout
   (bewuste wens van Stefan, en server-side is sinds iOS14 sowieso betrouwbaarder).
4. **Subdomein-voordeel benut:** `www.` en `checkout.` delen `.hlty.shop`, dus
   GA4/Meta-cookies (`_ga`, `_fbp`) worden automatisch over subdomeinen gedeeld —
   geen cross-domain-linker (`_gl`) nodig.
5. **Meta Pixel meenemen** (i.p.v. alleen GA4) → privacyverklaring §6 moest
   daarom herschreven worden.

---

## 4. Wat is gedaan (en hoe)

### 4.1 Consent-fundament
- **`src/context/ConsentContext.tsx`** — bron van waarheid. Leest/schrijft de
  keuze in `localStorage`, roept `applyConsent()` aan bij laden en bij wijziging.
- **`src/components/CookieBanner.tsx`** — eerste-bezoek-balk (Alles accepteren /
  Alleen noodzakelijk / Instellingen) + instellingen-modal met toggles per
  categorie, in de huisstijl (glass, kleur-tokens, framer-motion).
- **`src/components/Footer.tsx`** — link "Cookie-instellingen" om de keuze te
  herzien.
- Providers gemount in **`src/App.tsx`** (`ConsentProvider` om alles heen).

### 4.2 Analytics-module
- **`src/lib/analytics.ts`** — kern. Laadt gtag.js + fbq dynamisch, alléén ná de
  juiste consent. Zet Consent Mode v2-defaults. ID's via env-vars; ontbreekt een
  ID, dan no-op. In dev logt het events naar de console (`[analytics] …`) zodat
  de wiring + consent-gating te verifiëren is zonder echte ID's.
- **GA4** (`G-WSSTFZQ6HX`): `gtag('config', …, { send_page_view: false })` —
  SPA, dus `page_view` handmatig op route-change.
- **Meta Pixel** (`3516734115165173`): `fbq('init', …)`, browser-events alleen
  ná marketing-consent.
- **Events gewired:**
  - `page_view` — route-change in `App.tsx` (`location.pathname`).
  - `add_to_cart` — `src/context/CartContext.tsx` (`addItem`), met productdata
    uit de cart-line.
  - `begin_checkout` / Meta `InitiateCheckout` — `src/components/CartDrawer.tsx`
    op de afrekenknop.
  - `view_item`-helper bestaat in `analytics.ts` (nog niet gewired op de
    productpagina — zie §7).

### 4.3 Server-side Purchase-webhook
- **`api/shopify-order-webhook.ts`** — Vercel serverless functie:
  1. Verifieert **HMAC-SHA256** over de rauwe request-body met
     `SHOPIFY_WEBHOOK_SECRET` (ongeldig → 401, niets verstuurd). `bodyParser`
     uit om de exacte bytes te krijgen.
  2. Stuurt **Meta `Purchase`** via de Conversions API — gehashte e-mail/telefoon/
     naam/plaats/postcode/land als match-parameters, `event_id = order_<id>` voor
     deduplicatie, plus `value`, `currency`, `contents`.
  3. Stuurt optioneel **GA4 `purchase`** via Measurement Protocol (alleen als
     `GA4_MEASUREMENT_ID` + `GA4_API_SECRET` gezet zijn — nu niet, zie §7).
  4. Antwoordt 200 zodra de HMAC klopt, zodat Shopify niet onnodig herhaalt.
- Kernlogica (HMAC-verificatie, e-mailhashing, payload-opbouw) los geverifieerd
  met een Node-testscript: 14/14 checks geslaagd.

### 4.4 Privacyverklaring
- **`src/lib/policy-content.ts`** §6 herschreven: drie cookiecategorieën +
  verwijzing naar Cookie-instellingen; Google Analytics 4 en Meta Platforms
  toegevoegd als verwerkers (§4). Datum bijgewerkt.

### 4.5 Onderdeel B — SEO/GEO
- **`src/pages/Brand.tsx`** — merk-pagina's tonen nu de gecureerde content uit
  `src/data/brands.ts` (tagline, verhaal, "Waarom bij HLTY", trust-pijlers) en
  krijgen een **unieke meta-description** per merk (i.p.v. één generieke tekst).
  Structured data (ItemList) verrijkt met merknaam + omschrijving.
- **`src/lib/seo.ts`** — gedeelde `buildMetaDescription()` (afkappen op
  woordgrens ≤ 160 tekens), gebruikt door Brand én Collection.
- **`src/pages/Collection.tsx`** — meta-description netjes afgekapt + interne
  linking onderaan.
- **`src/components/RelatedCategories.tsx`** — "Verder ontdekken"-blok met links
  naar de hoofdcategorieën (huidige uitgesloten), op collectie- én merk-pagina's.
- **`src/components/SiteSchema.tsx`** — `sameAs` Instagram/Facebook toegevoegd
  (openstaand Fase 9-restpunt, meegedeployed).

### 4.6 Deployment & configuratie
- **Vercel env-vars (production):** `VITE_GA4_ID`, `VITE_META_PIXEL_ID`,
  `META_PIXEL_ID`, `META_CAPI_TOKEN`, `SHOPIFY_WEBHOOK_SECRET`. (VITE_-prefix =
  in de client-bundle gebakken bij build; de rest is server-side/secret.)
- **Git:** commit `f86a31b` (Fase 10-code, 15 bestanden), `9cf24ec` (lege
  redeploy om de Meta/CAPI-env-vars te activeren). Restore-punt vóór deploy:
  tag **`backup-pre-fase10`** → `151ad96` (op GitHub).
- **Shopify-webhook:** event "Betaling van bestelling" (orders/paid), JSON,
  API-versie **2026-04**, URL `https://hlty-storefront.vercel.app/api/shopify-order-webhook`.
  De bestaande Mosadex-fulfillment-webhook en een oude test-`webhook.site` zijn
  ongemoeid gelaten.

### 4.7 Verificatie
- GA4-ID én Meta Pixel-ID aantoonbaar in de live productie-bundle.
- Webhook-endpoint publiek bereikbaar (`GET` → `405 Method not allowed`, dus
  géén Vercel-loginscherm ervoor).
- `add_to_cart` lokaal geverifieerd in de browser (correcte payload, en niets
  vuurt vóór consent — `gtag`/`fbq`/`dataLayer` waren `undefined`).
- Meta herkent de Conversions API-integratie op de dataset.

---

## 5. Problemen onderweg

- **Meta Business Suite liet de browser-automatisering vastlopen** (klikken/
  DOM-reads time-outten na 300s — loodzware SPA). Oplossing: Stefan maakte de
  dataset handmatig aan; daarna ging het via screenshots + navigatie wél.
- **Native `<select>` in Shopify's iframe-modal** was niet te zetten via typen
  (lekte naar Shopify-sneltoetsen → sprong ongewild naar "Blog aanmaken") en
  niet via pijltjestoetsen. **Opgelost met type-ahead via één teken**: "b" →
  "Betaling van bestelling", "2026-04" → de stabiele API-versie.
- **Shopify weigert webhooks naar eigen winkeldomeinen** (`www.hlty.shop` zit op
  de blokkeerlijst). Opgelost door de Vercel-alias `hlty-storefront.vercel.app`
  te gebruiken — zelfde server, niet geblokkeerd.
- **Meta's CAPI-tokengeneratie ("met Dataset Quality API") gaf een server-fout
  aan Meta's kant.** Opgelost via de optie "zonder Dataset Quality API".
- **`vercel logs` streaming gaf een netwerk-time-out** → real-time
  delivery-bevestiging niet via logs gelukt; in plaats daarvan geverifieerd via
  de 405-GET + Meta's CAPI-integratie-herkenning.
- Wisselende screenshot-resoluties veroorzaakten één vroege misklik (modal
  sloot); daarna telkens op verse screenshot-coördinaten geklikt.

---

## 6. Eindstaat

Live op www.hlty.shop:
- Cookie-consent-banner (3 categorieën) voor alle bezoekers.
- GA4: `page_view`, `add_to_cart`, `begin_checkout` (ná analytics-consent).
- Meta browser-pixel: `PageView`, `AddToCart`, `InitiateCheckout` (ná marketing-
  consent).
- Meta `Purchase` server-side via de webhook-keten (Shopify → Vercel → CAPI).
- Bijgewerkte privacyverklaring; merk-/collectie-SEO + interne links; SiteSchema
  `sameAs`.

> Let op: Meta-events verschijnen met **tot 30 minuten** vertraging in Events
> Manager (Meta's aggregatie). GA4 Realtime toont bezoek direct ná cookie-accept.

---

## 7. Aandachtspunten & verbeterpunten

Gevalideerd met actueel onderzoek (Meta CAPI / Consent Mode v2, 2026 — zie
bronnen onderaan).

### Tracking-kwaliteit
1. **Meta Event Match Quality (EMQ) verhogen.** EMQ is een 1–10-score; hoe meer
   match-parameters, hoe beter de ad-optimalisatie. We sturen nu e-mail/telefoon/
   naam/plaats/postcode/land. **Verbeter:** geef bij `begin_checkout` ook de
   `_fbp`/`_fbc`-cookie en een `external_id` (klant-id) mee als order-
   `note_attributes`. De webhook léést die velden al — alleen de storefront moet
   ze nog wegschrijven. Verwachte winst: hogere EMQ → betere ad-delivery.
   → **✅ Afgerond in sessie 8 (28 mei 2026) — zie §9.**
2. **Aggregated Event Measurement (AEM) configureren.** Sinds iOS 14.5 mag een
   domein max. 8 web-events gebruiken voor optimalisatie/attributie, in
   prioriteitsvolgorde. **Verbeter:** verifieer het domein in Meta Business en
   zet de 8 events met `Purchase` bovenaan. Belangrijk voor ad-prestaties op iOS.
   → **🟡 Deels afgerond in sessie 8: domein `hlty.shop` geverifieerd via
   `<meta>`-tag in `index.html`. De 8-event-prioriteringstool is niet zichtbaar
   in Meta zolang er geen actieve campagnes zijn (Meta managet het zelf tot een
   campagne start). Zie §9.**
3. **GA4 server-side `purchase` aanzetten.** Nu krijgt alleen Meta de aankoop.
   **Verbeter:** voeg `GA4_MEASUREMENT_ID` + `GA4_API_SECRET` (Measurement
   Protocol) toe → de webhook stuurt dan ook GA4 `purchase` + omzet. Geef de GA
   `client_id` mee (zelfde note_attribute-truc) voor sessie-koppeling.
   → **✅ Afgerond in sessie 8 — env-vars + redeploy + `_ga_client_id`-stitching
   via dezelfde cart-attribute-flow. Zie §9.**
4. **Server-side CAPI ook voor AddToCart/InitiateCheckout** (met `event_id`-
   dedup t.o.v. de browser-pixel) → robuuster tegen ad-blockers/iOS. NB: Meta
   dedupt alleen correct als het browser-event eerst aankomt, dan het server-
   event — let op de volgorde.

### Consent & privacy
5. **Consent Mode v2 "Advanced" overwegen.** Wij draaien nu "Basic" (niets vóór
   consent). "Advanced" stuurt anonieme cookieless pings bij weigering →
   conversie-modeling herstelt ~65–70% van de geweigerde data. Afweging: pings
   vóór expliciete toestemming (door Google als AVG-conform bedoeld). Meer
   ad-data tegenover een striktere privacy-houding — Stefan's keuze.
6. **Gecertificeerde CMP overwegen.** Google duwt richting gecertificeerde
   consent-platforms (Cookiebot/Usercentrics/CookieScript). Onze custom banner
   met Consent Mode v2-signalen functioneert, maar een gecertificeerde CMP is
   "toekomstvaster" als compliance strenger wordt.

### Robuustheid & onderhoud
7. **Dedicated webhook-subdomein** (`hooks.hlty.shop` → Vercel) i.p.v. de
   `.vercel.app`-alias — stabieler als de projectnaam/alias ooit wijzigt.
8. **Webhook-idempotentie/retry.** We antwoorden 200 óók als de Meta-call
   faalt → een mislukte send gaat verloren (geen retry). Overweeg een retry/
   queue of een non-200 bij tijdelijke fouten (afgewogen tegen Shopify's
   auto-uitschakeling na herhaalde mislukkingen).
9. **API-versie monitoren.** Vastgezet op 2026-04; Shopify deprecate't versies
   ~jaarlijks — periodiek bumpen.
10. **`view_item` wiren** op de productpagina (helper bestaat al); overweeg
    `remove_from_cart` en `search` voor een rijkere GA4-funnel.
11. **Logging:** de webhook logt nu alleen fouten. Overweeg een succes-log +
    een minimale test in CI.

### Opruimen
12. Oude **test-`webhook.site`-webhook** in Shopify kan weg (restje).
13. **`VITE_OPENAI_API_KEY`-footgun** in `.env` — staat als losse taak/chip
    (secret met client-prefix; nu niet gebundeld, maar opruimen aanbevolen).

---

## 8. Volgende stap

Zie [`_next-session.md`](./_next-session.md). De tracking-hardening (§7 punten
1–3) is afgewerkt in **sessie 8 — zie §9 hieronder**. Volgende stappen: de
all-producten-bug (door Stefan opgepakt) en **Fase 11 — Productadvisor-
optimalisaties** (nu ontblokt doordat GA4-client-side daadwerkelijk werkt
sinds sessie 8).

---

## 9. Tracking-hardening — sessie 8 (28 mei 2026)

**Status:** ✅ afgerond, live op https://www.hlty.shop (commits `90d6891` +
`c1039e9`). Restore-tag: `backup-pre-tracking-hardening` → `9cf24ec`.

### 9.1 Doel & scope
De drie hoogste verbeterpunten uit §7 uitvoeren: EMQ verhogen, GA4
server-side `purchase` aanzetten, AEM voorbereiden. Tijdens de verificatie
werd óók een **kritieke GA4 client-side bug** gevonden die sinds Fase 10
live stond — die is direct meegenomen.

### 9.2 Kritieke vondst: GA4 client-side stond niet aan

Bij browser-verificatie op productie bleek: `_ga`-cookie werd nooit gezet,
en er werden **nul** hits naar `google-analytics.com/g/collect` verstuurd.
Root cause:

```ts
function gtag(...args: unknown[]) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(args);            // ← Array, niet arguments
}
```

`gtag.js` verwerkt **alleen** het letterlijke `arguments`-object dat in de
canonieke Google-snippet wordt gepusht; een gewone array wordt genegeerd.
Daardoor werden `consent default` / `config` / `page_view` allemaal in
`dataLayer` gezet maar nooit door GA4 ge-processed → GA4 configureerde
nooit. Bewezen door in de live browser-console een correct
`arguments`-object te pushen: meteen verschenen `_ga` + `_ga_<id>` +
`/g/collect`-hits.

**Fix** in [`src/lib/analytics.ts`](../src/lib/analytics.ts):

```ts
function gtag(..._args: unknown[]) {
  window.dataLayer = window.dataLayer || [];
  // eslint-disable-next-line prefer-rest-params
  window.dataLayer.push(arguments);
}
```

Na deploy live geverifieerd: `_ga` aanwezig op productie, `/g/collect`
page_view-hits gaan uit, GA4 Realtime registreert. **Meta Pixel werkte
ondertussen wél** — die heeft een eigen queue, hangt niet aan `dataLayer`.

### 9.3 EMQ-stitching: cart-attributen + webhook
Nieuwe helper [`src/lib/tracking-attributes.ts`](../src/lib/tracking-attributes.ts):

- Leest `_fbp` en `_fbc` uit cookies (Meta).
- Parse't GA4 client-id uit `_ga` (formaat `GA1.1.<cid>` → `<cid>`).
- Genereert + persisteert een stabiele `external_id` in `localStorage`
  (UUID v4). Voor ingelogde klanten wordt de Shopify customer-id (GID)
  als `external_id` gebruikt — consistenter over apparaten.
- Consent-gating: marketing-identifiers (`_fbp`/`_fbc`/`_external_id`)
  alleen ná marketing-consent; `_ga_client_id` alleen ná analytics-consent.

Nieuwe Storefront-mutation `updateCartAttributes` in
[`src/lib/shopify.ts`](../src/lib/shopify.ts) — `cartAttributesUpdate` om
cart-attributen weg te schrijven die bij checkout order-`note_attributes`
worden. Underscore-prefix (`_fbp` etc.) houdt ze verborgen voor de klant
op de orderbevestiging, maar zichtbaar in de webhook-payload.

[`src/components/CartDrawer.tsx`](../src/components/CartDrawer.tsx): bij
de afrekenklik (best-effort, 1,5s-timeout) attributen wegschrijven vóór
navigatie naar de Shopify-checkout. Faalt of duurt het te lang, dan
navigeren we sowieso door — **tracking mag de checkout nooit blokkeren**.

Webhook
[`api/shopify-order-webhook.ts`](../api/shopify-order-webhook.ts): leest
nu ook `_external_id` en hasht het (SHA-256) als `user_data.external_id`
voor Meta CAPI. `_fbp`/`_fbc`/`_ga_client_id` werden al gelezen (al
sinds Fase 10), maar de storefront schreef ze nooit weg — vanaf nu wel.

### 9.4 GA4 server-side `purchase` aanzetten
- Measurement Protocol-secret aangemaakt in GA4 (Beheer → Datastreams →
  HLTY-stream → Measurement Protocol API secrets) onder de nickname
  `vercel-webhook`.
- Twee Vercel env-vars toegevoegd op het `hlty-storefront`-project:
  - `GA4_MEASUREMENT_ID` = `G-WSSTFZQ6HX`
  - `GA4_API_SECRET` = (alleen door Stefan ingevoerd; sensitive)
- Redeploy uitgevoerd van commit `90d6891` met "latest Project Settings"
  → de webhook-functie heeft de env-vars vanaf nu in haar runtime.
- De `sendGa4Purchase`-tak in de webhook bestaat al sinds Fase 10 — was
  gated op deze twee env-vars; nu actief.
- **Sessie-koppeling**: door de `_ga_client_id`-cart-attribute krijgt
  GA4 het juiste `client_id` mee en wordt de order aan de bestaande GA4-
  sessie gelinkt i.p.v. een nieuwe gegenereerde id.

### 9.5 AEM — domeinverificatie
- `hlty.shop` toegevoegd in Meta Business (HLTY-bedrijfsportfolio,
  business_id `27351092947821517`) onder *Merkveiligheid → Domeinen*.
- Verificatiemethode: **meta-tag** (zelfde aanpak als Google Search
  Console). Token van Meta in `<head>` van
  [`index.html`](../index.html) geplaatst:
  `<meta name="facebook-domain-verification" content="3zui3j4tlf7hbdwfwq1hx9yyl3q3ny" />`.
- Na deploy + 1 klik op "Domein verifiëren" in Meta → status
  **Verified**. **Tag mag NIET uit `index.html` worden verwijderd.**
- De manuele **AEM 8-event-prioriteringstool** is niet zichtbaar in
  Meta voor accounts zonder actieve advertentiecampagnes. Meta managet
  AEM-prioritering automatisch tot er een campagne wordt aangemaakt;
  Purchase wordt voor e-commerce standaard als #1 gehanteerd. Geen
  verdere actie nodig — bij eerste campagne kan de tool opduiken en
  is het een vijf-minuten-klusje (Purchase → InitiateCheckout →
  AddToCart → ViewContent → PageView).

### 9.6 Verificatie
- **GA4 client-side fix** live bevestigd: `_ga`-cookie verschijnt na
  consent, `/g/collect` hits voor `page_view` naar `region1.google-
  analytics.com` (status 503 op deze beacons is GA-side; mechanisme
  werkt — vóór de fix vuurde er nul).
- **EMQ-helper-paden** geverifieerd via dynamische module-import op de
  dev-server: alle vijf consent-scenario's (none / analytics / marketing /
  both / null) geven correct gegate attributen; GA4 client-id-parsing
  correct; ingelogde-klant pad gebruikt customer-GID, anoniem pad een
  persistente UUID.
- **Echte `cartAttributesUpdate`-mutation** uitgevoerd tegen live Shopify
  (lege cart + twee attributen) → 200 OK, geen `userErrors` → de
  underscore-keys + de mutation zelf zijn geldig.
- **Webhook `external_id`-hashing** in isolatie gevalideerd via Node-
  snippet: 64-char SHA-256-hex zoals Meta aanbeveelt.
- **Domeinverificatie** door Meta zelf bevestigd ("Verified").
- **GA4 server-side `purchase` + EMQ-stitching end-to-end** is alleen
  bij de **eerste echte betaalde order** te valideren — pixel + webhook
  staan klaar; check GA4 Realtime/Reports en Meta Events Manager dan.

### 9.7 Code-deliveries
Commits op `main` (auto-deploy via Vercel):

- **`90d6891`** *Tracking-hardening: GA4-bugfix + EMQ/stitching-attributen + external_id*
  — `src/lib/analytics.ts`, `src/lib/shopify.ts`,
  `src/lib/tracking-attributes.ts` (nieuw), `src/components/CartDrawer.tsx`,
  `api/shopify-order-webhook.ts`.
- **`c1039e9`** *Voeg Meta domeinverificatie-meta-tag toe (AEM)* —
  `index.html`.

Restore-tag: **`backup-pre-tracking-hardening`** → `9cf24ec` (de Fase 10-
lege-redeploy-commit van vlak vóór sessie 8).

### 9.8 Bijvangst — all-producten-bug
Tijdens de sessie viel Stefan op dat `/alle-producten` *"0 producten"*
toont. Volledig gediagnosticeerd:

- **Root cause:** `PRODUCT_CARD_FRAGMENT` vraagt `collections(first: 20)`
  per product op (`src/lib/shopify.ts` ~regel 213). Genest in
  `getProducts(250, …)` (via `getAllProducts`) krijgt Shopify een interne
  time-out → `INTERNAL_SERVER_ERROR`. Verifieerd via directe queries
  tegen de live Storefront API: kosten 155–276, ruim onder het 1000-limiet
  → **geen** cost-rejectie maar een flaky backend-timeout op de
  `collections`-expansie. Sinds Fase 9 (1.096 producten in meer collecties)
  tikt het structureel over.
- **`collections(first: 5)` bij `first:250` werkt betrouwbaar** (kosten
  232). Producten zitten in max ~4 collecties (sample-bewijs), dus 5 dekt
  alle categorie-memberships.
- **Aanbevolen fix:** `collections(first: 5)` + retry-vangnet op
  `INTERNAL_SERVER_ERROR` in `getProducts`. Optioneel page size 250 → 100
  voor extra marge. Impact afgebakend: `getProducts`/`getAllProducts`
  worden alleen door de all-producten-pagina gebruikt.

Niet meegenomen in sessie 8 (Stefan pakt het apart op). Zie de
spawn-task / chip in de sessie-historie of `_next-session.md`.

---

## Bronnen (verbeterpunten-onderzoek)

- Meta for Developers — Conversions API Best Practices
- "How to Set Up Meta Conversions API: The Complete 2026 Guide" (dataally.ai)
- "Basic vs Advanced Google Consent Mode for GA4: 2026 Guide" (unifiedinfotech.net)
- "Google Consent Mode v2: complete setup guide (2026)" (flowconsent.com)
